import { createContext } from "react";
import type { LatencyRange } from "../../api/mockServer/mockServer";

export interface LatencyState {
  isEnabled: boolean;
  /** The delay range to pass to mock API calls, or null when disabled. */
  latency: LatencyRange | null;
  toggle: () => void;
}

export const LatencyContext = createContext<LatencyState | null>(null);
