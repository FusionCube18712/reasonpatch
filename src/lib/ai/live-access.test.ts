import { describe, expect, it } from "vitest";

import {
  assertLiveModeEnabled,
  hasMatchingDeclaredMode,
  isLiveModeRequest,
} from "./live-access";

describe("live model access policy", () => {
  it("is disabled by default", () => {
    expect(() => assertLiveModeEnabled({})).toThrow("Live GPT mode is disabled");
  });

  it("requires an explicit server-side enable flag", () => {
    expect(() =>
      assertLiveModeEnabled({ REASONPATCH_LIVE_MODE: "false" }),
    ).toThrow();
    expect(() =>
      assertLiveModeEnabled({ REASONPATCH_LIVE_MODE: "true" }),
    ).not.toThrow();
  });

  it("classifies paid-mode limits from headers without parsing the body", () => {
    const request = (mode?: string) =>
      new Request("http://localhost/api/analyze", {
        method: "POST",
        body: "{intentionally-not-json",
        headers: mode ? { "X-ReasonPatch-Mode": mode } : undefined,
      });

    expect(isLiveModeRequest(request("live"))).toBe(true);
    expect(isLiveModeRequest(request("demo"))).toBe(false);
    expect(isLiveModeRequest(request())).toBe(true);
    expect(isLiveModeRequest(request("unexpected"))).toBe(true);
  });

  it("rejects a client mode declaration that disagrees with validated JSON", () => {
    const request = (mode?: string) =>
      new Request("http://localhost/api/analyze", {
        headers: mode ? { "X-ReasonPatch-Mode": mode } : undefined,
      });

    expect(hasMatchingDeclaredMode(request("demo"), "demo")).toBe(true);
    expect(hasMatchingDeclaredMode(request("live"), "live")).toBe(true);
    expect(hasMatchingDeclaredMode(request(), "live")).toBe(true);
    expect(hasMatchingDeclaredMode(request("demo"), "live")).toBe(false);
    expect(hasMatchingDeclaredMode(request("live"), "demo")).toBe(false);
  });
});
