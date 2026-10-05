import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FIXTURE_TOKENS, fixtureToken } from "../../test-utils/fixtures";
import { TokenSelect } from "./TokenSelect";

// FIXTURE_TOKENS order: ATOM, ETH, OSMO, SWTH, USDC, WBTC, wstETH
function renderSelect(onSelect = vi.fn()) {
  const user = userEvent.setup();
  render(
    <TokenSelect
      label="Select token to pay with"
      tokens={FIXTURE_TOKENS}
      selected={fixtureToken("ETH")}
      counterpart={fixtureToken("USDC")}
      balances={{ ETH: 10n ** 18n }}
      onSelect={onSelect}
    />,
  );
  return { user, onSelect, trigger: screen.getByRole("button", { name: /Select token to pay with/ }) };
}

/** The option for a symbol; its accessible name is the symbol, an optional tag, then the price. */
function optionFor(symbol: string): HTMLElement {
  return screen.getByRole("option", { name: new RegExp(`^${symbol}(swap sides)?\\s*\\$`) });
}

function expectActiveOption(symbol: string): void {
  expect(screen.getByRole("combobox")).toHaveAttribute("aria-activedescendant", optionFor(symbol).id);
}

describe("TokenSelect", () => {
  it("announces the selected token on the trigger and reflects the open state", async () => {
    const { user, trigger } = renderSelect();
    expect(trigger).toHaveAccessibleName("Select token to pay with, ETH selected");
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    await user.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("combobox")).toHaveFocus();
  });

  it("opens on the selected token and marks it aria-selected", async () => {
    const { user, trigger } = renderSelect();
    await user.click(trigger);

    expectActiveOption("ETH");
    const selected = within(screen.getByRole("listbox")).getAllByRole("option", { selected: true });
    expect(selected).toHaveLength(1);
    expect(selected[0]).toHaveTextContent("ETH");
  });

  it("moves the active option with the arrow keys, wrapping at both ends", async () => {
    const { user, trigger } = renderSelect();
    await user.click(trigger);

    await user.keyboard("{ArrowDown}");
    expectActiveOption("OSMO");
    await user.keyboard("{ArrowUp}{ArrowUp}");
    expectActiveOption("ATOM");
    await user.keyboard("{ArrowUp}");
    expectActiveOption("wstETH");
    await user.keyboard("{ArrowDown}");
    expectActiveOption("ATOM");
  });

  it("jumps to the first and last options with Home and End", async () => {
    const { user, trigger } = renderSelect();
    await user.click(trigger);

    await user.keyboard("{End}");
    expectActiveOption("wstETH");
    await user.keyboard("{Home}");
    expectActiveOption("ATOM");
  });

  it("selects the active option with Enter and returns focus to the trigger", async () => {
    const { user, onSelect, trigger } = renderSelect();
    await user.click(trigger);
    await user.keyboard("{ArrowDown}{Enter}");

    expect(onSelect).toHaveBeenCalledWith("OSMO");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("closes without selecting on Tab", async () => {
    const { user, onSelect, trigger } = renderSelect();
    await user.click(trigger);
    await user.keyboard("{Tab}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("tags the token on the other side as a side swap", async () => {
    const { user, trigger } = renderSelect();
    await user.click(trigger);

    const usdc = screen.getByRole("option", { name: /USDC/ });
    expect(within(usdc).getByText("swap sides")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /OSMO/ })).not.toHaveTextContent("swap sides");
  });

  it("filters by symbol, case-insensitively, and resets the active option", async () => {
    const { user, trigger } = renderSelect();
    await user.click(trigger);
    await user.type(screen.getByRole("combobox"), "STETH");

    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
      expect.stringContaining("wstETH"),
    ]);
    expectActiveOption("wstETH");
  });
});
