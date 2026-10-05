import { useCallback, useMemo, useState, type ReactNode } from "react";
import { SIMULATED_LATENCY } from "../../api/mockServer/mockServer";
import { LatencyContext, type LatencyState } from "./latencyContext";

interface LatencyProviderProps {
  children: ReactNode;
  initiallyEnabled?: boolean;
}

export function LatencyProvider({ children, initiallyEnabled = false }: LatencyProviderProps) {
  const [isEnabled, setIsEnabled] = useState(initiallyEnabled);
  const toggle = useCallback(() => setIsEnabled((previous) => !previous), []);

  const value = useMemo<LatencyState>(
    () => ({ isEnabled, latency: isEnabled ? SIMULATED_LATENCY : null, toggle }),
    [isEnabled, toggle],
  );

  return <LatencyContext.Provider value={value}>{children}</LatencyContext.Provider>;
}
