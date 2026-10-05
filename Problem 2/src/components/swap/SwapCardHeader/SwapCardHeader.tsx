interface SwapCardHeaderProps {
  /** Simulated latency is on. */
  isSlow: boolean;
}

/** The card's title and a badge saying whether the network is simulated as slow. */
export function SwapCardHeader({ isSlow }: SwapCardHeaderProps) {
  return (
    <header className="swap-card__header">
      <h1 id="swap-heading" className="swap-card__title">
        99tech
      </h1>
      <span className="swap-card__network">
        <span className="swap-card__dot" data-slow={isSlow} aria-hidden="true" />
        {isSlow ? "Slow network" : "Demo"}
      </span>
    </header>
  );
}
