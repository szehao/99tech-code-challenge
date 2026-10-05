# Problem 2 — Currency swap form

- **Token list and USD prices** come live from `https://interview.switcheo.com/prices.json`. The icons are the matching SVGs from [Switcheo/token-icons](https://github.com/Switcheo/token-icons).
- **Quotes, wallet balances and swaps are simulated** in the browser (`src/api/mockServer/mockServer.ts`). Nothing touches a chain, which is why the header badge reads **Demo**.
- **"Simulate network latency"** below the card delays every simulated request by 0.6–1.8 s, so you can see the loading states, caching and the locked form during a swap.

## Running it

This folder is an npm workspace of the repository root, and its `tsconfig` files extend the root `tsconfig.base.json`, so it is not meant to be copied out on its own. Install from the **root**:

```bash
npm install                      # at the repo root (Node >= 20.19)
npm run dev -w "Problem 2"       # http://localhost:5173
```

| Script (`npm run <name> -w "Problem 2"`) | What it does |
|---|---|
| `dev` | Vite dev server |
| `build` / `preview` | Type-check and build to `dist/`, then serve the build |
| `typecheck` | `tsc -b` for the app and the configs |
| `lint` | ESLint (typescript-eslint + React hooks rules); any warning fails |
| `check` | `lint` + `typecheck` + `test` in one go |
| `test` / `test:watch` / `coverage` | Vitest unit and component tests (jsdom) |

## How it works

```
src/
  api/          priceFeed.ts (live feed: validate, de-duplicate, exact decimals) · mockServer.ts (quotes, balances, swaps)
  data/         tokens.ts (decimals, default pair, starting balances)
  lib/          units.ts (bigint amount parsing/formatting) · quote.ts (conversion) · balances.ts
  hooks/        SWR data hooks (useTokens, useBalances, useQuote) · useSwapForm · useSwapExecution
                useDynamicFontSize · useDebouncedValue
  context/      latency/ (simulated network latency on/off)
  components/   swap/ (card, useSwapCard, amount panels, details) · TokenSelect/ · Toast/ · latency/ · shared/
  assets/       tokens/ (token logos, loaded by URL) · general/ (UI icons as components)
  styles/       tokens/ (design tokens) · global.css
  test-utils/   test setup, providers wrapper, price-feed fixtures
```

- **Exact money maths.** Amounts are `bigint` base units (18 decimals), never floats. Feed prices are converted from JS numbers to exact decimal strings before any arithmetic.
- **Display rounding** uses 6 significant figures, and 2–5 decimals between 0.1 and 1. Amounts you will *receive* round **down**, so the UI never shows more than you get.
- **Caching (SWR).**
  - The token list loads once per session; if the feed fails, an error card offers Retry.
  - Quotes are cached for 30 s per pair and amount, and typing is debounced by 300 ms.
  - After a swap, balances are written into the cache from the swap receipt.
- **Amount input.**
  - Input is limited to the token's decimals and to 15 whole-number digits (far beyond any real balance).
  - Long values shrink the font (36 → 24 px) instead of being cut off with an ellipsis.
  - Thousands separators are stripped, so typing or pasting "12,500.42" gives 12500.42.
- **Swaps.**
  - The amount field and controls are disabled while a swap is in flight.
  - Success shows a toast for 3 s. It pauses while hovered or focused, and its "View TX" link opens an empty tab, since there is no real chain to link to.
  - Failures show an inline error that clears as soon as you change the form.
- **Accessibility.**
  - The token picker follows the combobox/listbox pattern.
  - The toast is announced through a live region and is reachable with Tab.
  - Text colours meet WCAG AA contrast.
  - One global rule honours reduced motion.
  - Automated axe checks run in the component tests.

## Design tokens

The "Noir Atelier" theme's shared values (colours, fonts, a few motion timings) live in `src/styles/tokens/tokens.css`. One-off sizes and spacing are written directly in each component's CSS.
