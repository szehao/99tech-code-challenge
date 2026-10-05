import type { SVGProps } from "react";

/** Downward chevron for dropdown triggers. Drawn in the current text colour. */
export function ChevronDownIcon({ className = "", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg className={`icon-stroke ${className}`.trim()} viewBox="0 0 12 12" aria-hidden="true" {...props}>
      <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}
