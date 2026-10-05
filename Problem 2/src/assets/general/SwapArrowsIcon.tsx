import type { SVGProps } from "react";

/** Opposing up and down arrows, for swapping two sides. Drawn in the current text colour. */
export function SwapArrowsIcon({ className = "", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg className={`icon-stroke--bold ${className}`.trim()} viewBox="0 0 20 20" aria-hidden="true" {...props}>
      <path
        d="M6 3v12m0 0-3-3m3 3 3-3M14 17V5m0 0-3 3m3-3 3 3"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
