import { screen } from "@testing-library/react";
import axe from "axe-core";
import { describe, expect, it, vi } from "vitest";
import App from "./App";
import { renderWithProviders } from "./test-utils/testUtils";

// Swap-card behaviour is covered in components/swap/SwapCard.test.tsx; this file tests the page.
const renderApp = () => renderWithProviders(<App />);

const QUOTE_TIMEOUT = { timeout: 2000 };
const SLOW_TIMEOUT = { timeout: 4000 };

describe("Swap app", () => {
  it("renders the swap card and the latency toggle", async () => {
    renderApp();
    expect(await screen.findByRole("heading", { name: "99tech" })).toBeInTheDocument();
    expect(screen.getByRole("switch", { name: "Simulate network latency" })).toBeInTheDocument();
  });

  it("toggles simulated network latency and shows the slow network state", async () => {
    const { user } = renderApp();
    await screen.findByText("Demo");
    const toggle = screen.getByRole("switch", { name: "Simulate network latency" });
    expect(toggle).toHaveAttribute("aria-checked", "false");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-checked", "true");
    expect(screen.getByText(/Every request waits/)).toBeInTheDocument();
    expect(screen.getByText("Slow network")).toBeInTheDocument();
    expect(screen.queryByText("Demo")).not.toBeInTheDocument();
  });

  it("locks the form while a slow swap is in flight and updates the balance as soon as it lands", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0); // every simulated request takes the minimum latency
    const { user } = renderApp();
    const payInput = await screen.findByLabelText("Amount to send");
    await user.click(screen.getByRole("switch", { name: "Simulate network latency" }));

    await user.type(payInput, "1");
    await user.click(await screen.findByRole("button", { name: "Swap ETH for USDC" }, SLOW_TIMEOUT));

    expect(await screen.findByRole("button", { name: "Swapping…" })).toBeDisabled();
    expect(payInput).toBeDisabled();
    expect(screen.getByRole("button", { name: "Swap input and output tokens" })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Select token to pay with/ })).toBeDisabled();

    expect(await screen.findByText("Swap successful", undefined, SLOW_TIMEOUT)).toBeInTheDocument();
    // Written from the swap receipt, not a delayed refetch: correct the moment the toast appears.
    expect(screen.getByText("3.218304")).toBeInTheDocument();
    expect(payInput).toBeEnabled();
  });
});

describe("accessibility (axe)", () => {
  // jsdom cannot compute colour contrast, so that one rule is off here.
  const AXE_OPTIONS = { rules: { "color-contrast": { enabled: false } } };

  async function expectNoViolations() {
    const results = await axe.run(document.body, AXE_OPTIONS);
    expect(results.violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
  }

  it("has no violations on the idle swap card", async () => {
    renderApp();
    await screen.findByLabelText("Amount to send");
    await expectNoViolations();
  });

  it("has no violations with the token dropdown open", async () => {
    const { user } = renderApp();
    await user.click(await screen.findByRole("button", { name: /Select token to pay with/ }));
    await expectNoViolations();
  });

  it("has no violations while the success toast is shown", async () => {
    const { user } = renderApp();
    await user.type(await screen.findByLabelText("Amount to send"), "1");
    await user.click(await screen.findByRole("button", { name: "Swap ETH for USDC" }, QUOTE_TIMEOUT));
    await screen.findByText("Swap successful");
    await expectNoViolations();
  });
});
