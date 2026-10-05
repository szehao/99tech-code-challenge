import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { buildQuote } from "../../../lib/quote/quote";
import { fixtureToken } from "../../../test-utils/fixtures";
import { createWrapper } from "../../../test-utils/testUtils";
import { getQuoteView, getSwapStatus, useSwapCard } from "./useSwapCard";

const ETH = fixtureToken("ETH");
const USDC = fixtureToken("USDC");
const ATOM = fixtureToken("ATOM");
const ONE = 10n ** 18n;
const QUOTE_TIMEOUT = { timeout: 2000 };

describe("getQuoteView", () => {
  it("presents a fetched quote for exactly the pair and amount on screen as current", () => {
    const quote = buildQuote(ONE, ETH, USDC);

    expect(getQuoteView(ETH, USDC, ONE, quote)).toEqual({
      isQuoteCurrent: true,
      hasAmount: true,
      isOutputPending: false,
      displayQuote: quote,
    });
  });

  it("keeps showing the same pair's quote while a new amount is quoted, marked pending", () => {
    const quote = buildQuote(ONE, ETH, USDC);
    const view = getQuoteView(ETH, USDC, 2n * ONE, quote);

    expect(view).toMatchObject({ isQuoteCurrent: false, isOutputPending: true });
    expect(view.displayQuote).toBe(quote);
  });

  it("never shows another pair's quote: it shows a zero-amount quote at the new pair's rate", () => {
    const view = getQuoteView(ETH, ATOM, ONE, buildQuote(ONE, ETH, USDC));

    expect(view.isQuoteCurrent).toBe(false);
    expect(view.displayQuote).toEqual(buildQuote(0n, ETH, ATOM));
  });

  it.each([
    ["no amount", null],
    ["a zero amount", 0n],
  ])("shows the rate with zero output and nothing pending for %s", (_case, amountIn) => {
    const view = getQuoteView(ETH, USDC, amountIn, undefined);

    expect(view).toMatchObject({ hasAmount: false, isOutputPending: false });
    expect(view.displayQuote).toEqual(buildQuote(0n, ETH, USDC));
  });

  it("has nothing to display until both tokens are known", () => {
    expect(getQuoteView(ETH, undefined, ONE, undefined).displayQuote).toBeUndefined();
  });
});

describe("getSwapStatus", () => {
  const quote = buildQuote(10n ** 17n, ETH, USDC);
  const base = {
    fromToken: ETH,
    toToken: USDC,
    amountIn: 10n ** 17n,
    balances: { ETH: ONE, USDC: 0n },
    quote,
    isQuoteCurrent: true,
    hasQuoteError: false,
    isSubmitting: false,
  };

  it.each([
    [{ fromToken: undefined }, "loading", "Loading tokens…"],
    [{ isSubmitting: true }, "submitting", "Swapping…"],
    [{ amountIn: null }, "idle", "Enter an amount"],
    [{ amountIn: 0n }, "idle", "Enter an amount"],
    [{ balances: undefined }, "loading", "Loading balances…"],
    [{ amountIn: 2n * ONE }, "blocked", "Insufficient ETH balance"],
    [{ hasQuoteError: true }, "error", "Quote failed — retry"],
    [{ isQuoteCurrent: false }, "quoting", "Fetching best price…"],
    [{ quote: undefined }, "quoting", "Fetching best price…"],
    [{ quote: { ...quote, amountOut: 0n } }, "blocked", "Amount too small"],
    [{}, "ready", "Swap ETH for USDC"],
    [{ fromToken: { ...ETH, symbol: "constructor" } }, "blocked", "Insufficient constructor balance"],
  ])("%o -> %s", (overrides, kind, label) => {
    expect(getSwapStatus({ ...base, ...overrides })).toEqual({ kind, label });
  });
});

describe("useSwapCard", () => {
  it("starts on the default pair, waiting for an amount", async () => {
    const { result } = renderHook(() => useSwapCard(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.status.kind).toBe("idle"));
    expect(result.current.form.fromToken?.symbol).toBe("ETH");
    expect(result.current.form.toToken?.symbol).toBe("USDC");
    expect(result.current.latency).toBeNull();
  });

  it("quotes a typed amount after the debounce and becomes ready to swap", async () => {
    const { result } = renderHook(() => useSwapCard(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.status.kind).toBe("idle"));

    act(() => result.current.actions.changeAmount("1"));
    expect(result.current.quoteView.isOutputPending).toBe(true);

    await waitFor(() => expect(result.current.status).toEqual({ kind: "ready", label: "Swap ETH for USDC" }), QUOTE_TIMEOUT);
    expect(result.current.quoteView.isQuoteCurrent).toBe(true);
  });

  it("executes a ready swap and clears the amount once it lands", async () => {
    const { result } = renderHook(() => useSwapCard(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.status.kind).toBe("idle"));
    act(() => result.current.actions.changeAmount("1"));
    await waitFor(() => expect(result.current.status.kind).toBe("ready"), QUOTE_TIMEOUT);

    await act(() => result.current.actions.submit());

    expect(result.current.swap.receipt?.quote.amountIn).toBe(ONE);
    expect(result.current.form.amountText).toBe("");
  });

  it("fills the full balance of the pay token on Max", async () => {
    const { result } = renderHook(() => useSwapCard(), { wrapper: createWrapper() });
    await waitFor(() => expect(result.current.balances).toBeDefined());

    act(() => result.current.actions.fillMax());

    expect(result.current.form.amountText).toBe("4.218304771");
  });

  it("passes the simulated latency range through when enabled", () => {
    const { result } = renderHook(() => useSwapCard(), { wrapper: createWrapper({ isLatencyEnabled: true }) });

    expect(result.current.latency).not.toBeNull();
  });
});
