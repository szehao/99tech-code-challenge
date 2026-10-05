import { useState, type CSSProperties } from "react";
import { getTokenIconUrl } from "../../../assets/tokens/tokenIcons";
import "./tokenIcon.css";

interface TokenIconProps {
  symbol: string;
}

/** Stable hue per symbol so fallback badges are distinguishable without a hardcoded palette. */
function hueFor(symbol: string): number {
  return [...symbol].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) % 360, 7);
}

/**
 * The token's logo, falling back to a coloured initials badge if it is missing or fails to load.
 * Size comes from tokenIcon.css, so there are no layout shifts and no
 * hardcoded dimensions here. Logos load lazily: only the ones actually on screen are fetched.
 */
export function TokenIcon({ symbol }: TokenIconProps) {
  const [failedSymbol, setFailedSymbol] = useState<string | null>(null);
  const url = getTokenIconUrl(symbol);

  if (url && failedSymbol !== symbol) {
    return (
      <img
        className="token-icon token-icon--image"
        src={url}
        alt=""
        loading="lazy"
        decoding="async"
        onError={() => setFailedSymbol(symbol)}
      />
    );
  }

  // Only the per-symbol hue is data; saturation and lightness come from tokenIcon.css.
  const style = { "--token-hue": hueFor(symbol) } as CSSProperties;
  return (
    <span className="token-icon" style={style} aria-hidden="true">
      {symbol.slice(0, 2).toUpperCase()}
    </span>
  );
}
