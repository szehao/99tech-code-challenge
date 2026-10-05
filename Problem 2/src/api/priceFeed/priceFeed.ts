/**
 * Live token prices from the Switcheo interview feed.
 *
 * The feed is untrusted input: entries are validated individually, malformed
 * ones are dropped, and duplicate currencies are collapsed to their most
 * recent price.
 */
import { MAX_DECIMALS } from "../../lib/units/units";
import { TOKEN_DECIMALS, type Token } from "../../data/tokens/tokens";

export const PRICE_FEED_URL = "https://interview.switcheo.com/prices.json";

interface PriceEntry {
  currency: string;
  date: string;
  price: number;
}

function isPriceEntry(value: unknown): value is PriceEntry {
  if (typeof value !== "object" || value === null) return false;
  const { currency, date, price } = value as Record<string, unknown>;
  return (
    typeof currency === "string" &&
    currency.trim() !== "" &&
    typeof date === "string" &&
    !Number.isNaN(Date.parse(date)) &&
    typeof price === "number" &&
    Number.isFinite(price) &&
    price > 0
  );
}

/**
 * Converts a JS number to a plain decimal string without exponent notation,
 * using its shortest round-trip representation (so 0.1 stays "0.1", not the
 * binary expansion), truncated to `maxDecimals` fractional digits.
 */
export function numberToDecimalString(value: number, maxDecimals = MAX_DECIMALS): string {
  if (!Number.isFinite(value) || value < 0) throw new Error(`Invalid price ${value}`);

  const [mantissa, exponentText] = String(value).toLowerCase().split("e");
  const exponent = Number(exponentText ?? 0);
  const [whole, fraction = ""] = mantissa.split(".");
  const digits = whole + fraction;
  const pointIndex = whole.length + exponent;

  const expanded =
    pointIndex <= 0
      ? `0.${"0".repeat(-pointIndex)}${digits}`
      : pointIndex >= digits.length
        ? digits + "0".repeat(pointIndex - digits.length)
        : `${digits.slice(0, pointIndex)}.${digits.slice(pointIndex)}`;

  const [intPart, fracPart = ""] = expanded.split(".");
  const normalisedInt = intPart.replace(/^0+(?=\d)/, "");
  const truncatedFrac = fracPart.slice(0, maxDecimals).replace(/0+$/, "");
  return truncatedFrac ? `${normalisedInt}.${truncatedFrac}` : normalisedInt;
}

/** Keeps the latest entry per currency; on a timestamp tie the later entry in the feed wins. */
function latestByCurrency(entries: readonly PriceEntry[]): PriceEntry[] {
  const latest = entries.reduce<ReadonlyMap<string, PriceEntry>>((map, entry) => {
    const current = map.get(entry.currency);
    if (current && Date.parse(current.date) > Date.parse(entry.date)) return map;
    return new Map(map).set(entry.currency, entry);
  }, new Map());
  return [...latest.values()];
}

export function parsePriceFeed(payload: unknown): Token[] {
  if (!Array.isArray(payload)) throw new Error("Price feed did not return a list");

  // Trim before de-duplicating so " ETH" and "ETH" collapse into one token.
  const entries = payload.filter(isPriceEntry).map((entry) => ({ ...entry, currency: entry.currency.trim() }));
  const tokens = latestByCurrency(entries)
    .map((entry) => ({
      symbol: entry.currency,
      decimals: TOKEN_DECIMALS,
      priceUsd: numberToDecimalString(entry.price),
      priceUpdatedAt: entry.date,
    }))
    // A price too small to survive 18-decimal truncation would make conversions divide by zero.
    .filter((token) => token.priceUsd !== "0")
    .sort((a, b) => a.symbol.localeCompare(b.symbol, "en", { sensitivity: "base" }));

  if (tokens.length === 0) throw new Error("Price feed contained no usable prices");
  return tokens;
}

export async function fetchPriceFeed(): Promise<Token[]> {
  const response = await fetch(PRICE_FEED_URL);
  if (!response.ok) throw new Error(`Price feed responded with HTTP ${response.status}`);
  return parsePriceFeed(await response.json());
}
