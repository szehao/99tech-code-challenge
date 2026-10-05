// Problem 3: Messy React 

import { useMemo, type HTMLAttributes, type ReactElement } from "react";

// Provided by the host app (not part of this challenge)
// Declared so the file type-checks on its own.
type BoxProps = HTMLAttributes<HTMLDivElement>;
declare function useWalletBalances(): WalletBalance[];
declare function usePrices(): Record<string, number>;
declare function WalletRow(props: {
  className?: string;
  amount: number;
  usdValue: number;
  formattedAmount: string;
}): ReactElement;
declare const classes: { row: string };

interface WalletBalance {
  currency: string;
  amount: number;
  /** Comes from the API, so it can be a chain we don't know about. */
  blockchain: string;
}

const AMOUNT_DECIMALS = 2;

const PRIORITY = {
  Osmosis: 100,
  Ethereum: 50,
  Arbitrum: 30,
  Zilliqa: 20,
  Neo: 20,
} as const satisfies Record<string, number>;

type Blockchain = keyof typeof PRIORITY;
type KnownBalance = WalletBalance & { blockchain: Blockchain };

// Own keys only, so inherited names like "toString" or "constructor" never match.
const isBlockchain = (chain: unknown): chain is Blockchain =>
  typeof chain === "string" && Object.hasOwn(PRIORITY, chain);

const isKnownPositive = (balance: WalletBalance): balance is KnownBalance =>
  isBlockchain(balance.blockchain) && balance.amount > 0;

const WalletPage: React.FC<BoxProps> = ({ children, ...rest }) => {
  const balances = useWalletBalances();
  const prices = usePrices();

  // Depends on balances only, so price updates don't re-filter and re-sort.
  const sortedBalances = useMemo(
    () =>
      balances
        .filter(isKnownPositive)
        .map((balance) => ({ ...balance, priority: PRIORITY[balance.blockchain] }))
        .sort((lhs, rhs) => rhs.priority - lhs.priority),
    [balances],
  );

  return (
    <div {...rest}>
      {sortedBalances.map((balance) => (
        <WalletRow
          key={`${balance.blockchain}-${balance.currency}`}
          className={classes.row}
          amount={balance.amount}
          usdValue={(prices[balance.currency] ?? 0) * balance.amount}
          formattedAmount={balance.amount.toFixed(AMOUNT_DECIMALS)}
        />
      ))}
      {children}
    </div>
  );
}

export default WalletPage;