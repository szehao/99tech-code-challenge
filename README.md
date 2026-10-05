# 99Tech code challenge

Solutions to the three problems of the 99Tech code challenge, written in TypeScript.

| Problem | What it is | Details |
|---|---|---|
| [Problem 1](./Problem%201) | Three ways to sum 1 to n: a loop, recursion and the Gauss formula, with a Vitest suite | [README](./Problem%201/README.md) |
| [Problem 2](./Problem%202) | A currency swap form in React 19, Vite and SWR, with live token prices and simulated quotes, balances and swaps | [README](./Problem%202/README.md) |
| [Problem 3](./Problem%203) | The inefficiencies and anti-patterns in a messy React component, and a refactored version | [README](./Problem%203/README.md) |

## Getting started

Requires Node.js 20.19 or later. The repository is an npm workspace, so install once from the root:

```bash
npm install
```

Then, from the root:

| Command | What it does |
|---|---|
| `npm test` | Runs the test suites (Problems 1 and 2) |
| `npm run typecheck` | Type-checks all three problems |
| `npm run build` | Builds Problem 2 for production |
| `npm run dev -w "Problem 2"` | Starts the swap form at http://localhost:5173 |

Each problem's README lists its own commands. Run them from the root with `-w "Problem N"`, for example `npm test -w "Problem 1"`.

## Layout

```
Problem 1/          sum_to_n implementations and tests
Problem 2/          currency swap form (Vite app)
Problem 3/          refactored WalletPage and README.md
tsconfig.base.json  TypeScript settings shared by all three
```
