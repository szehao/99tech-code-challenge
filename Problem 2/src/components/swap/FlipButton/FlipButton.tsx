import { SwapArrowsIcon } from "../../../assets/general/SwapArrowsIcon";
import "./flipButton.css";

interface FlipButtonProps {
  onFlip: () => void;
  isLocked?: boolean;
}

export function FlipButton({ onFlip, isLocked = false }: FlipButtonProps) {
  return (
    <button
      type="button"
      className="flip-button"
      onClick={onFlip}
      aria-label="Swap input and output tokens"
      disabled={isLocked}
    >
      <SwapArrowsIcon />
    </button>
  );
}
