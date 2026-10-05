import { useId, useRef } from "react";
import type { Balances } from "../../../api/mockServer/mockServer";
import { PRICE_DECIMALS, type Token } from "../../../data/tokens/tokens";
import { useDynamicFontSize } from "../../../hooks/useDynamicFontSize/useDynamicFontSize";
import { balanceOf } from "../../../lib/balances/balances";
import { formatDisplay, formatSwapAmount, formatUsd } from "../../../lib/units/units";
import { TokenSelect } from "../../TokenSelect/TokenSelect";
import "./amountPanel.css";

interface AmountPanelProps {
  heading: string;
  selectLabel: string;
  tokens: readonly Token[];
  token: Token | undefined;
  counterpart: Token | undefined;
  balances: Balances | undefined;
  /** Text for the editable (input) side. */
  value?: string;
  /** Amount for the read-only (output) side, shown with swap-amount precision (6 significant figures). */
  outputAmount?: bigint | null;
  usdValue: bigint | null;
  onSelectToken: (symbol: string) => void;
  /** Omit for the read-only (output) side. */
  onChange?: (value: string) => void;
  onMax?: () => void;
  /** A swap is in flight: the field and controls are disabled. */
  isLocked?: boolean;
  isPending?: boolean;
}

export function AmountPanel({
  heading,
  selectLabel,
  tokens,
  token,
  counterpart,
  balances,
  value = "",
  outputAmount = null,
  usdValue,
  onSelectToken,
  onChange,
  onMax,
  isPending = false,
  isLocked = false,
}: AmountPanelProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const isEditable = Boolean(onChange);

  const displayValue = isEditable
    ? value
    : outputAmount !== null && token
      ? formatSwapAmount(outputAmount, token.decimals, "down") // never overstate what will be received
      : "";
  const fontSize = useDynamicFontSize(inputRef, displayValue);
  const balance = token && balances ? balanceOf(balances, token.symbol) : undefined;

  return (
    <section className={`amount-panel${isEditable ? " amount-panel--editable" : ""}`}>
      <label htmlFor={inputId} className="amount-panel__heading">
        {heading}
      </label>

      <div className="amount-panel__row">
        <input
          ref={inputRef}
          id={inputId}
          className="amount-panel__input"
          data-pending={isPending}
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          placeholder="0"
          value={displayValue}
          style={{ fontSize }}
          readOnly={!isEditable}
          disabled={isEditable && isLocked}
          onChange={(event) => onChange?.(event.target.value)}
        />
        <TokenSelect
          label={selectLabel}
          tokens={tokens}
          selected={token}
          counterpart={counterpart}
          balances={balances}
          onSelect={onSelectToken}
          isLocked={isLocked}
        />
      </div>

      <div className="amount-panel__meta">
        <span className="amount-panel__usd">{usdValue === null ? " " : formatUsd(usdValue, PRICE_DECIMALS)}</span>
        {token && (
          <span className="amount-panel__balance">
            Balance{" "}
            <span className="amount-panel__balance-value">
              {balance === undefined ? "…" : formatDisplay(balance, token.decimals, 6)}
            </span>
            {onMax && balance !== undefined && balance > 0n && (
              <button type="button" className="amount-panel__max" onClick={onMax} disabled={isLocked}>
                Max
              </button>
            )}
          </span>
        )}
      </div>
    </section>
  );
}
