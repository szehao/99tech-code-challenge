/**
 * Own-property balance lookup. Token symbols come from an external feed, so a symbol like
 * "constructor" or "toString" must not resolve to something on Object.prototype.
 */
export function balanceOf(balances: Readonly<Record<string, bigint>>, symbol: string): bigint {
  return Object.hasOwn(balances, symbol) ? balances[symbol] : 0n;
}
