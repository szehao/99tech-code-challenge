import type { SwapReceipt } from "../../../api/mockServer/mockServer";
import { ExternalLinkIcon } from "../../../assets/general/ExternalLinkIcon";
import type { Token } from "../../../data/tokens/tokens";
import { formatSwapAmount } from "../../../lib/units/units";
import { Toast } from "../../Toast/Toast";
import "./swapSuccessToast.css";

/** Placeholder explorer link: there is no real chain, so it opens an empty tab. */
const TX_EXPLORER_URL = "about:blank";

interface SwapSuccessToastProps {
  receipt: SwapReceipt;
  tokens: readonly Token[];
  onClose: () => void;
}

export function SwapSuccessToast({ receipt, tokens, onClose }: SwapSuccessToastProps) {
  const from = tokens.find((token) => token.symbol === receipt.quote.fromSymbol);
  const to = tokens.find((token) => token.symbol === receipt.quote.toSymbol);
  if (!from || !to) return null;

  // The received side rounds down so the toast never claims more than was credited.
  const paid = formatSwapAmount(receipt.quote.amountIn, from.decimals);
  const received = formatSwapAmount(receipt.quote.amountOut, to.decimals, "down");
  const summary = `${paid} ${from.symbol} → ${received} ${to.symbol}`;

  return (
    <Toast title="Swap successful" onClose={onClose}>
      <p className="swap-toast__summary">{summary}</p>
      <a className="swap-toast__link" href={TX_EXPLORER_URL} target="_blank" rel="noopener noreferrer" title={receipt.txHash}>
        View TX
        <ExternalLinkIcon />
      </a>
    </Toast>
  );
}
