import { act, renderHook } from "@testing-library/react";
import { useSWRConfig } from "swr";
import { describe, expect, it } from "vitest";
import type { Balances } from "../../api/mockServer/mockServer";
import { fixtureToken } from "../../test-utils/fixtures";
import { createWrapper } from "../../test-utils/testUtils";
import { BALANCES_KEY } from "../useBalances/useBalances";
import { useSwapExecution } from "./useSwapExecution";

const ETH = fixtureToken("ETH");
const USDC = fixtureToken("USDC");
const ONE = 10n ** 18n;

function useExecutionWithCache() {
  return { swap: useSwapExecution(null), cache: useSWRConfig().cache };
}

describe("useSwapExecution", () => {
  it("returns the receipt and writes post-swap balances straight into the cache", async () => {
    const { result } = renderHook(useExecutionWithCache, { wrapper: createWrapper() });

    let receipt: Awaited<ReturnType<typeof result.current.swap.execute>> = null;
    await act(async () => {
      receipt = await result.current.swap.execute({ from: ETH, to: USDC, amountIn: ONE });
    });

    expect(receipt).not.toBeNull();
    expect(result.current.swap.receipt).toBe(receipt);
    expect(result.current.swap.error).toBeNull();
    const cached = result.current.cache.get(BALANCES_KEY)?.data as Balances;
    expect(cached).toBe(receipt!.balances);
    expect(cached.ETH).toBe(4_218_304_771_000_000_000n - ONE);
  });

  it("exposes a failure as an error message and clears it on request", async () => {
    const { result } = renderHook(useExecutionWithCache, { wrapper: createWrapper() });

    let receipt: unknown = "unset";
    await act(async () => {
      receipt = await result.current.swap.execute({ from: ETH, to: USDC, amountIn: 1000n * ONE });
    });
    expect(receipt).toBeNull();
    expect(result.current.swap.error).toBe("Insufficient ETH balance");

    act(() => result.current.swap.clearError());
    expect(result.current.swap.error).toBeNull();
  });

  it("dismisses the receipt", async () => {
    const { result } = renderHook(useExecutionWithCache, { wrapper: createWrapper() });
    await act(async () => {
      await result.current.swap.execute({ from: ETH, to: USDC, amountIn: ONE });
    });

    act(() => result.current.swap.dismissReceipt());
    expect(result.current.swap.receipt).toBeNull();
  });

  it("clears the previous receipt as soon as a new swap starts", async () => {
    const { result } = renderHook(useExecutionWithCache, { wrapper: createWrapper() });
    await act(async () => {
      await result.current.swap.execute({ from: ETH, to: USDC, amountIn: ONE });
    });
    expect(result.current.swap.receipt).not.toBeNull();

    let second: Promise<unknown> = Promise.resolve();
    act(() => {
      second = result.current.swap.execute({ from: ETH, to: USDC, amountIn: ONE });
    });
    expect(result.current.swap.receipt).toBeNull();
    await act(async () => {
      await second;
    });
    expect(result.current.swap.receipt).not.toBeNull();
  });
});
