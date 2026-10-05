import { describe, expect, it } from "vitest";
import { fixtureToken } from "../../test-utils/fixtures";
import { buildQuote, convert, toUsdValue } from "./quote";
import { parseUnits } from "../units/units";

const ETH = fixtureToken("ETH");
const USDC = fixtureToken("USDC");
const SWTH = fixtureToken("SWTH");

describe("convert", () => {
  it("converts at the ratio of the two USD prices, rounding down", () => {
    // 1645.9337373737374 / 0.9998782611186441
    expect(convert(parseUnits("1", 18), ETH, USDC)).toBe(parseUnits("1646.134135902003871015", 18));
  });

  it("converts small values in the other direction", () => {
    expect(convert(parseUnits("1", 18), USDC, ETH)).toBe(parseUnits("0.000607483909233221", 18));
  });

  it("rounds a single base unit of a cheap token down to zero", () => {
    expect(convert(1n, SWTH, ETH)).toBe(0n);
  });

  it("converts between tokens of different decimals", () => {
    const sixDecimalUsdc = { ...USDC, decimals: 6 };
    expect(convert(parseUnits("1", 18), ETH, sixDecimalUsdc)).toBe(1_646_134_135n);
  });
});

describe("toUsdValue", () => {
  it("values an amount at the token's price", () => {
    expect(toUsdValue(parseUnits("2", 18), ETH)).toBe(parseUnits("3291.8674747474748", 18));
  });
});

describe("buildQuote", () => {
  it("charges no fee: output equals the straight conversion", () => {
    const amountIn = parseUnits("1.5", 18);
    const quote = buildQuote(amountIn, ETH, USDC);

    expect(quote.amountOut).toBe(convert(amountIn, ETH, USDC));
    expect(quote.amountOut).toBe(parseUnits("2469.201203853005806523", 18));
    expect(quote.rate).toBe(convert(parseUnits("1", 18), ETH, USDC));
  });

  it("quotes a token against itself at 1:1", () => {
    const quote = buildQuote(parseUnits("1000", 18), USDC, USDC);
    expect(quote.amountOut).toBe(parseUnits("1000", 18));
    expect(quote.valueInUsd).toBe(quote.valueOutUsd);
  });

  it("returns zero output for a zero input", () => {
    expect(buildQuote(0n, ETH, USDC).amountOut).toBe(0n);
  });

  it("rejects negative input", () => {
    expect(() => buildQuote(-1n, ETH, USDC)).toThrow(RangeError);
  });
});
