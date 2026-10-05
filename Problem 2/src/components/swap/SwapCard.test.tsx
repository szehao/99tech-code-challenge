import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { submitSwap } from "../../api/mockServer/mockServer";
import { fixtureToken, jsonResponse } from "../../test-utils/fixtures";
import { renderWithProviders } from "../../test-utils/testUtils";
import { SwapCard } from "./SwapCard";

/** Makes fetchQuote fail while set, leaving the rest of the mock server real. */
const quoteFailure = vi.hoisted(() => ({ isFailing: false }));
vi.mock("../../api/mockServer/mockServer", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../api/mockServer/mockServer")>();
  return {
    ...actual,
    fetchQuote: (...args: Parameters<typeof actual.fetchQuote>) =>
      quoteFailure.isFailing ? Promise.reject(new Error("quote service down")) : actual.fetchQuote(...args),
  };
});

const renderCard = () => renderWithProviders(<SwapCard />);

const QUOTE_TIMEOUT = { timeout: 2000 };

describe("SwapCard", () => {
  it("shows the 99tech title and the live feed tokens", async () => {
    const { user } = renderCard();
    expect(await screen.findByRole("heading", { name: "99tech" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Select token to pay with/ }));
    expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual(
      expect.arrayContaining([expect.stringContaining("wstETH")]),
    );
    expect(screen.getByRole("option", { name: /ETH\s*\$1,645\.933737/ })).toBeInTheDocument();
  });

  it("always shows the rate and a zero output before any amount is entered", async () => {
    renderCard();
    const details = (await screen.findByText("Rate")).closest("dl")!;

    expect(within(details).getByText(/1 ETH = 1646\.13 USDC/)).toBeInTheDocument();
    expect(within(details).getByText("0 USDC")).toBeInTheDocument();
  });

  it("returns the details to zero when the input is cleared or zero", async () => {
    const { user } = renderCard();
    const payInput = await screen.findByLabelText("Amount to send");
    await user.type(payInput, "1");
    await screen.findByText("1646.13 USDC", undefined, QUOTE_TIMEOUT);

    await user.clear(payInput);
    expect(screen.getByText("0 USDC")).toBeInTheDocument();
    expect(screen.getByText(/1 ETH = 1646\.13 USDC/)).toBeInTheDocument();

    await user.type(payInput, "0");
    expect(screen.getByText("0 USDC")).toBeInTheDocument();
  });

  it("updates the zero-state rate when the pair changes", async () => {
    const { user } = renderCard();
    await user.click(await screen.findByRole("button", { name: "Swap input and output tokens" }));
    expect(screen.getByText(/1 USDC = 0\.000607484 ETH/)).toBeInTheDocument();
    expect(screen.getByText("0 ETH")).toBeInTheDocument();
  });

  it("does not show a fee", async () => {
    const { user } = renderCard();
    await user.type(await screen.findByLabelText("Amount to send"), "1");
    await screen.findByTitle("Invert rate", undefined, QUOTE_TIMEOUT);
    expect(screen.queryByText(/fee/i)).not.toBeInTheDocument();
  });

  it("offers a retry when the price feed fails", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({}, 500));
    const { user } = renderCard();
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not load token prices.");

    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(await screen.findByRole("heading", { name: "99tech" })).toBeInTheDocument();
  });

  it("quotes the output amount for a typed input", async () => {
    const { user } = renderCard();
    await user.type(await screen.findByLabelText("Amount to send"), "1");

    await waitFor(() => expect(screen.getByLabelText("Amount to receive")).toHaveValue("1646.13"), QUOTE_TIMEOUT);
    expect(screen.getByText(/1 ETH = 1646\.13 USDC/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Swap ETH for USDC" })).toBeEnabled();
  });

  it("inverts the displayed rate on click", async () => {
    const { user } = renderCard();
    await user.type(await screen.findByLabelText("Amount to send"), "1");
    const rate = await screen.findByTitle("Invert rate", undefined, QUOTE_TIMEOUT);

    await user.click(rate);
    expect(rate).toHaveTextContent(/1 USDC = 0\.000607484 ETH/);
  });

  it("blocks swaps above the wallet balance", async () => {
    const { user } = renderCard();
    await user.type(await screen.findByLabelText("Amount to send"), "100");
    expect(await screen.findByRole("button", { name: "Insufficient ETH balance" })).toBeDisabled();
  });

  it("selects tokens from the dropdown with search and keyboard", async () => {
    const { user } = renderCard();
    await user.click(await screen.findByRole("button", { name: /Select token to receive/ }));
    await user.type(screen.getByRole("combobox", { name: "Search tokens" }), "wbt");

    expect(within(screen.getByRole("listbox")).getAllByRole("option")).toHaveLength(1);
    await user.keyboard("{ArrowDown}{ArrowUp}{Enter}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Select token to receive, WBTC selected/ })).toHaveFocus();
  });

  it("selects a token by clicking an option", async () => {
    const { user } = renderCard();
    await user.click(await screen.findByRole("button", { name: /Select token to pay with/ }));
    await user.click(screen.getByRole("option", { name: /ATOM/ }));
    expect(screen.getByRole("button", { name: /Select token to pay with, ATOM selected/ })).toBeInTheDocument();
  });

  it("closes the dropdown on Escape and on outside click", async () => {
    const { user } = renderCard();
    const trigger = await screen.findByRole("button", { name: /Select token to pay with/ });
    await user.click(trigger);
    await user.type(screen.getByRole("combobox"), "zzz");
    expect(screen.getByText(/No tokens match/)).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();

    await user.click(trigger);
    await user.click(document.body);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("flips the pair with the flip button", async () => {
    const { user } = renderCard();
    await user.click(await screen.findByRole("button", { name: "Swap input and output tokens" }));
    expect(screen.getByRole("button", { name: /Select token to pay with, USDC selected/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Select token to receive, ETH selected/ })).toBeInTheDocument();
  });

  it("fills the max balance and executes a swap", async () => {
    const { user } = renderCard();
    await user.click(await screen.findByRole("button", { name: "Max" }));
    expect(screen.getByLabelText("Amount to send")).toHaveValue("4.218304771");

    await user.click(await screen.findByRole("button", { name: "Swap ETH for USDC" }, QUOTE_TIMEOUT));

    const toast = (await screen.findByText("Swap successful")).closest('[role="status"]');
    expect(toast).toHaveTextContent("Swap successful");
    expect(toast).toHaveTextContent("4.2183 ETH → 6943.89 USDC");
    expect(screen.getByLabelText("Amount to send")).toHaveValue("");
    await waitFor(() => expect(screen.queryByRole("button", { name: "Max" })).not.toBeInTheDocument());
  });

  it("shows a success toast with a View TX link that opens an empty tab, dismissible by its cross", async () => {
    const { user } = renderCard();
    await user.type(await screen.findByLabelText("Amount to send"), "1");
    await user.click(await screen.findByRole("button", { name: "Swap ETH for USDC" }, QUOTE_TIMEOUT));

    const link = await screen.findByRole("link", { name: "View TX" });
    expect(link).toHaveAttribute("href", "about:blank");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");

    await user.click(screen.getByRole("button", { name: "Dismiss notification" }));
    expect(screen.queryByText("Swap successful")).not.toBeInTheDocument();
  });

  it("offers a retry when a quote fails, and quotes again on retry", async () => {
    quoteFailure.isFailing = true;
    try {
      const { user } = renderCard();
      await user.type(await screen.findByLabelText("Amount to send"), "1");
      const retryButton = await screen.findByRole("button", { name: "Quote failed — retry" }, QUOTE_TIMEOUT);
      expect(retryButton).toBeEnabled();

      quoteFailure.isFailing = false;
      await user.click(retryButton);

      expect(await screen.findByRole("button", { name: "Swap ETH for USDC" }, QUOTE_TIMEOUT)).toBeInTheDocument();
      expect(screen.getByLabelText("Amount to receive")).toHaveValue("1646.13");
    } finally {
      quoteFailure.isFailing = false;
    }
  });
});

describe("SwapCard amount input and swap errors", () => {
  it("strips thousands separators from typed and pasted amounts", async () => {
    const { user } = renderCard();
    const payInput = await screen.findByLabelText("Amount to send");

    await user.type(payInput, "1,000");
    expect(payInput).toHaveValue("1000");

    await user.clear(payInput);
    await user.click(payInput);
    await user.paste("12,500.42");
    expect(payInput).toHaveValue("12500.42");
  });

  it("rejects non-numeric pasted text", async () => {
    const { user } = renderCard();
    const payInput = await screen.findByLabelText("Amount to send");
    await user.type(payInput, "5");
    await user.paste("abc");
    expect(payInput).toHaveValue("5");
  });

  it("replaces the selected text with the pasted amount", async () => {
    const { user } = renderCard();
    const payInput = (await screen.findByLabelText("Amount to send")) as HTMLInputElement;
    await user.type(payInput, "999");
    payInput.setSelectionRange(0, 3);
    await user.paste("1,250");
    expect(payInput).toHaveValue("1250");
  });

  it("ignores pastes into the read-only output field", async () => {
    const { user } = renderCard();
    const receiveInput = await screen.findByLabelText("Amount to receive");
    await user.click(receiveInput);
    await user.paste("1,000");
    expect(receiveInput).toHaveValue("");
  });

  it("shows a server-side swap failure, keeps the form, and clears the error once the pair changes", async () => {
    const { user } = renderCard();
    const payInput = await screen.findByLabelText("Amount to send");
    await user.type(payInput, "1");
    const swapButton = await screen.findByRole("button", { name: "Swap ETH for USDC" }, QUOTE_TIMEOUT);

    // Drain the wallet behind the UI's back, so its cached balance is stale and the server rejects.
    await submitSwap(fixtureToken("ETH"), fixtureToken("USDC"), 4_218_304_771_000_000_000n, null);
    await user.click(swapButton);

    expect(await screen.findByRole("alert")).toHaveTextContent("Insufficient ETH balance");
    expect(payInput).toHaveValue("1"); // not reset on failure
    expect(screen.queryByText("Swap successful")).not.toBeInTheDocument();

    // The rejection means cached balances were stale: they are refreshed (ETH is now 0, so no Max).
    await waitFor(() => expect(screen.queryByRole("button", { name: "Max" })).not.toBeInTheDocument());

    // Re-picking the token already selected changes nothing, so the error stays.
    await user.click(screen.getByRole("button", { name: /Select token to pay with/ }));
    await user.click(screen.getByRole("option", { name: /^ETH/ }));
    expect(screen.getByRole("alert")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Swap input and output tokens" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("keeps the error while a rejected keystroke leaves the amount unchanged", async () => {
    const { user } = renderCard();
    const payInput = await screen.findByLabelText("Amount to send");
    await user.type(payInput, "1");
    const swapButton = await screen.findByRole("button", { name: "Swap ETH for USDC" }, QUOTE_TIMEOUT);
    await submitSwap(fixtureToken("ETH"), fixtureToken("USDC"), 4_218_304_771_000_000_000n, null);
    await user.click(swapButton);
    await screen.findByRole("alert");

    await user.type(payInput, "x"); // rejected: the form did not change
    expect(screen.getByRole("alert")).toBeInTheDocument();
    await user.type(payInput, "5"); // accepted: the old error no longer applies
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
