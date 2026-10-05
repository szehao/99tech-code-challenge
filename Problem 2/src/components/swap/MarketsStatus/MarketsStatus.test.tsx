import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MarketsStatus } from "./MarketsStatus";

describe("MarketsStatus", () => {
  it("announces that markets are loading", () => {
    render(<MarketsStatus hasError={false} onRetry={vi.fn()} />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading markets…");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("alerts on a failed load and retries on request", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<MarketsStatus hasError onRetry={onRetry} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Could not load token prices.");
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
