import { Spinner } from "../../shared/Spinner/Spinner";
import type { SwapStatus } from "../useSwapCard/useSwapCard";

interface SwapSubmitButtonProps {
  status: SwapStatus;
}

/** The form's submit button, labelled and enabled by the swap status. */
export function SwapSubmitButton({ status }: SwapSubmitButtonProps) {
  const isBusy = status.kind === "quoting" || status.kind === "submitting";
  const isActionable = status.kind === "ready" || status.kind === "error";

  return (
    <button
      type="submit"
      className="swap-card__submit"
      data-kind={status.kind}
      disabled={!isActionable}
    >
      {isBusy && <Spinner />}
      <span>{status.label}</span>
    </button>
  );
}
