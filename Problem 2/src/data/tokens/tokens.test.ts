import { describe, expect, it } from "vitest";
import { parsePriceFeed } from "../../api/priceFeed/priceFeed";
import { parseUnits } from "../../lib/units/units";
import liveFeed from "../../test-utils/prices.json";
import { DEFAULT_FROM_SYMBOL, DEFAULT_TO_SYMBOL, INITIAL_BALANCES, TOKEN_DECIMALS } from "./tokens";

// liveFeed is a full snapshot of the live feed (the unit-test fixture is only a slice of it).
const feedSymbols = new Set(parsePriceFeed(liveFeed).map((token) => token.symbol));

/** Hardcoded data the app trusts at startup: a typo here would only surface at runtime. */
describe("token data", () => {
  it.each(Object.entries(INITIAL_BALANCES))("starting balance for %s is a valid positive amount", (_symbol, amount) => {
    expect(parseUnits(amount, TOKEN_DECIMALS)).toBeGreaterThan(0n);
  });

  it.each(Object.keys(INITIAL_BALANCES))("starting balance symbol %s is listed by the price feed", (symbol) => {
    expect(feedSymbols).toContain(symbol);
  });

  it("default pair is two different tokens the wallet starts with", () => {
    expect(DEFAULT_FROM_SYMBOL).not.toBe(DEFAULT_TO_SYMBOL);
    expect(INITIAL_BALANCES).toHaveProperty(DEFAULT_FROM_SYMBOL);
    expect(INITIAL_BALANCES).toHaveProperty(DEFAULT_TO_SYMBOL);
  });
});
