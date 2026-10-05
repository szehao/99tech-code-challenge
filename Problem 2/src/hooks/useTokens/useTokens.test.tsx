import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FIXTURE_TOKENS, jsonResponse } from "../../test-utils/fixtures";
import { createWrapper } from "../../test-utils/testUtils";
import { useTokens } from "./useTokens";

describe("useTokens", () => {
  it("loads the token list from the price feed", async () => {
    const { result } = renderHook(() => useTokens(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.data).toEqual(FIXTURE_TOKENS));
    expect(result.current.error).toBeUndefined();
  });

  it("fetches once per session: a later consumer reuses the cached list", async () => {
    const wrapper = createWrapper();
    const first = renderHook(() => useTokens(), { wrapper });
    await waitFor(() => expect(first.result.current.data).toBeDefined());

    const second = renderHook(() => useTokens(), { wrapper });

    expect(second.result.current.data).toEqual(FIXTURE_TOKENS);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("exposes a feed failure as an error", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(jsonResponse({}, 503));
    const { result } = renderHook(() => useTokens(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
    expect(result.current.data).toBeUndefined();
  });
});
