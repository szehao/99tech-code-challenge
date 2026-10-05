/**
 * Token model. The list and prices come from the live price feed
 * (see api/priceFeed/priceFeed.ts); only wallet balances and defaults are hardcoded.
 */

export interface Token {
  symbol: string;
  /** Base-unit precision. The feed has no decimals, so every token uses TOKEN_DECIMALS. */
  decimals: number;
  /** USD price as a decimal string, up to PRICE_DECIMALS fractional digits. */
  priceUsd: string;
  /** When the feed last priced this token (ISO-8601). */
  priceUpdatedAt: string;
}

export const PRICE_DECIMALS = 18;
export const TOKEN_DECIMALS = 18;

/** Starting wallet balances, human-readable. Tokens not listed start at zero. */
export const INITIAL_BALANCES: Readonly<Record<string, string>> = {
  ETH: "4.218304771",
  WBTC: "0.0831",
  USDC: "12500.42",
  ATOM: "240.123456",
  OSMO: "5120",
  SWTH: "1250000",
  wstETH: "1.75",
  KUJI: "800",
};

export const DEFAULT_FROM_SYMBOL = "ETH";
export const DEFAULT_TO_SYMBOL = "USDC";
