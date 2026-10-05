import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDebouncedValue } from "./useDebouncedValue";

const DELAY_MS = 300;

describe("useDebouncedValue", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  function renderDebounced(initial: string) {
    return renderHook(({ value }) => useDebouncedValue(value, DELAY_MS), { initialProps: { value: initial } });
  }

  it("returns the initial value immediately", () => {
    const { result } = renderDebounced("1");
    expect(result.current).toBe("1");
  });

  it("keeps the old value until the delay has passed", () => {
    const { result, rerender } = renderDebounced("1");
    rerender({ value: "12" });

    act(() => vi.advanceTimersByTime(DELAY_MS - 1));
    expect(result.current).toBe("1");

    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe("12");
  });

  it("restarts the delay on every change, so fast typing emits only the last value", () => {
    const { result, rerender } = renderDebounced("1");
    rerender({ value: "12" });
    act(() => vi.advanceTimersByTime(DELAY_MS - 1));
    rerender({ value: "123" });
    act(() => vi.advanceTimersByTime(DELAY_MS - 1));

    expect(result.current).toBe("1");

    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe("123");
  });

  it("does not update after unmount", () => {
    const { rerender, unmount } = renderDebounced("1");
    rerender({ value: "12" });
    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
