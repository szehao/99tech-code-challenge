import useSWR, { type SWRResponse } from "swr";
import { fetchBalances, type Balances } from "../../api/mockServer/mockServer";
import { useLatency } from "../../context/latency/useLatency";

export const BALANCES_KEY = "balances";

export function useBalances(): SWRResponse<Balances> {
  const { latency } = useLatency();
  return useSWR(BALANCES_KEY, () => fetchBalances(latency), { revalidateOnFocus: false });
}
