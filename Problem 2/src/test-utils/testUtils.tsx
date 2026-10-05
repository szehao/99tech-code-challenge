import { render } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import type { ReactElement, ReactNode } from "react";
import { SWRConfig, type SWRConfiguration } from "swr";
import { LatencyProvider } from "../context/latency/LatencyProvider";

export interface ProviderOptions {
  /** Start with simulated network latency switched on. */
  isLatencyEnabled?: boolean;
  /** Overrides for the test SWR config. */
  swr?: SWRConfiguration;
}

/**
 * The app's providers for a test: an isolated SWR cache (so nothing leaks between tests, but
 * everything rendered with the same wrapper shares it), no request deduping and no retries.
 */
export function createWrapper({ isLatencyEnabled = false, swr }: ProviderOptions = {}) {
  const cache = new Map();
  const config: SWRConfiguration = { provider: () => cache, dedupingInterval: 0, shouldRetryOnError: false, ...swr };
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <SWRConfig value={config}>
        <LatencyProvider initiallyEnabled={isLatencyEnabled}>{children}</LatencyProvider>
      </SWRConfig>
    );
  };
}

export function renderWithProviders(ui: ReactElement, options?: ProviderOptions): { user: UserEvent } {
  const user = userEvent.setup();
  render(ui, { wrapper: createWrapper(options) });
  return { user };
}
