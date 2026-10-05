import { useContext } from "react";
import { LatencyContext, type LatencyState } from "./latencyContext";

export function useLatency(): LatencyState {
  const context = useContext(LatencyContext);
  if (!context) throw new Error("useLatency must be used inside <LatencyProvider>");
  return context;
}
