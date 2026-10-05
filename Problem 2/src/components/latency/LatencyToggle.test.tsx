import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../test-utils/testUtils";
import { LatencyToggle } from "./LatencyToggle";

function renderToggle(isLatencyEnabled = false) {
  const { user } = renderWithProviders(<LatencyToggle />, { isLatencyEnabled });
  return { user, toggle: screen.getByRole("switch", { name: "Simulate network latency" }) };
}

describe("LatencyToggle", () => {
  it("starts off and says requests are instant", () => {
    const { toggle } = renderToggle();

    expect(toggle).not.toBeChecked();
    expect(toggle).toHaveAccessibleDescription("Requests resolve instantly.");
  });

  it("switches latency on and off, describing the simulated delay", async () => {
    const { user, toggle } = renderToggle();

    await user.click(toggle);
    expect(toggle).toBeChecked();
    expect(toggle).toHaveAccessibleDescription("Every request waits 0.6–1.8s. Cached quotes still return instantly.");

    await user.click(toggle);
    expect(toggle).not.toBeChecked();
  });

  it("reflects a provider that starts enabled", () => {
    const { toggle } = renderToggle(true);

    expect(toggle).toBeChecked();
  });
});
