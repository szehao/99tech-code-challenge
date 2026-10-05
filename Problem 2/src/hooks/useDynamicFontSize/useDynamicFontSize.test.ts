import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AMOUNT_MAX_FONT_PX, AMOUNT_MIN_FONT_PX, useDynamicFontSize } from "./useDynamicFontSize";

const FIELD_WIDTH = 240;
const GLYPH_EM = 0.6; // monospace advance

function fieldOfWidth(width: number): { current: HTMLInputElement } {
  const input = document.createElement("input");
  Object.defineProperty(input, "clientWidth", { value: width });
  return { current: input };
}

describe("useDynamicFontSize", () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      font: "",
      measureText: (text: string) => ({ width: text.length * GLYPH_EM * 100 }),
    } as unknown as CanvasRenderingContext2D);
  });

  it("keeps the maximum size when the value fits", () => {
    const { result } = renderHook(() => useDynamicFontSize(fieldOfWidth(FIELD_WIDTH), "1646.13"));
    expect(result.current).toBe(AMOUNT_MAX_FONT_PX);
  });

  it("shrinks proportionally so a longer value fits the field", () => {
    const text = "1646.1341359"; // 12 chars * 0.6em = 7.2em -> 240 / 7.2 = 33px
    const { result } = renderHook(() => useDynamicFontSize(fieldOfWidth(FIELD_WIDTH), text));
    expect(result.current).toBe(33);
    expect(text.length * GLYPH_EM * result.current).toBeLessThanOrEqual(FIELD_WIDTH);
  });

  it("never goes below the minimum size", () => {
    const { result } = renderHook(() => useDynamicFontSize(fieldOfWidth(FIELD_WIDTH), "0.123456789012345678"));
    expect(result.current).toBe(AMOUNT_MIN_FONT_PX);
  });

  it("grows back when the value gets shorter", () => {
    const ref = fieldOfWidth(FIELD_WIDTH);
    const { result, rerender } = renderHook(({ text }) => useDynamicFontSize(ref, text), {
      initialProps: { text: "1646.1341359" },
    });
    rerender({ text: "1" });
    expect(result.current).toBe(AMOUNT_MAX_FONT_PX);
  });

  it("stays at the maximum when the field has not been laid out", () => {
    const { result } = renderHook(() => useDynamicFontSize(fieldOfWidth(0), "0.123456789012345678"));
    expect(result.current).toBe(AMOUNT_MAX_FONT_PX);
  });
});
