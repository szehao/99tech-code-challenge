import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import type { Quote } from "../../../lib/quote/quote";
import { parseUnits } from "../../../lib/units/units";
import { fixtureToken } from "../../../test-utils/fixtures";
import { SwapDetails } from "./SwapDetails";

const ETH = fixtureToken("ETH");
const USDC = fixtureToken("USDC");
const units = (amount: string) => parseUnits(amount, 18);

function quote(overrides: Partial<Quote> = {}): Quote {
  return {
    fromSymbol: "ETH",
    toSymbol: "USDC",
    amountIn: units("2"),
    amountOut: units("3200.0000009"),
    rate: units("1600"),
    valueInUsd: units("3200"),
    valueOutUsd: units("3200"),
    ...overrides,
  } as Quote;
}

function renderDetails(props: { quote?: Quote; isRefreshing?: boolean } = {}) {
  const user = userEvent.setup();
  render(
    <SwapDetails quote={props.quote ?? quote()} fromToken={ETH} toToken={USDC} isRefreshing={props.isRefreshing ?? false} />,
  );
  return { user, rate: screen.getByRole("button", { name: /1 ETH|1 USDC/ }) };
}

describe("SwapDetails", () => {
  it("shows the rate and the amount received", () => {
    const { rate } = renderDetails();

    expect(rate).toHaveTextContent("1 ETH = 1600 USDC");
    expect(screen.getByText("3200 USDC")).toBeInTheDocument();
  });

  it("inverts the rate on click and back again", async () => {
    const { user, rate } = renderDetails();

    await user.click(rate);
    expect(rate).toHaveTextContent("1 USDC = 0.000625 ETH");

    await user.click(rate);
    expect(rate).toHaveTextContent("1 ETH = 1600 USDC");
  });

  it("shows 0 for the inverted rate of a zero rate instead of dividing by zero", async () => {
    const { user, rate } = renderDetails({ quote: quote({ rate: 0n }) });

    await user.click(rate);
    expect(rate).toHaveTextContent("1 USDC = 0 ETH");
  });

  it("shows a spinner and marks the amount pending while a new quote loads", () => {
    renderDetails({ isRefreshing: true });

    expect(screen.getByTestId("spinner")).toBeInTheDocument();
    expect(screen.getByText("3200 USDC")).toHaveAttribute("data-pending", "true");
  });

  it("hides the received summary from screen readers, since the output field announces it", () => {
    renderDetails();

    expect(screen.getByText("3200 USDC").closest("[aria-hidden]")).toHaveAttribute("aria-hidden", "true");
  });
});
