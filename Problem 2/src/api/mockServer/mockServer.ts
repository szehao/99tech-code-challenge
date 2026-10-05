/**
 * Stand-in for a real backend. Token prices come from the live price feed;
 * quotes, balances and swaps are simulated locally. Every call is async and
 * can be delayed so the UI exercises real loading, caching and race paths.
 */
import { INITIAL_BALANCES, TOKEN_DECIMALS, type Token } from "../../data/tokens/tokens";
import { balanceOf } from "../../lib/balances/balances";
import { buildQuote, type Quote } from "../../lib/quote/quote";
import { parseUnits } from "../../lib/units/units";
import { fetchPriceFeed } from "../priceFeed/priceFeed";

export interface LatencyRange {
  minMs: number;
  maxMs: number;
}

export const SIMULATED_LATENCY: LatencyRange = { minMs: 600, maxMs: 1800 };

export type Balances = Readonly<Record<string, bigint>>;

export interface SwapReceipt {
  txHash: string;
  quote: Quote;
  /** Wallet balances after the swap, so the client can update without a refetch. */
  balances: Balances;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function simulateNetwork(latency: LatencyRange | null): Promise<void> {
  if (!latency) return;
  const span = latency.maxMs - latency.minMs;
  await sleep(latency.minMs + Math.random() * span);
}

function seedBalances(): Balances {
  return Object.fromEntries(
    Object.entries(INITIAL_BALANCES).map(([symbol, amount]) => [symbol, parseUnits(amount, TOKEN_DECIMALS)]),
  );
}

// The "server-side" wallet. Replaced wholesale on each swap, never mutated.
let walletBalances: Balances = seedBalances();

export function resetMockServer(): void {
  walletBalances = seedBalances();
}

export async function fetchTokens(latency: LatencyRange | null): Promise<readonly Token[]> {
  await simulateNetwork(latency);
  return fetchPriceFeed();
}

export async function fetchBalances(latency: LatencyRange | null): Promise<Balances> {
  await simulateNetwork(latency);
  return walletBalances;
}

export async function fetchQuote(from: Token, to: Token, amountIn: bigint, latency: LatencyRange | null): Promise<Quote> {
  await simulateNetwork(latency);
  if (from.symbol === to.symbol) throw new Error("Cannot swap a token for itself");
  return buildQuote(amountIn, from, to);
}

function fakeTxHash(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return `0x${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

export async function submitSwap(from: Token, to: Token, amountIn: bigint, latency: LatencyRange | null): Promise<SwapReceipt> {
  await simulateNetwork(latency);

  if (amountIn <= 0n) throw new Error("Amount must be greater than zero");
  if (from.symbol === to.symbol) throw new Error("Cannot swap a token for itself");

  // Check, re-quote and write with no await in between, so overlapping swaps can't
  // both pass the balance check against the same snapshot (a lost update).
  const available = balanceOf(walletBalances, from.symbol);
  if (amountIn > available) throw new Error(`Insufficient ${from.symbol} balance`);
  const quote = buildQuote(amountIn, from, to); // the client's quote may be stale
  walletBalances = {
    ...walletBalances,
    [from.symbol]: available - amountIn,
    [to.symbol]: balanceOf(walletBalances, to.symbol) + quote.amountOut,
  };

  return { txHash: fakeTxHash(), quote, balances: walletBalances };
}
