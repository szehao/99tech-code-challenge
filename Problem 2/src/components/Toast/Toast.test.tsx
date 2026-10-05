import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Toast, TOAST_DURATION_MS } from "./Toast";

describe("Toast", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("renders in place so it follows its trigger in DOM order (and Tab order)", () => {
    render(
      <section aria-label="Toast host">
        <Toast title="Done" onClose={() => {}} />
      </section>,
    );
    // A portal would render outside the host, at the end of <body>.
    expect(within(screen.getByRole("region", { name: "Toast host" })).getByText("Done")).toBeInTheDocument();
  });

  it("closes itself after 3 seconds", () => {
    const onClose = vi.fn();
    render(<Toast title="Done" onClose={onClose} />);

    act(() => vi.advanceTimersByTime(TOAST_DURATION_MS - 1));
    expect(onClose).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(TOAST_DURATION_MS).toBe(3000);
  });

  it("closes immediately via the cross button", () => {
    const onClose = vi.fn();
    render(<Toast title="Done" onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: "Dismiss notification" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not restart the countdown when re-rendered with the same handler", () => {
    const onClose = vi.fn();
    const { rerender } = render(<Toast title="Done" onClose={onClose} />);
    act(() => vi.advanceTimersByTime(2000));
    rerender(<Toast title="Done" onClose={onClose} />);
    act(() => vi.advanceTimersByTime(1000));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("clears its timer when unmounted early", () => {
    const onClose = vi.fn();
    const { unmount } = render(<Toast title="Done" onClose={onClose} />);
    unmount();
    act(() => vi.advanceTimersByTime(TOAST_DURATION_MS));
    expect(onClose).not.toHaveBeenCalled();
  });

  it("pauses while hovered and resumes with only the remaining time", () => {
    const onClose = vi.fn();
    render(<Toast title="Done" onClose={onClose} />);
    const toast = screen.getByText("Done").closest(".toast")!;

    act(() => vi.advanceTimersByTime(1000));
    fireEvent.mouseEnter(toast);
    expect(toast).toHaveAttribute("data-paused", "true");
    act(() => vi.advanceTimersByTime(10_000));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.mouseLeave(toast);
    expect(toast).toHaveAttribute("data-paused", "false");
    act(() => vi.advanceTimersByTime(1999));
    expect(onClose).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("keeps the remaining time across repeated hovers", () => {
    const onClose = vi.fn();
    render(<Toast title="Done" onClose={onClose} />);
    const toast = screen.getByText("Done").closest(".toast")!;

    for (let lap = 0; lap < 3; lap += 1) {
      act(() => vi.advanceTimersByTime(900));
      fireEvent.mouseEnter(toast);
      act(() => vi.advanceTimersByTime(5000));
      fireEvent.mouseLeave(toast);
    }
    expect(onClose).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(300));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("pauses while keyboard focus is inside it", () => {
    const onClose = vi.fn();
    render(<Toast title="Done" onClose={onClose} />);
    const closeButton = screen.getByRole("button", { name: "Dismiss notification" });

    act(() => closeButton.focus());
    act(() => vi.advanceTimersByTime(10_000));
    expect(onClose).not.toHaveBeenCalled();

    act(() => closeButton.blur());
    act(() => vi.advanceTimersByTime(TOAST_DURATION_MS));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("starts paused when it appears under a cursor that is already resting there", () => {
    const realMatches = Element.prototype.matches;
    vi.spyOn(Element.prototype, "matches").mockImplementation(function (this: Element, selector: string) {
      return selector === ":hover" || realMatches.call(this, selector);
    });
    const onClose = vi.fn();
    render(<Toast title="Done" onClose={onClose} />);
    const toast = screen.getByText("Done").closest(".toast")!;

    expect(toast).toHaveAttribute("data-paused", "true");
    act(() => vi.advanceTimersByTime(10_000));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.mouseLeave(toast);
    act(() => vi.advanceTimersByTime(TOAST_DURATION_MS));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("resumes counting down when focus leaves the page entirely (e.g. switching windows)", () => {
    // Deliberate: a blur with no new focus target is treated as focus leaving the toast.
    const onClose = vi.fn();
    render(<Toast title="Done" onClose={onClose} />);
    const closeButton = screen.getByRole("button", { name: "Dismiss notification" });

    act(() => closeButton.focus());
    fireEvent.blur(closeButton, { relatedTarget: null });
    act(() => vi.advanceTimersByTime(TOAST_DURATION_MS));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
