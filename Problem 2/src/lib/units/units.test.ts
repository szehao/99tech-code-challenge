import { describe, expect, it } from "vitest";
import {
  formatDisplay,
  formatSwapAmount,
  formatUsd,
  MAX_INTEGER_DIGITS,
  formatUnits,
  parseUnits,
  sanitizeAmountInput,
} from "./units";

describe("parseUnits", () => {
  it("parses whole and fractional amounts into base units", () => {
    expect(parseUnits("1.5", 18)).toBe(1_500_000_000_000_000_000n);
    expect(parseUnits("0.000001", 6)).toBe(1n);
    expect(parseUnits("42", 0)).toBe(42n);
    expect(parseUnits(".5", 2)).toBe(50n);
    expect(parseUnits("7.", 2)).toBe(700n);
  });

  it("keeps full precision for 18-decimal values beyond float range", () => {
    expect(parseUnits("123456789012345678.123456789012345678", 18)).toBe(
      123456789012345678123456789012345678n,
    );
  });

  it.each(["", ".", "abc", "1.2.3", "-1", "1e18"])("rejects malformed input %j", (value) => {
    expect(() => parseUnits(value, 18)).toThrow();
  });

  it("rejects more fractional digits than the token supports", () => {
    expect(() => parseUnits("0.0000001", 6)).toThrow(/more than 6 decimal places/);
  });

  it("rejects invalid decimals", () => {
    expect(() => parseUnits("1", 19)).toThrow();
    expect(() => parseUnits("1", -1)).toThrow();
  });
});

describe("formatUnits", () => {
  it("round-trips with parseUnits and trims trailing zeros", () => {
    expect(formatUnits(parseUnits("1.500", 18), 18)).toBe("1.5");
    expect(formatUnits(1n, 18)).toBe("0.000000000000000001");
    expect(formatUnits(1_000_000n, 6)).toBe("1");
    expect(formatUnits(5n, 0)).toBe("5");
  });

  it("formats negative amounts", () => {
    expect(formatUnits(-1_500_000n, 6)).toBe("-1.5");
  });
});

describe("formatDisplay", () => {
  it("groups thousands and truncates to the requested precision", () => {
    expect(formatDisplay(parseUnits("1234567.123456789", 18), 18, 4)).toBe("1,234,567.1234");
  });

  it("shows a floor marker instead of a misleading zero", () => {
    expect(formatDisplay(1n, 18, 6)).toBe("<0.000001");
  });

  it("returns 0 for zero", () => {
    expect(formatDisplay(0n, 18)).toBe("0");
  });

  it("does not exceed the token's own decimals", () => {
    expect(formatDisplay(123n, 2, 6)).toBe("1.23");
  });
});

describe("formatUsd", () => {
  const usd = (value: string) => parseUnits(value, 18);

  it("always shows two decimals, like money", () => {
    expect(formatUsd(usd("2468.9"), 18)).toBe("$2,468.90");
    expect(formatUsd(usd("1"), 18)).toBe("$1.00");
    expect(formatUsd(usd("1234567.891"), 18)).toBe("$1,234,567.89");
  });

  it("rounds down to the cent", () => {
    expect(formatUsd(usd("0.019"), 18)).toBe("$0.01");
  });

  it("shows zero and sub-cent values honestly", () => {
    expect(formatUsd(0n, 18)).toBe("$0.00");
    expect(formatUsd(usd("0.004"), 18)).toBe("<$0.01");
  });
});

