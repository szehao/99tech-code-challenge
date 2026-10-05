import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FlipButton } from "./FlipButton";

describe("FlipButton", () => {
  it("flips the pair on click", async () => {
    const user = userEvent.setup();
    const onFlip = vi.fn();
    render(<FlipButton onFlip={onFlip} />);

    await user.click(screen.getByRole("button", { name: "Swap input and output tokens" }));
    expect(onFlip).toHaveBeenCalledOnce();
  });

  it("is disabled while locked", () => {
    render(<FlipButton onFlip={vi.fn()} isLocked />);

    expect(screen.getByRole("button", { name: "Swap input and output tokens" })).toBeDisabled();
  });
});
