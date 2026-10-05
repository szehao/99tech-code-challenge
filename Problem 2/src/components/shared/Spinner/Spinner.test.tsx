import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Spinner } from "./Spinner";

describe("Spinner", () => {
  it("is hidden from screen readers, since the text beside it already says what is loading", () => {
    render(<Spinner />);

    expect(screen.getByTestId("spinner")).toHaveAttribute("aria-hidden", "true");
  });
});
