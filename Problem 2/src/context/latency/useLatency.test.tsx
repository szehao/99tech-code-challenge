import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { SIMULATED_LATENCY } from "../../api/mockServer/mockServer";
import { LatencyProvider } from "./LatencyProvider";
import { useLatency } from "./useLatency";

function wrapperWith(initiallyEnabled: boolean) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <LatencyProvider initiallyEnabled={initiallyEnabled}>{children}</LatencyProvider>;
  };
}

describe("useLatency with LatencyProvider", () => {
  it("passes no latency to API calls while disabled", () => {
    const { result } = renderHook(() => useLatency(), { wrapper: wrapperWith(false) });

    expect(result.current.isEnabled).toBe(false);
    expect(result.current.latency).toBeNull();
  });

  it("passes the simulated range once toggled on, and none once toggled back off", () => {
    const { result } = renderHook(() => useLatency(), { wrapper: wrapperWith(false) });

    act(() => result.current.toggle());
    expect(result.current).toMatchObject({ isEnabled: true, latency: SIMULATED_LATENCY });

    act(() => result.current.toggle());
    expect(result.current).toMatchObject({ isEnabled: false, latency: null });
  });

  it("keeps the same state object across re-renders, so consumers do not re-render needlessly", () => {
    const { result, rerender } = renderHook(() => useLatency(), { wrapper: wrapperWith(true) });
    const first = result.current;

    rerender();
    expect(result.current).toBe(first);
  });

  it("throws a clear error outside the provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {}); // React logs the thrown render error

    expect(() => renderHook(() => useLatency())).toThrow("useLatency must be used inside <LatencyProvider>");
  });
});
