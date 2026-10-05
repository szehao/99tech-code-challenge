import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";
import { resetMockServer } from "../api/mockServer/mockServer";
import { jsonResponse, PRICE_FEED_FIXTURE } from "./fixtures";

// Never hit the real price feed from tests; individual tests can override this.
beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => jsonResponse(PRICE_FEED_FIXTURE)),
  );
});

afterEach(() => {
  cleanup();
  resetMockServer();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
