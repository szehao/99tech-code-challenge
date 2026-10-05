import { afterEach, describe, expect, it, vi } from "vitest";
import { parseUnits } from "../../lib/units/units";
import { fixtureToken } from "../../test-utils/fixtures";
import { fetchBalances, fetchQuote, fetchTokens, submitSwap } from "./mockServer";

const ETH = fixtureToken("ETH");
const USDC = fixtureToken("USDC");

describe("mockServer", () => {
  afterEach(() => vi.useRealTimers());

  it("loads tokens from the price feed", async () => {
    const tokens = await fetchTokens(null);
    expect(tokens.map((token) => token.symbol)).toContain("ETH");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("waits within the configured latency range before fetching", async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    let isResolved = false;
    const pending = fetchBalances({ minMs: 100, maxMs: 300 }).then(() => {
      isResolved = true;
    });

    await vi.advanceTimersByTimeAsync(199);
    expect(isResolved).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await pending;
    expect(isResolved).toBe(true);
  });

  it("refuses to quote a token against itself", async () => {
    await expect(fetchQuote(ETH, ETH, 1n, null)).rejects.toThrow("Cannot swap a token for itself");
  });

  it("moves balances on a successful swap without mutating the previous snapshot", async () => {
    const before = await fetchBalances(null);
    const amountIn = parseUnits("1", 18);

    const receipt = await submitSwap(ETH, USDC, amountIn, null);
    const after = await fetchBalances(null);

    expect(receipt.txHash).toMatch(/^0x[0-9a-f]{64}$/);
    expect(after.ETH).toBe(before.ETH - amountIn);
    expect(after.USDC).toBe(before.USDC + receipt.quote.amountOut);
    expect(before).not.toBe(after);
  });

  it("credits a token the wallet did not hold before", async () => {
    const osmo = fixtureToken("wstETH");
    const before = await fetchBalances(null);
    await submitSwap(ETH, { ...osmo, symbol: "NEWTOKEN" }, parseUnits("1", 18), null);
    expect(before.NEWTOKEN).toBeUndefined();
    expect((await fetchBalances(null)).NEWTOKEN).toBeGreaterThan(0n);
  });

  it("rejects swaps that exceed the balance or are not positive", async () => {
    await expect(submitSwap(ETH, USDC, parseUnits("1000", 18), null)).rejects.toThrow(/Insufficient ETH/);
    await expect(submitSwap(ETH, USDC, 0n, null)).rejects.toThrow(/greater than zero/);
  });

  it("never lets overlapping swaps both spend the same balance", async () => {
    const balance = (await fetchBalances(null)).ETH;
    const results = await Promise.allSettled([
      submitSwap(ETH, USDC, balance, { minMs: 5, maxMs: 5 }),
      submitSwap(ETH, USDC, balance, { minMs: 5, maxMs: 5 }),
    ]);

    expect(results.map((result) => result.status).sort()).toEqual(["fulfilled", "rejected"]);
    expect((await fetchBalances(null)).ETH).toBe(0n);
  });

  it("returns the post-swap balances on the receipt", async () => {
    const receipt = await submitSwap(ETH, USDC, parseUnits("1", 18), null);
    expect(receipt.balances).toEqual(await fetchBalances(null));
  });

  it("treats a symbol named like an Object.prototype member as an empty balance", async () => {
    const constructorToken = { ...ETH, symbol: "constructor" };
    await expect(submitSwap(constructorToken, USDC, 1n, null)).rejects.toThrow("Insufficient constructor balance");
  });
});
