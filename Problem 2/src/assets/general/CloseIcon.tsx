import type { SVGProps } from "react";

/** Cross for dismiss buttons. Drawn in the current text colour. */
export function CloseIcon({ className = "", ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg className={`icon-stroke ${className}`.trim()} viewBox="0 0 12 12" aria-hidden="true" {...props}>
      <path d="m2.5 2.5 7 7m0-7-7 7" fill="none" stroke="currentColor" strokeLinecap="round" />
    </svg>
  );
}
