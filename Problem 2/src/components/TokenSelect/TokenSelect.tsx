import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import type { Balances } from "../../api/mockServer/mockServer";
import { PRICE_DECIMALS, type Token } from "../../data/tokens/tokens";
import { balanceOf } from "../../lib/balances/balances";
import { formatDisplay, parseUnits } from "../../lib/units/units";
import { ChevronDownIcon } from "../../assets/general/ChevronDownIcon";
import { TokenIcon } from "../shared/TokenIcon/TokenIcon";
import "./tokenSelect.css";

interface TokenSelectProps {
  /** Accessible name for the trigger, e.g. "Select token to sell". */
  label: string;
  tokens: readonly Token[];
  selected: Token | undefined;
  /** Token chosen on the opposite side; picking it swaps the sides. */
  counterpart: Token | undefined;
  balances: Balances | undefined;
  onSelect: (symbol: string) => void;
  /** Disables the trigger, e.g. while a swap is in flight. */
  isLocked?: boolean;
}

function matches(token: Token, query: string): boolean {
  const needle = query.trim().toLowerCase();
  return token.symbol.toLowerCase().includes(needle);
}

export function TokenSelect({
  label,
  tokens,
  selected,
  counterpart,
  balances,
  onSelect,
  isLocked = false,
}: TokenSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  // Set when the active option changes by keyboard, search or opening; hovering only highlights,
  // so the list never scrolls under the pointer.
  const shouldScrollToActiveRef = useRef(false);

  const listboxId = useId();

  const optionId = (symbol: string) => `${listboxId}-${symbol}`;

  const filtered = tokens.filter((token) => matches(token, query));
  const activeToken = filtered[Math.min(activeIndex, filtered.length - 1)];

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  // Brings the active option into view. A layout effect, so on open the list is already scrolled to
  // the selected token in the first frame (no flash of the top). Only the list scrolls: scrollIntoView
  // would also scroll the page and measure the popover mid-animation.
  useLayoutEffect(() => {
    const list = listRef.current;
    const option = activeToken && document.getElementById(`${listboxId}-${activeToken.symbol}`);
    if (!isOpen || !list || !option || !shouldScrollToActiveRef.current) return;
    shouldScrollToActiveRef.current = false;

    const { offsetTop, offsetHeight } = option;
    if (offsetTop < list.scrollTop) {
      list.scrollTop = offsetTop;
    } else if (offsetTop + offsetHeight > list.scrollTop + list.clientHeight) {
      list.scrollTop = offsetTop + offsetHeight - list.clientHeight;
    }
  }, [isOpen, activeToken, listboxId]);

  /** Moves the active option and scrolls it into view (unlike hovering, which only highlights). */
  const moveActiveIndex = (next: number | ((index: number) => number)) => {
    shouldScrollToActiveRef.current = true;
    setActiveIndex(next);
  };

  /** Hover: highlights the option without scrolling the list under the pointer. */
  const highlightIndex = (index: number) => {
    shouldScrollToActiveRef.current = false;
    setActiveIndex(index);
  };

  const handleOpen = () => {
    setQuery("");
    const selectedIndex = tokens.findIndex((token) => token.symbol === selected?.symbol);
    moveActiveIndex(Math.max(selectedIndex, 0));
    setIsOpen(true);
  };

  const handleClose = (shouldRestoreFocus: boolean) => {
    setIsOpen(false);
    if (shouldRestoreFocus) triggerRef.current?.focus();
  };

  const handleSelect = (symbol: string) => {
    onSelect(symbol);
    handleClose(true);
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const lastIndex = filtered.length - 1;
    const keyActions: Record<string, () => void> = {
      ArrowDown: () => moveActiveIndex((index) => (index >= lastIndex ? 0 : index + 1)),
      ArrowUp: () => moveActiveIndex((index) => (index <= 0 ? lastIndex : index - 1)),
      Home: () => moveActiveIndex(0),
      End: () => moveActiveIndex(lastIndex),
      Enter: () => activeToken && handleSelect(activeToken.symbol),
      Escape: () => handleClose(true),
      Tab: () => handleClose(false),
    };
    const action = keyActions[event.key];
    if (!action) return;
    if (event.key !== "Tab") event.preventDefault();
    action();
  };

  return (
    <div className="token-select" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className={`token-select__trigger${selected ? "" : " token-select__trigger--empty"}`}
        aria-label={selected ? `${label}, ${selected.symbol} selected` : label}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={isLocked}
        onClick={() => (isOpen ? handleClose(false) : handleOpen())}
      >
        {selected ? (
          <>
            <TokenIcon symbol={selected.symbol} />
            <span className="token-select__symbol">{selected.symbol}</span>
          </>
        ) : (
          <span className="token-select__symbol">Select</span>
        )}
        <ChevronDownIcon className="token-select__chevron" />
      </button>

      {isOpen && (
        <div className="token-select__popover">
          <input
            autoFocus
            className="token-select__search"
            type="text"
            role="combobox"
            placeholder="Search symbol"
            aria-label="Search tokens"
            aria-expanded="true"
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={activeToken ? optionId(activeToken.symbol) : undefined}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              moveActiveIndex(0);
            }}
            onKeyDown={handleSearchKeyDown}
          />
          <ul ref={listRef} id={listboxId} role="listbox" aria-label="Tokens" className="token-select__list">
            {filtered.map((token) => {
              const isSelected = token.symbol === selected?.symbol;
              const isCounterpart = token.symbol === counterpart?.symbol;
              const balance = balances ? balanceOf(balances, token.symbol) : undefined;
              return (
                <li
                  key={token.symbol}
                  id={optionId(token.symbol)}
                  role="option"
                  aria-selected={isSelected}
                  data-active={token.symbol === activeToken?.symbol}
                  className="token-select__option"
                  onPointerMove={() => highlightIndex(filtered.indexOf(token))}
                  onClick={() => handleSelect(token.symbol)}
                >
                  <TokenIcon symbol={token.symbol} />
                  <span className="token-select__option-text">
                    <span className="token-select__option-symbol">
                      {token.symbol}
                      {isCounterpart && <span className="token-select__tag">swap sides</span>}
                    </span>
                    <span className="token-select__option-name">${formatDisplay(parseUnits(token.priceUsd, PRICE_DECIMALS), PRICE_DECIMALS, 6)}</span>
                  </span>
                  <span className="token-select__option-balance">
                    {balance === undefined ? "—" : formatDisplay(balance, token.decimals, 4)}
                  </span>
                </li>
              );
            })}
          </ul>
          {/* Outside the listbox (which may only contain options) and announced politely. */}
          <p className="token-select__empty" role="status">
            {filtered.length === 0 ? `No tokens match “${query}”` : ""}
          </p>
        </div>
      )}
    </div>
  );
}
