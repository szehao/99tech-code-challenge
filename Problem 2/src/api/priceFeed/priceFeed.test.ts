import { describe, expect, it, vi } from "vitest";
import { jsonResponse, PRICE_FEED_FIXTURE } from "../../test-utils/fixtures";
import { fetchPriceFeed, numberToDecimalString, parsePriceFeed, PRICE_FEED_URL } from "./priceFeed";

describe("numberToDecimalString", () => {
  it.each([
    [1, "1"],
    [0.1, "0.1"],
    [1645.9337373737374, "1645.9337373737374"],
    [1e-7, "0.0000001"],
    [1.5e-10, "0.00000000015"],
    [1e21, "1000000000000000000000"],
    [2.5e22, "25000000000000000000000"],
    [1e-18, "0.000000000000000001"],
    [1.5e-7, "0.00000015"],
    [5e-324, "0"],
  ])("%d -> %s", (input, expected) => {
    expect(numberToDecimalString(input)).toBe(expected);
  });

  it("truncates beyond the requested precision", () => {
    expect(numberToDecimalString(1e-20)).toBe("0");
    expect(numberToDecimalString(0.123456, 3)).toBe("0.123");
  });

  it.each([NaN, Infinity, -1])("rejects %d", (input) => {
    expect(() => numberToDecimalString(input)).toThrow();
  });
});

describe("parsePriceFeed", () => {
  it("collapses duplicates to the latest price, later entry winning ties", () => {
    const tokens = parsePriceFeed(PRICE_FEED_FIXTURE);
    const usdc = tokens.filter((token) => token.symbol === "USDC");

    expect(usdc).toHaveLength(1);
    expect(usdc[0].priceUsd).toBe("0.9998782611186441");
    expect(usdc[0].priceUpdatedAt).toBe("2023-08-29T07:10:40.000Z");
  });

  it("sorts tokens case-insensitively and gives each 18 decimals", () => {
    const tokens = parsePriceFeed(PRICE_FEED_FIXTURE);
    expect(tokens.map((token) => token.symbol)).toEqual(["ATOM", "ETH", "OSMO", "SWTH", "USDC", "WBTC", "wstETH"]);
    expect(tokens.every((token) => token.decimals === 18)).toBe(true);
  });

  it("drops malformed and unusable entries", () => {
    const tokens = parsePriceFeed([
      null,
      "ETH",
      { currency: "", date: "2023-08-29T07:10:52.000Z", price: 1 },
      { currency: "BAD_DATE", date: "nope", price: 1 },
      { currency: "ZERO", date: "2023-08-29T07:10:52.000Z", price: 0 },
      { currency: "STRING", date: "2023-08-29T07:10:52.000Z", price: "1" },
      { currency: "DUST", date: "2023-08-29T07:10:52.000Z", price: 1e-20 },
      { currency: "OK", date: "2023-08-29T07:10:52.000Z", price: 2 },
    ]);
    expect(tokens.map((token) => token.symbol)).toEqual(["OK"]);
  });

  it("trims symbols before de-duplicating them", () => {
    const tokens = parsePriceFeed([
      { currency: " ETH", date: "2023-08-29T07:10:40.000Z", price: 1 },
      { currency: "ETH ", date: "2023-08-29T07:10:52.000Z", price: 2 },
    ]);
    expect(tokens).toHaveLength(1);
    expect(tokens[0]).toMatchObject({ symbol: "ETH", priceUsd: "2" });
  });

  it("rejects a payload that is not a list or has no usable prices", () => {
    expect(() => parsePriceFeed({})).toThrow(/did not return a list/);
    expect(() => parsePriceFeed([])).toThrow(/no usable prices/);
  });
});

describe("fetchPriceFeed", () => {
  it("fetches and parses the feed", async () => {
    const tokens = await fetchPriceFeed();
    expect(fetch).toHaveBeenCalledWith(PRICE_FEED_URL);
    expect(tokens).toHaveLength(7);
  });

  it("surfaces HTTP errors", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({}, 503));
    await expect(fetchPriceFeed()).rejects.toThrow("Price feed responded with HTTP 503");
  });
});
