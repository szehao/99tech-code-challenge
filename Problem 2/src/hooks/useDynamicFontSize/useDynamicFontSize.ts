import { useCallback, useEffect, useLayoutEffect, useState, type RefObject } from "react";

/**
 * The size range (36 → 24px) comes from the --amount-font-max / --amount-font-min design tokens.
 * These constants are only used where the tokens cannot be read (no layout, e.g. jsdom) and for
 * the initial render before measuring.
 */
export const AMOUNT_MAX_FONT_PX = 36;
export const AMOUNT_MIN_FONT_PX = 24;
const MAX_FONT_TOKEN = "--amount-font-max";
const MIN_FONT_TOKEN = "--amount-font-min";

function readPxToken(element: HTMLElement, name: string, fallback: number): number {
  const value = Number.parseFloat(getComputedStyle(element).getPropertyValue(name));
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

const MEASURE_FONT_PX = 100;
let measureContext: CanvasRenderingContext2D | null | undefined;

/** Width of `text` at 1px font size, using the element's own font family, weight and letter-spacing. */
function widthPerFontPx(element: HTMLElement, text: string): number {
  measureContext ??= document.createElement("canvas").getContext("2d");
  if (!measureContext) return 0;
  const style = getComputedStyle(element);
  measureContext.font = `${style.fontWeight} ${MEASURE_FONT_PX}px ${style.fontFamily}`;
  const glyphs = measureContext.measureText(text).width / MEASURE_FONT_PX;
  const fontPx = Number.parseFloat(style.fontSize) || AMOUNT_MAX_FONT_PX;
  const spacingEm = (Number.parseFloat(style.letterSpacing) || 0) / fontPx;
  return glyphs + spacingEm * text.length;
}

/**
 * Shrinks an input's font so its value fits instead of being cut off:
 * size = max * available / needed, clamped to [min, max]. Below the minimum the input scrolls natively.
 */
export function useDynamicFontSize(ref: RefObject<HTMLElement | null>, text: string): number {
  const [fontSize, setFontSize] = useState(AMOUNT_MAX_FONT_PX);

  const fit = useCallback(() => {
    const element = ref.current;
    if (!element) return;
    const maxPx = readPxToken(element, MAX_FONT_TOKEN, AMOUNT_MAX_FONT_PX);
    const minPx = readPxToken(element, MIN_FONT_TOKEN, AMOUNT_MIN_FONT_PX);
    if (element.clientWidth === 0) {
      setFontSize(maxPx);
      return;
    }
    const perPx = widthPerFontPx(element, text || "0");
    if (perPx <= 0) return;
    const ideal = Math.floor(element.clientWidth / perPx);
    setFontSize(Math.min(maxPx, Math.max(minPx, ideal)));
  }, [ref, text]);

  // Layout effect so the corrected size paints in the same frame as the new value (no overflow flash).
  useLayoutEffect(fit, [fit]);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    let isActive = true;
    const refit = () => isActive && fit();
    const observer = new ResizeObserver(refit);
    observer.observe(element);
    document.fonts?.ready.then(refit);
    return () => {
      isActive = false;
      observer.disconnect();
    };
  }, [ref, fit]);

  return fontSize;
}
