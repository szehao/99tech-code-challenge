# Problem 3: Messy React

The refactored code is in [`index.tsx`](./index.tsx).

## Notes
- `useWalletBalances`, `usePrices`, `WalletRow`, `classes` and `BoxProps` come from the host app and aren't part of the challenge. They're declared with `declare` at the top of `index.tsx` so the file type-checks on its own; in a real codebase they would be imports.
- Potential problem: capitalisation. `"ethereum"` won't match `"Ethereum"`. If the API isn't consistent about case, `blockchain` needs to be normalised before the lookup.

## Issues, in the order they appear in the original code

### 1. `getPriority` is defined inside the component (wasted work)

A new function is created on every render even though the priorities don't depend on props or state.

**Fix:** move the function out of the component and transform it into a module-level lookup table (`PRIORITY`), created once.

### 2. `getPriority(blockchain: any)` (anti-pattern)

`any` switches off type checking at exactly the place where the data is wrong (see 4).

**Fix:** the `isBlockchain` check takes `unknown` and narrows it to a known chain name, so every input is checked instead of trusted. It uses `Object.hasOwn`, not a plain `PRIORITY[chain]` lookup: a plain lookup also finds names every object inherits, so `PRIORITY["toString"]` would return a function instead of `undefined`. `Object.hasOwn` matches only the table's own keys.

### 3. Unknown chains return the magic number `-99` (anti-pattern)

"Unknown chain" is encoded as a number that every caller has to remember to compare against. It's easy to get wrong, as 5 shows.

**Fix:** ask the question directly with `isBlockchain(chain)` instead of comparing against a sentinel.

### 4. `blockchain` isn't part of the type (logic error)

```ts
const balancePriority = getPriority(balance.blockchain);
```

`WalletBalance` has no `blockchain` field, yet filtering and sorting both read `balance.blockchain`. The `any` in 2 hides the mismatch instead of fixing it.

**Fix:** add `blockchain: string` to `WalletBalance`. It stays a plain `string`, because the API can return chains we don't know about.

### 5. The filter uses an undefined variable (logic error)

```ts
const balancePriority = getPriority(balance.blockchain);
if (lhsPriority > -99) {}
```

It computes `balancePriority` but checks `lhsPriority`, which doesn't exist. This throws a `ReferenceError` the first time the filter runs.

**Fix:** the named check `isKnownPositive` replaces the variable and the nested `if`s.

### 6. The filter is backwards (logic error)

```ts
if (balance.amount <= 0) {
  return true;
}
```

Even with the variable name fixed, this keeps balances that are zero or negative and drops every positive one, so the page would show only empty balances.

**Fix:** keep balances with a known chain **and** `amount > 0` (`isKnownPositive`).

### 7. `getPriority` is called inside the sort comparator (wasted work)

```ts
const leftPriority = getPriority(lhs.blockchain);
const rightPriority = getPriority(rhs.blockchain);
```

The comparator runs about n·log n times, and each run looks up two priorities, so the same balances are looked up over and over. For a known small list, this should not be a problem. 

**Fix:** look each priority up once, in a `.map` before sorting, and sort on the stored value.

### 8. The sort never returns 0 for a tie (logic error)

The comparator returns `-1` or `1` but falls through to `undefined` when two priorities are equal (Zilliqa and Neo are both 20). A comparator must return a number for every pair.

**Fix:** `rhs.priority - lhs.priority` handles all three cases.

### 9. `prices` is in the `useMemo` dependencies but isn't used (wasted work)

```ts
}, [balances, prices]);
```

The filter and sort rerun on every price update, even though they depend only on `balances`. Prices are the value most likely to change often. The component re-renders whenever prices change anyway, so the rows pick up the new `usdValue` without `prices` in the memo's dependencies.

**Fix:** depend on `[balances]` only.

### 10. `formattedBalances` is built and never used (wasted work)

The list is copied and formatted on every render, and the result is thrown away (see 12).

**Fix:** remove the separate pass; format each amount where the row is rendered.

### 11. `toFixed()` drops every decimal (logic error)

`toFixed()` with no argument means 0 decimals, so `0.75` shows as `"1"` and `12.4` as `"12"`. For a wallet, that's a wrong amount on screen. It would be worse if the rounded string were reused in calculations, but here it's only displayed: `usdValue` uses the raw `balance.amount`.

**Fix:** `toFixed(AMOUNT_DECIMALS)`, an explicit 2 decimals set in one named constant. The value is only used for display.

### 12. The rows use the unformatted list (logic error)

```ts
const rows = sortedBalances.map((balance: FormattedWalletBalance) => ...
  formattedAmount={balance.formatted}                        // always undefined
```

`rows` maps over `sortedBalances` instead of `formattedBalances`, so `balance.formatted` is always `undefined`. The `FormattedWalletBalance` annotation hides this from TypeScript.

**Fix:** with the separate formatting pass gone (10), the rows format the amount themselves, so there's no second list to mix up.

### 13. `formattedBalances` and `rows` are rebuilt on every render (wasted work)

Neither is memoized, so both lists are rebuilt even when nothing they depend on has changed.

**Fix:** the filtering and sorting are memoized on `balances`, and only a single cheap map to rows remains. The rows aren't memoized, because they need `prices` and must update when prices do.

### 14. A missing price gives `NaN` (logic error)

```ts
const usdValue = prices[balance.currency] * balance.amount;
```

When the currency has no price, `usdValue` is `NaN`, and that `NaN` is passed straight to the row.

**Fix:** `(prices[balance.currency] ?? 0) * balance.amount`, so a missing price counts as 0.

### 15. `key={index}` on a filtered, sorted list (anti-pattern)

When the order changes, React matches rows by position and reuses the wrong ones.

**Fix:** a key that identifies the item, `` `${balance.blockchain}-${balance.currency}` ``.

### 16. `children` is discarded (logic error)

```ts
const { children, ...rest } = props;
...
<div {...rest}>{rows}</div>
```

`children` is pulled out of props but never rendered, so anything passed inside `<WalletPage>` disappears.

**Fix:** render `{children}` inside the `div`.

### 17. The props type is declared twice (anti-pattern)

`React.FC<Props> = (props: Props) => ...` repeats the type for no gain, and `Props` is an empty interface that adds nothing to `BoxProps`.

**Fix:** `React.FC<BoxProps> = ({ children, ...rest }) => ...`: one type, with props destructured in the parameter list.

## Summary

**What was removed:** `FormattedWalletBalance`, the unused `formattedBalances` pass, the empty `Props` interface (the component takes `BoxProps` directly) and the `-99` sentinel.

### Why `filter` and `map` rather than one `reduce`

A single `reduce` (or `flatMap`) would loop over the list once instead of twice, but the gain is negligible: the sort, at O(n log n), costs more than both passes combined, and a wallet holds tens of balances. `filter` then `map` reads more plainly, each step does one thing, and the named check carries the type through. On a very large list a single pass would save one loop, though the sort still dominates.

