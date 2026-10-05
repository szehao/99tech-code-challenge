import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type FocusEvent, type ReactNode } from "react";
import { CheckCircleIcon } from "../../assets/general/CheckCircleIcon";
import { CloseIcon } from "../../assets/general/CloseIcon";
import "./toast.css";

export const TOAST_DURATION_MS = 3000;

interface ToastProps {
  title: string;
  children?: ReactNode;
  onClose: () => void;
  durationMs?: number;
}

/**
 * A dismissible notification that closes itself after `durationMs`. The countdown pauses while
 * hovered or while keyboard focus is inside it, and resumes with the time that was left.
 * Its container (e.g. SwapCard's toast region) decides where on the page it sits.
 */
export function Toast({ title, children, onClose, durationMs = TOAST_DURATION_MS }: ToastProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const isPaused = isHovered || hasFocus;
  const remainingMsRef = useRef(durationMs);
  const rootRef = useRef<HTMLDivElement>(null);

  // mouseenter only fires when the pointer moves, so a toast that appears under a resting
  // cursor would otherwise count down while visibly hovered. Read the real hover state on mount.
  useLayoutEffect(() => {
    if (rootRef.current?.matches(":hover")) setIsHovered(true);
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const startedAt = Date.now();
    const timer = setTimeout(onClose, remainingMsRef.current);
    return () => {
      clearTimeout(timer);
      remainingMsRef.current = Math.max(remainingMsRef.current - (Date.now() - startedAt), 0);
    };
  }, [isPaused, onClose]);

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHasFocus(false);
  };

  const style = { "--toast-duration": `${durationMs}ms` } as CSSProperties;

  // Rendered in place: the caller puts it inside an always-mounted live region that follows
  // the triggering form in DOM order, so it is both announced and reachable with Tab.
  return (
    <div
      ref={rootRef}
      className="toast"
      data-paused={isPaused}
      style={style}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setHasFocus(true)}
      onBlur={handleBlur}
    >
      <CheckCircleIcon className="toast__icon" />
      <div className="toast__body">
        <p className="toast__title">{title}</p>
        {children}
      </div>
      <button type="button" className="toast__close" aria-label="Dismiss notification" onClick={onClose}>
        <CloseIcon />
      </button>
      <span className="toast__timer" aria-hidden="true" />
    </div>
  );
}
