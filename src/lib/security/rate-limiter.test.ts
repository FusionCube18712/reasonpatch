import { describe, expect, it } from "vitest";

import {
  createSlidingWindowLimiter,
  withRateLimit,
  withRateLimitWhen,
} from "./rate-limiter";

describe("API rate limiting", () => {
  it.each([
    { limit: 0, windowMs: 1_000 },
    { limit: 1.5, windowMs: 1_000 },
    { limit: 1, windowMs: 0 },
    { limit: 1, windowMs: Number.POSITIVE_INFINITY },
  ])("rejects invalid limiter configuration", (options) => {
    expect(() => createSlidingWindowLimiter(options)).toThrow(
      "Rate-limit options must be positive integers.",
    );
  });

  it("bounds the number of retained identity buckets", () => {
    const limiter = createSlidingWindowLimiter({
      limit: 1,
      windowMs: 60_000,
      maxBuckets: 2,
      now: () => 10,
    });

    expect(limiter.allow("learner-a")).toBe(true);
    expect(limiter.allow("learner-b")).toBe(true);
    expect(limiter.allow("learner-c")).toBe(true);
    expect(limiter.allow("learner-a")).toBe(true);
  });

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

  it("keeps inexpensive guided requests outside the paid live-mode budget", async () => {
    const limiter = createSlidingWindowLimiter({
      limit: 1,
      windowMs: 60_000,
      now: () => 10,
    });
    const guarded = withRateLimitWhen(
      async () => Response.json({ success: true }),
      {
        limiter,
        keyFor: () => "shared-school-network",
        shouldLimit: async (request) =>
          ((await request.clone().json()) as { mode?: string }).mode === "live",
      },
    );
    const guided = new Request("http://localhost/api/analyze", {
      method: "POST",
      body: JSON.stringify({ mode: "demo" }),
    });
    const live = new Request("http://localhost/api/analyze", {
      method: "POST",
      body: JSON.stringify({ mode: "live" }),
    });

    expect((await guarded(guided.clone())).status).toBe(200);
    expect((await guarded(guided.clone())).status).toBe(200);
    expect((await guarded(live.clone())).status).toBe(200);
    expect((await guarded(live.clone())).status).toBe(429);
  });

  it.each([
    [{ "x-forwarded-for": "203.0.113.10, 10.0.0.1" }, "forwarded"],
    [{ "x-real-ip": "203.0.113.11" }, "real"],
    [{}, "anonymous"],
  ])(
    "derives a privacy-preserving default key for %s requests",
    async (headers, label) => {
      expect(label).toBeTruthy();
      const limiter = createSlidingWindowLimiter({ limit: 1, windowMs: 60_000 });
      const guarded = withRateLimit(
        async () => Response.json({ success: true }),
        { limiter },
      );
      const request = new Request("http://localhost/api/analyze", { headers });

      expect((await guarded(request.clone())).status).toBe(200);
      expect((await guarded(request.clone())).status).toBe(429);
    },
  );
});
