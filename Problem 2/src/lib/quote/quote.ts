import { PRICE_DECIMALS, type Token } from "../../data/tokens/tokens";
import { parseUnits, pow10 } from "../units/units";

export interface Quote {
  fromSymbol: string;
  toSymbol: string;
  /** Input amount in `from` base units. */
  amountIn: bigint;
  /** Output in `to` base units, rounded down (never over-promise). */
  amountOut: bigint;
  /** Output for exactly one whole `from` token, in `to` base units. */
  rate: bigint;
  /** USD value of the input, scaled by PRICE_DECIMALS. */
  valueInUsd: bigint;
  /** USD value of the output, scaled by PRICE_DECIMALS. */
  valueOutUsd: bigint;
}

function priceOf(token: Token): bigint {
  return parseUnits(token.priceUsd, PRICE_DECIMALS);
}

/**
 * amountOut = amountIn * priceIn / priceOut, adjusted for each token's
 * decimals. All multiplication happens before the single division so
 * precision is only lost once, at the final rounding.
 */
export function convert(amountIn: bigint, from: Token, to: Token): bigint {
  const numerator = amountIn * priceOf(from) * pow10(to.decimals);
  const denominator = priceOf(to) * pow10(from.decimals);
  return numerator / denominator;
}

/** USD value of an amount, scaled by PRICE_DECIMALS. */
export function toUsdValue(amount: bigint, token: Token): bigint {
  return (amount * priceOf(token)) / pow10(token.decimals);
}

export function buildQuote(amountIn: bigint, from: Token, to: Token): Quote {
  if (amountIn < 0n) throw new RangeError("amountIn must not be negative");

  const amountOut = convert(amountIn, from, to);
  return {
    fromSymbol: from.symbol,
    toSymbol: to.symbol,
    amountIn,
    amountOut,
    rate: convert(pow10(from.decimals), from, to),
    valueInUsd: toUsdValue(amountIn, from),
    valueOutUsd: toUsdValue(amountOut, to),
  };
}
