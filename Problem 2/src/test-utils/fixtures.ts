import { parsePriceFeed } from "../api/priceFeed/priceFeed";
import type { Token } from "../data/tokens/tokens";

/** A slice of the real prices.json, including its duplicate USDC entries. */
export const PRICE_FEED_FIXTURE = [
  { currency: "ETH", date: "2023-08-29T07:10:52.000Z", price: 1645.9337373737374 },
  { currency: "USDC", date: "2023-08-29T07:10:40.000Z", price: 0.989832 },
  { currency: "ATOM", date: "2023-08-29T07:10:50.000Z", price: 7.186657333333334 },
  { currency: "OSMO", date: "2023-08-29T07:10:50.000Z", price: 0.3772974333333333 },
  { currency: "SWTH", date: "2023-08-29T07:10:45.000Z", price: 0.004039850455012084 },
  { currency: "USDC", date: "2023-08-29T07:10:30.000Z", price: 1 },
  { currency: "USDC", date: "2023-08-29T07:10:40.000Z", price: 0.9998782611186441 },
  { currency: "WBTC", date: "2023-08-29T07:10:52.000Z", price: 26002.82202020202 },
  { currency: "wstETH", date: "2023-08-29T07:10:40.000Z", price: 1872.2579742372882 },
];

export const FIXTURE_TOKENS: readonly Token[] = parsePriceFeed(PRICE_FEED_FIXTURE);

export function fixtureToken(symbol: string): Token {
  const token = FIXTURE_TOKENS.find((candidate) => candidate.symbol === symbol);
  if (!token) throw new Error(`No fixture token ${symbol}`);
  return token;
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}
