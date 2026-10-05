/**
 * Fixed-point helpers for token amounts.
 *
 * Every amount is held as a bigint of base units (like wei) so no precision is
 * lost to IEEE-754 floats. Only these helpers move between human-readable
 * strings and base units.
 */

export const MAX_DECIMALS = 18;

const AMOUNT_PATTERN = /^\d*\.?\d*$/;
/** Far beyond any real balance; keeps absurd input from rendering as a misleading number. */
export const MAX_INTEGER_DIGITS = 15;

function assertDecimals(decimals: number): void {
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > MAX_DECIMALS) {
    throw new Error(`decimals must be an integer between 0 and ${MAX_DECIMALS}`);
  }
}

export function pow10(exponent: number): bigint {
  return 10n ** BigInt(exponent);
}

/**
 * Keeps only what a user could legitimately be typing towards a valid amount:
 * digits, a single decimal point, and at most `decimals` fractional digits. Thousands separators
 * are stripped, so typing or pasting "12,500.42" gives 12500.42. Returns null when the input should
 * be rejected outright, i.e. the keystroke is ignored.
 */
export function sanitizeAmountInput(raw: string, decimals: number): string | null {
  assertDecimals(decimals);
  const compact = raw.trim().replace(/,/g, "");
  if (!AMOUNT_PATTERN.test(compact)) return null;

  const [rawWhole, fraction] = compact.split(".");
  // "007" -> "7" and "0000" -> "0", but keep the single zero in "0" and "0.".
  const whole = rawWhole.replace(/^0+(?=\d)/, "");
  if (whole.length > MAX_INTEGER_DIGITS) return null;
  if (fraction === undefined) return whole;
  if (decimals === 0) return whole || "0";

  // Digits beyond the token's precision are dropped (covers typing and pasting).
  return `${whole || "0"}.${fraction.slice(0, decimals)}`;
}

/** "1.5" with 18 decimals -> 1500000000000000000n. Throws on malformed input. */
export function parseUnits(value: string, decimals: number): bigint {
  assertDecimals(decimals);
  const trimmed = value.trim();
  if (trimmed === "" || trimmed === "." || !AMOUNT_PATTERN.test(trimmed)) {
    throw new Error(`"${value}" is not a valid amount`);
  }

  const [whole = "", fraction = ""] = trimmed.split(".");
  if (fraction.length > decimals) {
    throw new Error(`"${value}" has more than ${decimals} decimal places`);
  }

  const paddedFraction = fraction.padEnd(decimals, "0");
  return BigInt(whole || "0") * pow10(decimals) + BigInt(paddedFraction || "0");
}

/** 1500000000000000000n with 18 decimals -> "1.5". Trailing zeros are trimmed. */
export function formatUnits(amount: bigint, decimals: number): string {
  assertDecimals(decimals);
  const isNegative = amount < 0n;
  const absolute = isNegative ? -amount : amount;
  const base = pow10(decimals);

  const whole = (absolute / base).toString();
  const fraction = (absolute % base).toString().padStart(decimals, "0").replace(/0+$/, "");
  const sign = isNegative ? "-" : "";

  return fraction ? `${sign}${whole}.${fraction}` : `${sign}${whole}`;
}

/**
 * Display-oriented formatting: rounds down to `maxFractionDigits`, groups the
 * integer part, and shows "<0.000001" instead of a misleading zero.
 */
export function formatDisplay(amount: bigint, decimals: number, maxFractionDigits = 6): string {
  if (amount === 0n) return "0";

  const precision = Math.min(maxFractionDigits, decimals);
  const truncated = amount / pow10(decimals - precision);
  if (truncated === 0n) return `<${formatUnits(1n, precision)}`;

  const [whole, fraction] = formatUnits(truncated, precision).split(".");
  const groupedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return fraction ? `${groupedWhole}.${fraction}` : groupedWhole;
}

/**
 * US-dollar display: always two decimals (rounded down to the cent), grouped thousands,
 * and "<$0.01" for a non-zero value below one cent. 2468.9 -> "$2,468.90".
 */
export function formatUsd(value: bigint, decimals: number): string {
  if (value === 0n) return "$0.00";
  const display = formatDisplay(value, decimals, 2);
  if (display.startsWith("<")) return `<$${display.slice(1)}`;
  const [whole, fraction = ""] = display.split(".");
  return `$${whole}.${fraction.padEnd(2, "0")}`;
}

/**
 * How display rounding treats the dropped digits. Amounts a user will *receive* use
 * "down" so the UI never shows more than is delivered; everything else uses "halfUp"
 * (Intl.NumberFormat's default).
 */
export type Rounding = "halfUp" | "down";

/**
 * Rounds to `fractionDigits` places and returns the result at that scale.
 * A negative `fractionDigits` rounds to tens, hundreds, ... (used for 6 significant figures above 1e6).
 */
function roundTo(amount: bigint, decimals: number, fractionDigits: number, rounding: Rounding): bigint {
  const factor = pow10(decimals - fractionDigits);
  const quotient = amount / factor;
  if (rounding === "down") return quotient;
  return (amount % factor) * 2n >= factor ? quotient + 1n : quotient;
}

const SWAP_SIGNIFICANT_DIGITS = 6;
const SWAP_SUB_ONE_MAX_DECIMALS = 5;
const SWAP_SUB_ONE_MIN_DECIMALS = 2;

/** Rounds to `fractionDigits` and renders without trailing zeros (but at least `minFractionDigits`). */
function roundAndFormat(
  amount: bigint,
  decimals: number,
  fractionDigits: number,
  rounding: Rounding,
  minFractionDigits = 0,
): string {
  const digits = Math.min(fractionDigits, decimals);
  const rounded = roundTo(amount, decimals, digits, rounding);
  if (digits < 0) return (rounded * pow10(-digits)).toString();

  const [whole, fraction = ""] = formatUnits(rounded, digits).split(".");
  const padded = fraction.padEnd(Math.min(minFractionDigits, digits), "0");
  return padded ? `${whole}.${padded}` : whole;
}

/**
 * Fraction digits needed to show `significant` significant digits of a positive amount.
 * Negative when the integer part alone is longer than `significant` digits.
 */
function fractionDigitsForSignificant(amount: bigint, decimals: number, significant: number): number {
  const base = pow10(decimals);
  const whole = amount / base;
  if (whole > 0n) return significant - whole.toString().length;
  const leadingZeros = decimals - (amount % base).toString().length;
  return leadingZeros + significant;
}

/**
 * Swap amount display:
 * plain digits (no grouping), 6 significant figures (so 1234567.89 -> "1234570");
 * values in [0.1, 1) use up to 5 decimals with at least 2.
 */
export function formatSwapAmount(amount: bigint, decimals: number, rounding: Rounding = "halfUp"): string {
  assertDecimals(decimals);
  if (amount <= 0n) return "0";

  const base = pow10(decimals);
  const isSubOne = amount < base;
  const isAtLeastTenth = amount * 10n >= base;
  if (isSubOne && isAtLeastTenth) {
    return roundAndFormat(amount, decimals, SWAP_SUB_ONE_MAX_DECIMALS, rounding, SWAP_SUB_ONE_MIN_DECIMALS);
  }
  const digits = fractionDigitsForSignificant(amount, decimals, SWAP_SIGNIFICANT_DIGITS);
  return roundAndFormat(amount, decimals, digits, rounding);
}
