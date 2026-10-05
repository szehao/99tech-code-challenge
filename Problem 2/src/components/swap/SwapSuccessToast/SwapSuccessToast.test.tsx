import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { SwapReceipt } from "../../../api/mockServer/mockServer";
import { parseUnits } from "../../../lib/units/units";
import { FIXTURE_TOKENS } from "../../../test-utils/fixtures";
import { SwapSuccessToast } from "./SwapSuccessToast";

const units = (amount: string) => parseUnits(amount, 18);

function receipt(fromSymbol = "ETH", toSymbol = "USDC"): SwapReceipt {
  return {
    txHash: "0xabc123",
    balances: {},
    quote: {
      fromSymbol,
      toSymbol,
      amountIn: units("1.5"),
      amountOut: units("2468.8999999"),
      rate: units("1645.93"),
      valueInUsd: units("2468.9"),
      valueOutUsd: units("2468.9"),
    },
  } as SwapReceipt;
}

describe("SwapSuccessToast", () => {
  it("summarises the swap, rounding the received amount down", () => {
    render(<SwapSuccessToast receipt={receipt()} tokens={FIXTURE_TOKENS} onClose={vi.fn()} />);

    expect(screen.getByText("Swap successful")).toBeInTheDocument();
    expect(screen.getByText("1.5 ETH → 2468.89 USDC")).toBeInTheDocument();
  });

  it("links to the transaction in a new tab without giving it access to this page", () => {
    render(<SwapSuccessToast receipt={receipt()} tokens={FIXTURE_TOKENS} onClose={vi.fn()} />);

    const link = screen.getByRole("link", { name: "View TX" });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAttribute("title", "0xabc123");
  });

  it("closes from its dismiss button", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<SwapSuccessToast receipt={receipt()} tokens={FIXTURE_TOKENS} onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "Dismiss notification" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("renders nothing for a token missing from the list", () => {
    const { container } = render(
      <SwapSuccessToast receipt={receipt("ETH", "NOPE")} tokens={FIXTURE_TOKENS} onClose={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
