import { useState } from "react";
import { DEFAULT_FROM_SYMBOL, DEFAULT_TO_SYMBOL, type Token } from "../../data/tokens/tokens";
import { parseUnits, sanitizeAmountInput } from "../../lib/units/units";

export type Side = "from" | "to";

interface SwapFormState {
  fromSymbol: string;
  toSymbol: string;
  amountText: string;
}

const INITIAL_STATE: SwapFormState = {
  fromSymbol: DEFAULT_FROM_SYMBOL,
  toSymbol: DEFAULT_TO_SYMBOL,
  amountText: "",
};

function safeParse(text: string, token: Token | undefined): bigint | null {
  if (!token || text === "") return null;
  try {
    return parseUnits(text, token.decimals);
  } catch {
    return null;
  }
}

/** Drops fractional digits the newly selected input token cannot represent. */
function fitToDecimals(next: SwapFormState, tokens: readonly Token[] | undefined): SwapFormState {
  const decimals = tokens?.find((token) => token.symbol === next.fromSymbol)?.decimals;
  if (decimals === undefined) return next;
  const [whole, fraction] = next.amountText.split(".");
  if (fraction === undefined || fraction.length <= decimals) return next;
  const amountText = decimals === 0 ? whole : `${whole}.${fraction.slice(0, decimals)}`;
  return { ...next, amountText };
}

function swapSides(state: SwapFormState): SwapFormState {
  return { ...state, fromSymbol: state.toSymbol, toSymbol: state.fromSymbol };
}

/**
 * The tokens actually shown. If the feed ever drops a default token, fall back to the first
 * listed one, and never let both sides resolve to the same token.
 */
function resolvePair(state: SwapFormState, tokens: readonly Token[] | undefined) {
  const fromToken = tokens?.find((token) => token.symbol === state.fromSymbol) ?? tokens?.[0];
  const preferredTo = tokens?.find((token) => token.symbol === state.toSymbol);
  const toToken = preferredTo && preferredTo !== fromToken ? preferredTo : tokens?.find((token) => token !== fromToken);
  return { fromToken, toToken };
}

/** State with symbols replaced by what is on screen, so edits apply to the visible pair. */
function resolvedState(state: SwapFormState, tokens: readonly Token[] | undefined): SwapFormState {
  const { fromToken, toToken } = resolvePair(state, tokens);
  return {
    ...state,
    fromSymbol: fromToken?.symbol ?? state.fromSymbol,
    toSymbol: toToken?.symbol ?? state.toSymbol,
  };
}

export interface SwapForm extends SwapFormState {
  fromToken: Token | undefined;
  toToken: Token | undefined;
  /** The amount in base units, or null when empty or not a valid amount. */
  amountIn: bigint | null;
  /** Returns whether the amount text changed (rejected or no-op input leaves it as it was). */
  setAmountText: (raw: string) => boolean;
  /** Picking the token already on the other side swaps the two. */
  selectToken: (side: Side, symbol: string) => void;
  flip: () => void;
  reset: () => void;
}

export function useSwapForm(tokens: readonly Token[] | undefined): SwapForm {
  const [state, setState] = useState<SwapFormState>(INITIAL_STATE);

  const { fromToken, toToken } = resolvePair(state, tokens);
  const amountIn = safeParse(state.amountText, fromToken);

  const setAmountText = (raw: string): boolean => {
    if (!fromToken) return false;
    const sanitized = sanitizeAmountInput(raw, fromToken.decimals);
    if (sanitized === null || sanitized === state.amountText) return false;
    setState((previous) => ({ ...previous, amountText: sanitized }));
    return true;
  };

  const selectToken = (side: Side, symbol: string) => {
    setState((previous) => {
      const current = resolvedState(previous, tokens);
      const other = side === "from" ? current.toSymbol : current.fromSymbol;
      if (symbol === other) return fitToDecimals(swapSides(current), tokens);
      const next = side === "from" ? { ...current, fromSymbol: symbol } : { ...current, toSymbol: symbol };
      return fitToDecimals(next, tokens);
    });
  };

  const flip = () => setState((previous) => fitToDecimals(swapSides(resolvedState(previous, tokens)), tokens));
  const reset = () => setState((previous) => ({ ...previous, amountText: "" }));

  return {
    ...state,
    fromSymbol: fromToken?.symbol ?? state.fromSymbol,
    toSymbol: toToken?.symbol ?? state.toSymbol,
    fromToken,
    toToken,
    amountIn,
    setAmountText,
    selectToken,
    flip,
    reset,
  };
}
