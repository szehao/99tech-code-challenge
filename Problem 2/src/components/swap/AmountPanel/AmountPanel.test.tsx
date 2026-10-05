import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { parseUnits } from "../../../lib/units/units";
import { FIXTURE_TOKENS, fixtureToken } from "../../../test-utils/fixtures";
import { AmountPanel } from "./AmountPanel";

const ETH = fixtureToken("ETH");
const USDC = fixtureToken("USDC");
const units = (amount: string) => parseUnits(amount, 18);

function renderPanel(props: Partial<ComponentProps<typeof AmountPanel>> = {}) {
  const user = userEvent.setup();
  render(
    <AmountPanel
      heading="Amount to send"
      selectLabel="Select token to pay with"
      tokens={FIXTURE_TOKENS}
      token={ETH}
      counterpart={USDC}
      balances={{ ETH: units("2.5") }}
      usdValue={null}
      onSelectToken={vi.fn()}
      {...props}
    />,
  );
  return { user, input: screen.getByLabelText(props.heading ?? "Amount to send") };
}

describe("AmountPanel", () => {
  describe("editable (pay) side", () => {
    it("shows the typed text and reports every change", async () => {
      const onChange = vi.fn();
      const { user, input } = renderPanel({ value: "1", onChange });

      expect(input).toHaveValue("1");
      expect(input).not.toHaveAttribute("readonly");
      await user.type(input, "2");
      expect(onChange).toHaveBeenLastCalledWith("12");
    });

    it("is disabled while a swap is in flight", () => {
      const { input } = renderPanel({ value: "1", onChange: vi.fn(), isLocked: true });

      expect(input).toBeDisabled();
    });
  });

  describe("read-only (receive) side", () => {
    it("rounds the output down so it never overstates what will be received", () => {
      const { input } = renderPanel({ heading: "Amount to receive", outputAmount: units("2.1234569") });

      expect(input).toHaveValue("2.12345");
      expect(input).toHaveAttribute("readonly");
    });

    it("is empty without an output amount", () => {
      const { input } = renderPanel({ heading: "Amount to receive", outputAmount: null });

      expect(input).toHaveValue("");
    });
  });

  it("shows the USD value", () => {
    renderPanel({ usdValue: units("2468.9") });

    expect(screen.getByText("$2,468.90")).toBeInTheDocument();
  });

  it("shows a placeholder balance until balances load", () => {
    renderPanel({ balances: undefined });

    expect(screen.getByText("…")).toBeInTheDocument();
  });

  it("fills the max balance on Max", async () => {
    const onMax = vi.fn();
    const { user } = renderPanel({ onChange: vi.fn(), onMax });

    expect(screen.getByText("2.5")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Max" }));
    expect(onMax).toHaveBeenCalledOnce();
  });

  it("disables Max while locked", () => {
    renderPanel({ onChange: vi.fn(), onMax: vi.fn(), isLocked: true });

    expect(screen.getByRole("button", { name: "Max" })).toBeDisabled();
  });

  it.each([
    ["the balance is zero", { USDC: units("1") }],
    ["balances have not loaded", undefined],
  ])("hides Max when %s", (_case, balances) => {
    renderPanel({ onChange: vi.fn(), onMax: vi.fn(), balances });

    expect(screen.queryByRole("button", { name: "Max" })).not.toBeInTheDocument();
  });
});
