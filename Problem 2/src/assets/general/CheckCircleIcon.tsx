import type { SVGProps } from "react";

/** Tick in a filled circle. Has no colours of its own: style `circle` (fill) and `path` (stroke) via `className`. */
export function CheckCircleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" {...props}>
      <circle cx="10" cy="10" r="9" />
      <path className="icon-stroke--bold" d="m6 10.2 2.6 2.6L14 7.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
