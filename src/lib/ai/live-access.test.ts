import { describe, expect, it } from "vitest";

import { assertLiveModeEnabled } from "./live-access";

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
});
