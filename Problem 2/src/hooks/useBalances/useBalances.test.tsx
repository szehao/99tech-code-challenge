import { act, renderHook, waitFor } from "@testing-library/react";
import { useSWRConfig } from "swr";
import { describe, expect, it } from "vitest";
import { submitSwap } from "../../api/mockServer/mockServer";
import { INITIAL_BALANCES, TOKEN_DECIMALS } from "../../data/tokens/tokens";
import { parseUnits } from "../../lib/units/units";
import { fixtureToken } from "../../test-utils/fixtures";
import { createWrapper } from "../../test-utils/testUtils";
import { BALANCES_KEY, useBalances } from "./useBalances";

const ETH = fixtureToken("ETH");
const USDC = fixtureToken("USDC");
const STARTING_ETH = parseUnits(INITIAL_BALANCES.ETH, TOKEN_DECIMALS);

describe("useBalances", () => {
  it("loads the starting wallet in base units", async () => {
    const { result } = renderHook(() => useBalances(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.data?.ETH).toBe(STARTING_ETH));
  });

  it("refreshes when BALANCES_KEY is revalidated, as useSwapExecution does after a swap", async () => {
    const { result } = renderHook(() => ({ balances: useBalances(), swr: useSWRConfig() }), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.balances.data?.ETH).toBe(STARTING_ETH));

    const amountIn = parseUnits("1", TOKEN_DECIMALS);
    await submitSwap(ETH, USDC, amountIn, null);
    await act(() => result.current.swr.mutate(BALANCES_KEY));

    expect(result.current.balances.data?.ETH).toBe(STARTING_ETH - amountIn);
  });
});
