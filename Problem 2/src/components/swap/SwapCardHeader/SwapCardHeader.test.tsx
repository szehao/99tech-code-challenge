import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SwapCardHeader } from "./SwapCardHeader";

describe("SwapCardHeader", () => {
  it("titles the card with the brand name", () => {
    render(<SwapCardHeader isSlow={false} />);

    expect(screen.getByRole("heading", { level: 1, name: "99tech" })).toHaveAttribute("id", "swap-heading");
  });

  it.each([
    [false, "Demo", "Slow network"],
    [true, "Slow network", "Demo"],
  ])("with isSlow=%s says %s", (isSlow, shown, hidden) => {
    render(<SwapCardHeader isSlow={isSlow} />);

    expect(screen.getByText(shown)).toBeInTheDocument();
    expect(screen.queryByText(hidden)).not.toBeInTheDocument();
  });
});
