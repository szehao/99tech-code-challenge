# Problem 1: Three ways to sum to n

`sum_to_n(n)` returns `1 + 2 + ... + n`, so `sum_to_n(5) === 15`. [`src/index.ts`](./src/index.ts) implements it three ways.

| Function | Approach | Time | Space |
|---|---|---|---|
| `sum_to_n_a` | Loop that adds 1 to n | O(n) | O(1) |
| `sum_to_n_b` | Recursion: `n + sum(n - 1)` | O(n) | O(n) call stack |
| `sum_to_n_c` | Gauss formula: `n * (n + 1) / 2` | O(1) | O(1) |

## Input

- **`n = 0`** returns `0`.
- **A negative `n`** throws a `RangeError` (`n must be 0 or greater, got -5`). The sum isn't defined for it, so all three functions reject it the same way instead of quietly returning a number. The check runs once, before any work.
- **Large `n`.** The challenge guarantees the result stays below `Number.MAX_SAFE_INTEGER`, which allows `n` up to 134,217,727. The loop and the formula are exact up to that limit.

## Trade-offs

- **The formula** is the one to use: constant time and exact within the safe-integer range.
- **The loop** is the most obvious version, but its time grows with `n`. At the largest allowed `n` it runs about 134 million additions.
- **The recursion** is the least practical. Each step adds a stack frame, so it throws a `RangeError` (call stack overflow) well below the allowed limit, around a few thousand to tens of thousands of steps depending on the engine. It's here to show the approach, not for real use.

`n` is assumed to be a whole number, as the challenge states. For a non-integer such as `2.5` the three functions return different results (3, 4.5 and 4.375).

## Running it

From the repository root:

```bash
npm install
npm test -w "Problem 1"        # Vitest suite
npm run typecheck -w "Problem 1"
```

The tests in [`src/index.test.ts`](./src/index.test.ts) cover:
- known sums for each function
- `n = 0`, and the `RangeError` for negative `n`
- the three functions agreeing for every `n` from 0 to 1000
- exactness at the largest allowed `n`
- the recursion overflowing the call stack for a large `n`
