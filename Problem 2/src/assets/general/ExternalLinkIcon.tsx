import type { SVGProps } from "react";

/** Up-right arrow marking a link that opens elsewhere. Drawn in the current text colour. */
export function ExternalLinkIcon({ className = "", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg className={`icon-stroke ${className}`.trim()} viewBox="0 0 12 12" aria-hidden="true" {...props}>
      <path d="M4.5 2.5h5v5M9.5 2.5 3 9" fill="none" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}
