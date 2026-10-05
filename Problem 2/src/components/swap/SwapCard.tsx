import type { FormEvent } from "react";
import { toUsdValue } from "../../lib/quote/quote";
import { AmountPanel } from "./AmountPanel/AmountPanel";
import { FlipButton } from "./FlipButton/FlipButton";
import { MarketsStatus } from "./MarketsStatus/MarketsStatus";
import { SwapCardHeader } from "./SwapCardHeader/SwapCardHeader";
import { SwapDetails } from "./SwapDetails/SwapDetails";
import { SwapSubmitButton } from "./SwapSubmitButton/SwapSubmitButton";
import { SwapSuccessToast } from "./SwapSuccessToast/SwapSuccessToast";
import { useSwapCard } from "./useSwapCard/useSwapCard";
import "./swap.css";

export function SwapCard() {
  const { latency, tokensQuery, balances, form, swap, quoteView, status, actions } = useSwapCard();

  const tokens = tokensQuery.data;

  const hasTokensError = Boolean(tokensQuery.error);

  if (hasTokensError || !tokens) return <MarketsStatus hasError={hasTokensError} onRetry={() => tokensQuery.mutate()} />;

  const { fromToken, toToken, amountIn } = form;

  const { hasAmount, isOutputPending, displayQuote } = quoteView;

  const isLocked = swap.isSubmitting;
  
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void actions.submit();
  };

  return (
    <>
      <form className="swap-card" onSubmit={handleSubmit} aria-labelledby="swap-heading" noValidate>
        <SwapCardHeader isSlow={Boolean(latency)} />
        <div className="swap-card__panels">
          <AmountPanel
            heading="Amount to send"
            selectLabel="Select token to pay with"
            tokens={tokens}
            token={fromToken}
            counterpart={toToken}
            balances={balances}
            value={form.amountText}
            usdValue={amountIn !== null && fromToken ? toUsdValue(amountIn, fromToken) : null}
            onChange={actions.changeAmount}
            onMax={actions.fillMax}
            onSelectToken={(symbol) => actions.selectToken("from", symbol)}
            isLocked={isLocked}
          />
          <FlipButton onFlip={actions.flip} isLocked={isLocked} />
          <AmountPanel
            heading="Amount to receive"
            selectLabel="Select token to receive"
            tokens={tokens}
            token={toToken}
            counterpart={fromToken}
            balances={balances}
            outputAmount={hasAmount && displayQuote ? displayQuote.amountOut : null}
            usdValue={hasAmount && displayQuote ? displayQuote.valueOutUsd : null}
            isPending={isOutputPending}
            onSelectToken={(symbol) => actions.selectToken("to", symbol)}
            isLocked={isLocked}
          />
        </div>

        {displayQuote && fromToken && toToken && (
          <SwapDetails quote={displayQuote} fromToken={fromToken} toToken={toToken} isRefreshing={isOutputPending} />
        )}
        <SwapSubmitButton status={status} />
        {swap.error && (
          <p className="swap-card__notice swap-card__notice--error" role="alert">
            {swap.error}
          </p>
        )}
      </form>

      {/*
        A live region that is always mounted (so screen readers announce the toast when it is
        inserted) and sits right after the form in DOM order (so Tab from the swap button reaches it).
      */}
      <div className="toast-region" role="status" aria-live="polite">
        {swap.receipt && (
          <SwapSuccessToast key={swap.receipt.txHash} receipt={swap.receipt} tokens={tokens} onClose={swap.dismissReceipt} />
        )}
      </div>
    </>
  );
}
