import { describe, expect, it } from "vitest";

import { createSlidingWindowLimiter, withRateLimit } from "./rate-limiter";

describe("API rate limiting", () => {
  it("returns new window state without mutating prior timestamps", () => {
    let now = 1_000;
    const limiter = createSlidingWindowLimiter({ limit: 2, windowMs: 1_000, now: () => now });

    expect(limiter.allow("learner-a")).toBe(true);
    expect(limiter.allow("learner-a")).toBe(true);
    expect(limiter.allow("learner-a")).toBe(false);

    now = 2_001;
    expect(limiter.allow("learner-a")).toBe(true);
  });

  it("keeps independent request keys isolated", () => {
    const limiter = createSlidingWindowLimiter({ limit: 1, windowMs: 60_000, now: () => 10 });

    expect(limiter.allow("learner-a")).toBe(true);
    expect(limiter.allow("learner-b")).toBe(true);
    expect(limiter.allow("learner-a")).toBe(false);
  });

  it("returns a safe 429 envelope before the endpoint is invoked", async () => {
    const limiter = createSlidingWindowLimiter({ limit: 1, windowMs: 60_000, now: () => 10 });
    const guarded = withRateLimit(
      async () => Response.json({ success: true, data: "ok", error: null }),
      { limiter, keyFor: () => "same-key" },
    );
    const request = new Request("http://localhost/api/analyze", { method: "POST" });

    expect((await guarded(request.clone())).status).toBe(200);
    const blocked = await guarded(request.clone());

    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toBe("60");
    await expect(blocked.json()).resolves.toEqual({
      success: false,
      data: null,
      error: {
        code: "RATE_LIMITED",
        message: "Too many repair requests. Wait a moment, then try again.",
      },
    });
  });
});
