import type { SWRResponse } from "swr";
import type { Balances, LatencyRange } from "../../../api/mockServer/mockServer";
import { useLatency } from "../../../context/latency/useLatency";
import type { Token } from "../../../data/tokens/tokens";
import { useBalances } from "../../../hooks/useBalances/useBalances";
import { useDebouncedValue } from "../../../hooks/useDebouncedValue/useDebouncedValue";
import { useQuote } from "../../../hooks/useQuote/useQuote";
import { useSwapExecution, type SwapExecution } from "../../../hooks/useSwapExecution/useSwapExecution";
import { useSwapForm, type Side, type SwapForm } from "../../../hooks/useSwapForm/useSwapForm";
import { useTokens } from "../../../hooks/useTokens/useTokens";
import { balanceOf } from "../../../lib/balances/balances";
import { buildQuote, type Quote } from "../../../lib/quote/quote";
import { formatUnits } from "../../../lib/units/units";

const INPUT_DEBOUNCE_MS = 300;

export type SwapStatusKind = "loading" | "idle" | "blocked" | "quoting" | "error" | "submitting" | "ready";

export interface SwapStatus {
  kind: SwapStatusKind;
  label: string;
}

export interface QuoteView {
  /** The fetched quote is for exactly the pair and amount on screen. */
  isQuoteCurrent: boolean;
  hasAmount: boolean;
  /** An amount is entered but its quote has not arrived yet. */
  isOutputPending: boolean;
  /** What the details row and output field show; undefined until both tokens are known. */
  displayQuote: Quote | undefined;
}

/** Decides which quote the card presents, so a stale quote (kept by SWR's keepPreviousData) is never shown as current. */
export function getQuoteView(
  fromToken: Token | undefined,
  toToken: Token | undefined,
  amountIn: bigint | null,
  quote: Quote | undefined,
): QuoteView {
  const isSamePair = quote?.fromSymbol === fromToken?.symbol && quote?.toSymbol === toToken?.symbol;
  const isQuoteCurrent = quote !== undefined && isSamePair && quote.amountIn === amountIn;
  const hasAmount = amountIn !== null && amountIn > 0n;

  // Always have something to show: the fetched quote for this pair, or a zero-amount
  // quote priced from the already-loaded token list (correct rate, 0 output).
  const displayQuote =
    fromToken && toToken ? (hasAmount && isSamePair && quote ? quote : buildQuote(0n, fromToken, toToken)) : undefined;

  return { isQuoteCurrent, hasAmount, isOutputPending: hasAmount && !isQuoteCurrent, displayQuote };
}

interface SwapStatusInput {
  fromToken: Token | undefined;
  toToken: Token | undefined;
  amountIn: bigint | null;
  balances: Balances | undefined;
  quote: Quote | undefined;
  isQuoteCurrent: boolean;
  hasQuoteError: boolean;
  isSubmitting: boolean;
}

/** Single source of truth for what the primary button says and whether it works. */
export function getSwapStatus(input: SwapStatusInput): SwapStatus {
  const { fromToken, toToken, amountIn, balances, quote, isQuoteCurrent, hasQuoteError, isSubmitting } = input;

  if (!fromToken || !toToken) return { kind: "loading", label: "Loading tokens…" };
  if (isSubmitting) return { kind: "submitting", label: "Swapping…" };
  if (amountIn === null || amountIn === 0n) return { kind: "idle", label: "Enter an amount" };
  if (!balances) return { kind: "loading", label: "Loading balances…" };
  if (amountIn > balanceOf(balances, fromToken.symbol)) {
    return { kind: "blocked", label: `Insufficient ${fromToken.symbol} balance` };
  }
  if (hasQuoteError) return { kind: "error", label: "Quote failed — retry" };
  if (!quote || !isQuoteCurrent) return { kind: "quoting", label: "Fetching best price…" };
  if (quote.amountOut === 0n) return { kind: "blocked", label: "Amount too small" };
  return { kind: "ready", label: `Swap ${fromToken.symbol} for ${toToken.symbol}` };
}

export interface SwapActions {
  /** Retries a failed quote, or executes the swap when it is ready; otherwise does nothing. */
  submit: () => Promise<void>;
  changeAmount: (value: string) => void;
  selectToken: (side: Side, symbol: string) => void;
  flip: () => void;
  fillMax: () => void;
}

export interface SwapCardModel {
  latency: LatencyRange | null;
  tokensQuery: SWRResponse<readonly Token[]>;
  balances: Balances | undefined;
  form: SwapForm;
  swap: SwapExecution;
  quoteView: QuoteView;
  status: SwapStatus;
  actions: SwapActions;
}

/** Everything the swap card shows and does: data, form state, the quote to present and the actions. */
export function useSwapCard(): SwapCardModel {
  const { latency } = useLatency();
  const tokensQuery = useTokens();
  const { data: balances } = useBalances();
  const form = useSwapForm(tokensQuery.data);
  const { fromToken, toToken, amountIn } = form;

  const debouncedAmount = useDebouncedValue(amountIn, INPUT_DEBOUNCE_MS);
  const quoteQuery = useQuote(fromToken, toToken, debouncedAmount);
  const swap = useSwapExecution(latency);

  const quoteView = getQuoteView(fromToken, toToken, amountIn, quoteQuery.data);
  const status = getSwapStatus({
    fromToken,
    toToken,
    amountIn,
    balances,
    quote: quoteQuery.data,
    isQuoteCurrent: quoteView.isQuoteCurrent,
    hasQuoteError: Boolean(quoteQuery.error) && !quoteQuery.isValidating,
    isSubmitting: swap.isSubmitting,
  });

  // Any edit to what is being swapped makes an old swap error irrelevant.
  const clearStaleError = () => {
    if (swap.error) swap.clearError();
  };
  const setAmount = (text: string) => {
    if (form.setAmountText(text)) clearStaleError();
  };

  const actions: SwapActions = {
    async submit() {
      if (status.kind === "error") {
        await quoteQuery.mutate();
        return;
      }
      if (status.kind !== "ready" || !fromToken || !toToken || amountIn === null) return;
      const receipt = await swap.execute({ from: fromToken, to: toToken, amountIn });
      if (receipt) form.reset();
    },
    changeAmount: setAmount,
    selectToken(side, symbol) {
      const current = side === "from" ? form.fromSymbol : form.toSymbol;
      if (symbol === current) return; // re-picking the same token changes nothing
      clearStaleError();
      form.selectToken(side, symbol);
    },
    flip() {
      clearStaleError();
      form.flip();
    },
    fillMax() {
      if (!fromToken || !balances) return;
      setAmount(formatUnits(balanceOf(balances, fromToken.symbol), fromToken.decimals));
    },
  };

  return { latency, tokensQuery, balances, form, swap, quoteView, status, actions };
}
