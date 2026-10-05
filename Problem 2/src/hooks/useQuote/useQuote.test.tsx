import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SIMULATED_LATENCY } from "../../api/mockServer/mockServer";
import { convert } from "../../lib/quote/quote";
import { fixtureToken } from "../../test-utils/fixtures";
import { createWrapper } from "../../test-utils/testUtils";
import { useQuote } from "./useQuote";

const ETH = fixtureToken("ETH");
const USDC = fixtureToken("USDC");
const ONE = 10n ** 18n;
const SLOWEST_REQUEST = { timeout: SIMULATED_LATENCY.maxMs + 1000 };

describe("useQuote", () => {
  afterEach(() => vi.restoreAllMocks());

  it.each([
    ["no amount", ETH, USDC, null],
    ["a zero amount", ETH, USDC, 0n],
    ["the same token on both sides", ETH, ETH, ONE],
  ])("does not request a quote for %s", async (_case, from, to, amount) => {
    const { result } = renderHook(() => useQuote(from, to, amount), { wrapper: createWrapper() });
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  it("quotes the requested pair and amount", async () => {
    const { result } = renderHook(() => useQuote(ETH, USDC, ONE), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data).toMatchObject({ fromSymbol: "ETH", toSymbol: "USDC", amountIn: ONE });
  });

  it("keeps the latest quote when an older, slower request resolves last", async () => {
    // First request takes the maximum simulated latency, the second the minimum.
    vi.spyOn(Math, "random").mockReturnValueOnce(1).mockReturnValueOnce(0);
    const { result, rerender } = renderHook(({ amount }) => useQuote(ETH, USDC, amount), {
      wrapper: createWrapper({ isLatencyEnabled: true }),
      initialProps: { amount: ONE },
    });
    rerender({ amount: 2n * ONE });

    await waitFor(() => expect(result.current.data?.amountIn).toBe(2n * ONE), SLOWEST_REQUEST);
    // Let the slow, stale request finish too; it must not overwrite the newer quote.
    await new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY.maxMs - SIMULATED_LATENCY.minMs + 100));
    expect(result.current.data?.amountIn).toBe(2n * ONE);
  });

  it("re-quotes when a token's price changes, even for the same pair and amount", async () => {
    const { result, rerender } = renderHook(({ from }) => useQuote(from, USDC, ONE), {
      wrapper: createWrapper(),
      initialProps: { from: ETH },
    });
    await waitFor(() => expect(result.current.data?.rate).toBe(convert(ONE, ETH, USDC)));

    const repriced = { ...ETH, priceUsd: "2000" };
    rerender({ from: repriced });
    await waitFor(() => expect(result.current.data?.rate).toBe(convert(ONE, repriced, USDC)));
  });
});
