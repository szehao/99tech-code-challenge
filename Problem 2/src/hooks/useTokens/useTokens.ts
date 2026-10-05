import useSWR, { type SWRResponse } from "swr";
import { fetchTokens } from "../../api/mockServer/mockServer";
import { useLatency } from "../../context/latency/useLatency";
import type { Token } from "../../data/tokens/tokens";

const TOKENS_KEY = "tokens";

/** Token list is static for the session: fetch once, never revalidate. */
export function useTokens(): SWRResponse<readonly Token[]> {
  const { latency } = useLatency();
  return useSWR(TOKENS_KEY, () => fetchTokens(latency), {
    revalidateIfStale: false,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  });
}
