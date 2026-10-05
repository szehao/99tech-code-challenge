import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FIXTURE_TOKENS as TOKENS, fixtureToken } from "../../test-utils/fixtures";
import { useSwapForm } from "./useSwapForm";

describe("useSwapForm", () => {
  it("starts on the default pair with an empty amount", () => {
    const { result } = renderHook(() => useSwapForm(TOKENS));
    expect(result.current.fromSymbol).toBe("ETH");
    expect(result.current.toSymbol).toBe("USDC");
    expect(result.current.amountIn).toBeNull();
  });

  it("parses typed amounts into base units and ignores invalid keystrokes", () => {
    const { result } = renderHook(() => useSwapForm(TOKENS));
    act(() => result.current.setAmountText("1.25"));
    expect(result.current.amountIn).toBe(1_250_000_000_000_000_000n);

    act(() => result.current.setAmountText("1.25x"));
    expect(result.current.amountText).toBe("1.25");
  });

  it("swaps sides when the counterpart token is picked", () => {
    const { result } = renderHook(() => useSwapForm(TOKENS));
    act(() => result.current.selectToken("from", "USDC"));
    expect(result.current.fromSymbol).toBe("USDC");
    expect(result.current.toSymbol).toBe("ETH");
  });

  it("truncates precision the new input token cannot hold when flipping", () => {
    const sixDecimalUsdc = { ...fixtureToken("USDC"), decimals: 6 };
    const tokens = TOKENS.map((token) => (token.symbol === "USDC" ? sixDecimalUsdc : token));
    const { result } = renderHook(() => useSwapForm(tokens));
    act(() => result.current.setAmountText("0.123456789"));
    act(() => result.current.flip());
    expect(result.current.fromSymbol).toBe("USDC");
    expect(result.current.amountText).toBe("0.123456");
    expect(result.current.amountIn).toBe(123_456n);
  });

  it("falls back to the first listed tokens when the defaults are missing", () => {
    const tokens = TOKENS.filter((token) => token.symbol !== "ETH" && token.symbol !== "USDC");
    const { result } = renderHook(() => useSwapForm(tokens));
    expect(result.current.fromSymbol).toBe("ATOM");
    expect(result.current.toSymbol).toBe("OSMO");
  });

  it("selects a new token on one side and resets the amount", () => {
    const { result } = renderHook(() => useSwapForm(TOKENS));
    act(() => result.current.selectToken("to", "WBTC"));
    act(() => result.current.setAmountText("3"));
    act(() => result.current.reset());
    expect(result.current.toSymbol).toBe("WBTC");
    expect(result.current.amountText).toBe("");
  });

  it("swaps sides instead of producing a same-token pair when the defaults are missing", () => {
    const tokens = TOKENS.filter((token) => token.symbol !== "ETH" && token.symbol !== "USDC");
    const { result } = renderHook(() => useSwapForm(tokens));
    expect(result.current.fromSymbol).toBe("ATOM");

    act(() => result.current.selectToken("to", "ATOM"));
    expect(result.current.fromSymbol).toBe("OSMO");
    expect(result.current.toSymbol).toBe("ATOM");
    expect(result.current.fromToken).not.toBe(result.current.toToken);
  });

  it("flips the visible pair even when the stored defaults are missing from the feed", () => {
    const tokens = TOKENS.filter((token) => token.symbol !== "ETH" && token.symbol !== "USDC");
    const { result } = renderHook(() => useSwapForm(tokens));
    expect([result.current.fromSymbol, result.current.toSymbol]).toEqual(["ATOM", "OSMO"]);

    act(() => result.current.flip());
    expect([result.current.fromSymbol, result.current.toSymbol]).toEqual(["OSMO", "ATOM"]);
  });

  it("reports whether the amount text changed", () => {
    const { result } = renderHook(() => useSwapForm(TOKENS));
    const set = (text: string) => {
      let changed: boolean | undefined;
      act(() => {
        changed = result.current.setAmountText(text);
      });
      return changed;
    };

    expect(set("1a")).toBe(false); // rejected
    expect(set("1,2")).toBe(true); // thousands separators are stripped
    expect(set("12")).toBe(false); // accepted but unchanged
    expect(result.current.amountText).toBe("12");
  });
});
