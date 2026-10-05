import { SIMULATED_LATENCY } from "../../api/mockServer/mockServer";
import { useLatency } from "../../context/latency/useLatency";
import "./latencyToggle.css";

const RANGE_TEXT = `${SIMULATED_LATENCY.minMs / 1000}–${SIMULATED_LATENCY.maxMs / 1000}s`;

export function LatencyToggle() {
  const { isEnabled, toggle } = useLatency();
  const description = isEnabled
    ? `Every request waits ${RANGE_TEXT}. Cached quotes still return instantly.`
    : "Requests resolve instantly.";

  return (
    <div className="latency-toggle">
      <button
        type="button"
        role="switch"
        aria-checked={isEnabled}
        aria-describedby="latency-description"
        className="latency-toggle__switch"
        onClick={toggle}
      >
        <span className="latency-toggle__track" aria-hidden="true">
          <span className="latency-toggle__thumb" />
        </span>
        <span className="latency-toggle__label">Simulate network latency</span>
      </button>
      <p id="latency-description" className="latency-toggle__description">
        {description}
      </p>
    </div>
  );
}
