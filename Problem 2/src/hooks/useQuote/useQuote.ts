import useSWR, { type SWRResponse } from "swr";
import { fetchQuote } from "../../api/mockServer/mockServer";
import type { Token } from "../../data/tokens/tokens";
import { useLatency } from "../../context/latency/useLatency";
import type { Quote } from "../../lib/quote/quote";

/** Identical quotes requested within this window are served from cache. */
const QUOTE_CACHE_MS = 30_000;

type QuoteKey = readonly ["quote", Token, Token, string];

function quoteKey(from: Token | undefined, to: Token | undefined, amountIn: bigint | null): QuoteKey | null {
  if (!from || !to || from.symbol === to.symbol || amountIn === null || amountIn <= 0n) return null;
  return ["quote", from, to, amountIn.toString()];
}

/**
 * Quotes are cached per (from, to, amount). The Token objects (including their prices) are part
 * of the key, and SWR hashes plain objects by content: if the token list were ever re-fetched with
 * new prices, those would produce new keys rather than serve a quote priced from old data. (Today
 * useTokens loads prices once per session.) The amount is a base-unit string because bigint is
 * not JSON-safe. The fetcher reads the tokens and amount from the key; latency is the one value
 * it takes from the render closure (SWR always calls the latest fetcher). Latency is deliberately
 * not in the key: toggling it should not invalidate cached quotes.
 */
export function useQuote(from: Token | undefined, to: Token | undefined, amountIn: bigint | null): SWRResponse<Quote> {
  const { latency } = useLatency();

  return useSWR(quoteKey(from, to, amountIn), ([, fromToken, toToken, amount]: QuoteKey) =>
    fetchQuote(fromToken, toToken, BigInt(amount), latency), {
    dedupingInterval: QUOTE_CACHE_MS,
    revalidateOnFocus: false,
    keepPreviousData: true,
  });
}
