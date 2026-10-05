import { Spinner } from "../../shared/Spinner/Spinner";

interface MarketsStatusProps {
  hasError: boolean;
  onRetry: () => void;
}

/** Stands in for the swap card while the token list loads, or offers a retry if it failed. */
export function MarketsStatus({ hasError, onRetry }: MarketsStatusProps) {
  if (hasError) {
    return (
      <div className="swap-card swap-card--message" role="alert">
        Could not load token prices. <button onClick={onRetry}>Retry</button>
      </div>
    );
  }

  return (
    <div className="swap-card swap-card--message" role="status">
      <Spinner /> Loading markets…
    </div>
  );
}
