import { useCallback, useState } from "react";
import { useSWRConfig } from "swr";
import useSWRMutation from "swr/mutation";
import { submitSwap, type Balances, type LatencyRange, type SwapReceipt } from "../../api/mockServer/mockServer";
import type { Token } from "../../data/tokens/tokens";
import { BALANCES_KEY } from "../useBalances/useBalances";

export interface SwapArgs {
  from: Token;
  to: Token;
  amountIn: bigint;
}

/**
 * Submits swaps and owns their outcome: the latest receipt (for the success toast) and the
 * latest error. On success the balances cache is written from the receipt immediately, so the
 * UI never validates the next swap against pre-swap balances while a refetch is in flight.
 */
export interface SwapExecution {
  /** Resolves to the receipt, or null if the swap failed (the error is exposed as `error`). */
  execute: (args: SwapArgs) => Promise<SwapReceipt | null>;
  receipt: SwapReceipt | null;
  dismissReceipt: () => void;
  isSubmitting: boolean;
  error: string | null;
  clearError: () => void;
}

export function useSwapExecution(latency: LatencyRange | null): SwapExecution {
  const { mutate } = useSWRConfig();
  const [receipt, setReceipt] = useState<SwapReceipt | null>(null);
  const mutation = useSWRMutation("swap", (_key: string, { arg }: { arg: SwapArgs }) =>
    submitSwap(arg.from, arg.to, arg.amountIn, latency),
  );
  const { trigger, reset: resetMutation } = mutation;

  const execute = async (args: SwapArgs): Promise<SwapReceipt | null> => {
    setReceipt(null);
    let result: SwapReceipt;
    try {
      result = await trigger(args);
    } catch {
      // The swap itself failed (useSWRMutation exposes the error). A rejection such as
      // "Insufficient balance" means our cached balances are stale, so refresh them.
      void mutate(BALANCES_KEY);
      return null;
    }

    // The swap has happened from here on, so nothing below may turn it into a "failure".
    try {
      await mutate<Balances>(BALANCES_KEY, result.balances, { revalidate: false });
    } catch {
      void mutate(BALANCES_KEY); // fall back to refetching rather than hiding the success
    }
    setReceipt(result);
    return result;
  };

  // Stable so the toast's auto-dismiss timer is not restarted by unrelated re-renders.
  const dismissReceipt = useCallback(() => setReceipt(null), []);

  return {
    execute,
    receipt,
    dismissReceipt,
    isSubmitting: mutation.isMutating,
    error: mutation.error instanceof Error ? mutation.error.message : mutation.error ? "Swap failed" : null,
    clearError: resetMutation,
  };
}
