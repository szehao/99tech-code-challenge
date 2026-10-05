import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { getTokenIconUrl } from "../../../assets/tokens/tokenIcons";
import { TokenIcon } from "./TokenIcon";

/** The logo is decorative (alt=""), which gives it the presentation role. */
const queryLogo = () => screen.queryByRole("presentation");

describe("TokenIcon", () => {
  it.each(["ETH", "USDC", "STEVMOS", "wstETH", "bNEO"])("renders the %s logo", (symbol) => {
    render(<TokenIcon symbol={symbol} />);
    expect(getTokenIconUrl(symbol)).toBeTruthy();
    expect(queryLogo()).toHaveAttribute("src", getTokenIconUrl(symbol));
  });

  it("loads logos lazily so only on-screen icons are downloaded", () => {
    render(<TokenIcon symbol="ETH" />);
    expect(queryLogo()).toHaveAttribute("loading", "lazy");
  });

  it("falls back to initials for a token without a logo", () => {
    render(<TokenIcon symbol="nope" />);
    expect(queryLogo()).not.toBeInTheDocument();
    expect(screen.getByText("NO")).toBeInTheDocument();
  });

  it("falls back to initials when the logo fails to load", () => {
    render(<TokenIcon symbol="ATOM" />);
    fireEvent.error(queryLogo()!);
    expect(queryLogo()).not.toBeInTheDocument();
    expect(screen.getByText("AT")).toBeInTheDocument();
  });
});
