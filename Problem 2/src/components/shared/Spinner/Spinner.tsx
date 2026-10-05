import "./spinner.css";

/**
 * Decorative: every spinner sits next to visible text that already says what is loading,
 * so announcing it too would make screen readers read that text twice.
 */
export function Spinner() {
  return <span className="spinner" aria-hidden="true" data-testid="spinner" />;
}
