import { describe, expect, it } from "vitest";
import { sum_to_n_a, sum_to_n_b, sum_to_n_c } from "./index";

const implementations = [
  ["sum_to_n_a (loop)", sum_to_n_a],
  ["sum_to_n_b (recursion)", sum_to_n_b],
  ["sum_to_n_c (Gauss formula)", sum_to_n_c],
] as const;

/** Largest n whose sum stays within Number.MAX_SAFE_INTEGER, the limit the challenge allows. */
const LARGEST_SAFE_N = 134_217_727;

describe.each(implementations)("%s", (_name, sumToN) => {
  it.each([
    [1, 1],
    [2, 3],
    [5, 15],
    [10, 55],
    [100, 5050],
  ])("sums 1..%i to %i", (n, expected) => {
    expect(sumToN(n)).toBe(expected);
  });

  it("returns 0 for n = 0", () => {
    expect(sumToN(0)).toBe(0);
  });

  it.each([-1, -5, -100])("throws a RangeError for negative n = %i", (n) => {
    expect(() => sumToN(n)).toThrow(new RangeError(`n must be 0 or greater, got ${n}`));
  });
});

describe("all implementations", () => {
  it("agree for every n from 0 to 1000", () => {
    for (let n = 0; n <= 1000; n++) {
      const expected = sum_to_n_c(n);
      expect(sum_to_n_a(n), `sum_to_n_a(${n})`).toBe(expected);
      expect(sum_to_n_b(n), `sum_to_n_b(${n})`).toBe(expected);
    }
  });
});

describe("at the safe-integer limit", () => {
  it("the formula stays exact for the largest allowed n", () => {
    const result = sum_to_n_c(LARGEST_SAFE_N);
    expect(result).toBe(9_007_199_187_632_128);
    expect(Number.isSafeInteger(result)).toBe(true);
  });

  it("the loop matches the formula for the largest allowed n", () => {
    expect(sum_to_n_a(LARGEST_SAFE_N)).toBe(sum_to_n_c(LARGEST_SAFE_N));
  });

  it("the recursion overflows the call stack long before that", () => {
    // One stack frame per step, so recursion is only usable for small n.
    expect(() => sum_to_n_b(1_000_000)).toThrow(RangeError);
  });
});
