import { describe, expect, it } from "vitest";
import { balanceOf } from "./balances";

describe("balanceOf", () => {
  const balances = { ETH: 5n, USDC: 0n };

  it("returns the balance held for a symbol", () => {
    expect(balanceOf(balances, "ETH")).toBe(5n);
  });

  it("returns zero for a symbol the wallet has never held", () => {
    expect(balanceOf(balances, "ATOM")).toBe(0n);
  });

  it("is case-sensitive, since feed symbols such as wstETH and bNEO are", () => {
    expect(balanceOf(balances, "eth")).toBe(0n);
  });

  it.each(["constructor", "toString", "__proto__", "hasOwnProperty"])(
    "returns zero for %s instead of an Object.prototype member",
    (symbol) => {
      expect(balanceOf(balances, symbol)).toBe(0n);
    },
  );
});