describe("sanitizeAmountInput", () => {
  it("accepts partial input a user is still typing", () => {
    expect(sanitizeAmountInput("", 18)).toBe("");
    expect(sanitizeAmountInput("1.", 18)).toBe("1.");
    expect(sanitizeAmountInput(".5", 18)).toBe("0.5");
  });

  it("strips thousands separators", () => {
    expect(sanitizeAmountInput("1,000", 18)).toBe("1000");
    expect(sanitizeAmountInput("12,500.42", 18)).toBe("12500.42");
  });

  it("rejects letters and signs", () => {
    expect(sanitizeAmountInput("1a", 18)).toBeNull();
    expect(sanitizeAmountInput("-1", 18)).toBeNull();
  });

  it("strips redundant leading zeros but keeps a lone zero", () => {
    expect(sanitizeAmountInput("007", 18)).toBe("7");
    expect(sanitizeAmountInput("0000", 18)).toBe("0");
    expect(sanitizeAmountInput("0", 18)).toBe("0");
    expect(sanitizeAmountInput("0.", 18)).toBe("0.");
    expect(sanitizeAmountInput("00.5", 18)).toBe("0.5");
  });

  it("rejects amounts with an absurdly long whole-number part", () => {
    const longest = "9".repeat(MAX_INTEGER_DIGITS);
    expect(sanitizeAmountInput(longest, 18)).toBe(longest);
    expect(sanitizeAmountInput(`${longest}.5`, 18)).toBe(`${longest}.5`);
    expect(sanitizeAmountInput(`${longest}9`, 18)).toBeNull();
    expect(sanitizeAmountInput(`000${longest}`, 18)).toBe(longest); // leading zeros don't count
  });

  it("truncates digits beyond the token's decimals, including pasted values", () => {
    expect(sanitizeAmountInput("0.1234567", 6)).toBe("0.123456");
    expect(sanitizeAmountInput("1.1234567890123456789", 18)).toBe("1.123456789012345678");
    expect(sanitizeAmountInput("1.", 0)).toBe("1");
    expect(sanitizeAmountInput(".5", 0)).toBe("0");
  });
});

describe("formatSwapAmount", () => {
  const amount = (value: string) => parseUnits(value, 18);

  it("shows zero plainly", () => {
    expect(formatSwapAmount(0n, 18)).toBe("0");
  });

  it("uses 6 significant figures at or above 1, without grouping", () => {
    expect(formatSwapAmount(amount("1646.134135902003871015"), 18)).toBe("1646.13");
    expect(formatSwapAmount(amount("1.5"), 18)).toBe("1.5");
    expect(formatSwapAmount(amount("2.123456789"), 18)).toBe("2.12346");
  });

  it("keeps 6 significant figures above one million, like Intl does", () => {
    expect(formatSwapAmount(amount("1234567.89"), 18)).toBe("1234570");
    expect(formatSwapAmount(amount("6436000000.5"), 18)).toBe("6436000000");
    expect(formatSwapAmount(amount("999999"), 18)).toBe("999999");
  });

  it("uses 2 to 5 decimals between 0.1 and 1", () => {
    expect(formatSwapAmount(amount("0.5"), 18)).toBe("0.50");
    expect(formatSwapAmount(amount("0.123456789"), 18)).toBe("0.12346");
  });

  it("uses 6 significant figures below 0.1", () => {
    expect(formatSwapAmount(amount("0.000607483909233221"), 18)).toBe("0.000607484");
    expect(formatSwapAmount(1n, 18)).toBe("0.000000000000000001");
  });

  it("rounds half up by default, carrying into the integer part", () => {
    expect(formatSwapAmount(amount("999999.5"), 18)).toBe("1000000");
    expect(formatSwapAmount(amount("9.999995"), 18)).toBe("10");
    expect(formatSwapAmount(amount("0.9999995"), 18)).toBe("1.00");
    expect(formatSwapAmount(amount("99999.95"), 18)).toBe("100000");
    expect(formatSwapAmount(amount("0.0999999999"), 18)).toBe("0.1");
  });

  it("can round down so a received amount is never overstated", () => {
    expect(formatSwapAmount(1_999_999_999_999_999_999n, 18, "down")).toBe("1.99999");
    expect(formatSwapAmount(amount("0.9999995"), 18, "down")).toBe("0.99999");
    expect(formatSwapAmount(amount("99999.95"), 18, "down")).toBe("99999.9");
    expect(formatSwapAmount(amount("1234567.89"), 18, "down")).toBe("1234560");
    expect(formatSwapAmount(1n, 18, "down")).toBe("0.000000000000000001");
  });

  it("never shows more than the true amount when rounding down", () => {
    for (const value of ["1.9999999", "0.123459", "1646.139999", "0.00012345678", "98765432.1"]) {
      const exact = amount(value);
      expect(parseUnits(formatSwapAmount(exact, 18, "down"), 18)).toBeLessThanOrEqual(exact);
    }
  });

  it("respects tokens with fewer decimals", () => {
    expect(formatSwapAmount(1_234_567n, 6)).toBe("1.23457");
    expect(formatSwapAmount(1n, 6)).toBe("0.000001");
  });
});
