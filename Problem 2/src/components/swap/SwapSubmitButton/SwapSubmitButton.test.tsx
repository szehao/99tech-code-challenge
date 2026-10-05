import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { SwapStatus } from "../useSwapCard/useSwapCard";
import { SwapSubmitButton } from "./SwapSubmitButton";

function renderButton(status: SwapStatus) {
  render(<SwapSubmitButton status={status} />);
  return screen.getByRole("button", { name: status.label });
}

describe("SwapSubmitButton", () => {
  it.each<[SwapStatus["kind"], boolean]>([
    ["ready", false],
    ["error", false],
    ["idle", true],
    ["blocked", true],
    ["quoting", true],
    ["submitting", true],
    ["loading", true],
  ])("for %s is disabled=%s", (kind, isDisabled) => {
    const button = renderButton({ kind, label: `Status ${kind}` } as SwapStatus);

    expect((button as HTMLButtonElement).disabled).toBe(isDisabled);
    expect(button).toHaveAttribute("type", "submit");
  });

  it.each<SwapStatus["kind"]>(["quoting", "submitting"])("shows a spinner while %s", (kind) => {
    renderButton({ kind, label: "Working" } as SwapStatus);

    expect(screen.getByTestId("spinner")).toBeInTheDocument();
  });

  it("shows no spinner when ready", () => {
    renderButton({ kind: "ready", label: "Swap ETH for USDC" });

    expect(screen.queryByTestId("spinner")).not.toBeInTheDocument();
  });
});
