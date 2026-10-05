import { useState } from "react";
import type { Token } from "../../../data/tokens/tokens";
import type { Quote } from "../../../lib/quote/quote";
import { formatSwapAmount, pow10 } from "../../../lib/units/units";
import { Spinner } from "../../shared/Spinner/Spinner";
import "./swapDetails.css";

interface SwapDetailsProps {
  quote: Quote;
  fromToken: Token;
  toToken: Token;
  isRefreshing: boolean;
}

/** Inverse rate: how much `from` one whole `to` buys, in `from` base units. */
function invertRate(quote: Quote, fromToken: Token, toToken: Token): bigint {
  if (quote.rate === 0n) return 0n;
  return (pow10(toToken.decimals) * pow10(fromToken.decimals)) / quote.rate;
}

export function SwapDetails({ quote, fromToken, toToken, isRefreshing }: SwapDetailsProps) {
  const [isInverted, setIsInverted] = useState(false);

  // Significant figures rather than fixed decimals, so tiny rates (e.g. SWTH -> WBTC) keep their digits.
  const rateText = isInverted
    ? `1 ${toToken.symbol} = ${formatSwapAmount(invertRate(quote, fromToken, toToken), fromToken.decimals)} ${fromToken.symbol}`
    : `1 ${fromToken.symbol} = ${formatSwapAmount(quote.rate, toToken.decimals)} ${toToken.symbol}`;

  // Not a live region: re-announcing the whole list on every keystroke drowns out the form.
  return (
    <dl className="swap-details">
      <div className="swap-details__row">
        <dt>Rate</dt>
        <dd>
          <button
            type="button"
            className="swap-details__rate"
            onClick={() => setIsInverted((previous) => !previous)}
            title="Invert rate"
          >
            {isRefreshing && <Spinner />} {rateText}
          </button>
        </dd>
      </div>
      {/* Visible summary only: the "Amount to receive" field above already announces this amount. */}
      <div className="swap-details__row" aria-hidden="true">
        <dt>You receive</dt>
        <dd className="swap-details__strong" data-pending={isRefreshing}>
          {formatSwapAmount(quote.amountOut, toToken.decimals, "down")} {toToken.symbol}
        </dd>
      </div>
    </dl>
  );
}
