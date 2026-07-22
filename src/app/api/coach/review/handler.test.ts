import { describe, expect, it, vi } from "vitest";

import { getScenario } from "@/features/coach/scenarios";
import { createCoachReviewHandler } from "./handler";

const scenario = getScenario("python-empty-aggregate");

const guidedRequest = {
  source: {
    kind: "guided" as const,
    scenarioId: scenario.id,
    attempt: scenario.attempt,
  },
  revision: `def average(nums):
    if not nums:
        raise ValueError("average requires at least one value")
    return sum(nums) / len(nums)`,
  mode: "demo" as const,
};

const customRequest = {
  source: {
    kind: "custom" as const,
    domain: "python" as const,
    assignment:
      "Review this Python function for correctness on every list input.",
    attempt: "def average(nums):\n    return sum(nums) / len(nums)",
    constraints: "Choose an explicit empty-input policy.",
  },
  diagnosis: {
    hingeQuote: "return sum(nums) / len(nums)",
    issueTitle: "Empty input reaches division by zero",
    criteria: [
      { id: "empty-input-policy", label: "Defines behavior for empty input" },
      {
        id: "preserved-calculation",
        label: "Preserves the non-empty calculation",
      },
    ],
  },
  revision: `def average(nums):
    if not nums:
        raise ValueError("average requires at least one value")
    return sum(nums) / len(nums)`,
  mode: "live" as const,
};

const requestFor = (
  body: unknown,
  declaredMode: "demo" | "live" | null,
  overrides: HeadersInit = {},
) => {
  const headers = new Headers({
    "Content-Type": "application/json",
    Origin: "https://reasonpatch.local",
    "Sec-Fetch-Site": "same-origin",
    ...overrides,
  });
  if (declaredMode !== null) {
    headers.set("X-ReasonPatch-Mode", declaredMode);
  }
  return new Request("https://reasonpatch.local/api/coach/review", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
};

const resultFor = (kind: "guided" | "custom") => ({
  status: "evidence-observed",
  summary: "The revision contains evidence for the visible criteria.",
  source: { kind },
  provenance: {
    mode: kind === "guided" ? "demo" : "live",
    source: kind === "guided" ? "deterministic-verifier" : "gpt-5.6-sol",
  },
});

describe("POST /api/coach/review handler", () => {
  it("routes an exact guided revision only to the deterministic reviewer", async () => {
    const reviewGuided = vi.fn(() => resultFor("guided"));
    const reviewLive = vi.fn(async () => resultFor("custom"));
    const handler = createCoachReviewHandler({ reviewGuided, reviewLive });

    const response = await handler(requestFor(guidedRequest, "demo"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: resultFor("guided"),
      error: null,
    });
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(reviewGuided).toHaveBeenCalledWith(guidedRequest);
    expect(reviewLive).not.toHaveBeenCalled();
  });

  it("routes custom work only to the live reviewer", async () => {
    const reviewGuided = vi.fn(() => resultFor("guided"));
    const reviewLive = vi.fn(async () => resultFor("custom"));
    const handler = createCoachReviewHandler({ reviewGuided, reviewLive });

    const response = await handler(requestFor(customRequest, "live"));

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(reviewLive).toHaveBeenCalledWith(customRequest);
    expect(reviewGuided).not.toHaveBeenCalled();
  });

  it.each([
    ["a missing mode header", guidedRequest, null],
    ["a mismatched mode header", customRequest, "demo"],
    ["an unknown request field", { ...guidedRequest, debug: true }, "demo"],
    [
      "an edited guided starting attempt",
      {
        ...guidedRequest,
        source: {
          ...guidedRequest.source,
          attempt: `${guidedRequest.source.attempt}\n# edited`,
        },
      },
      "demo",
    ],
  ] as const)("rejects %s before review", async (_label, body, mode) => {
    const reviewGuided = vi.fn(() => resultFor("guided"));
    const reviewLive = vi.fn(async () => resultFor("custom"));
    const handler = createCoachReviewHandler({ reviewGuided, reviewLive });

    const response = await handler(requestFor(body, mode));

    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(reviewGuided).not.toHaveBeenCalled();
    expect(reviewLive).not.toHaveBeenCalled();
  });

  it.each([
    [
      "cross-site JSON",
      {
        Origin: "https://attacker.example",
        "Sec-Fetch-Site": "cross-site",
      },
      403,
    ],
    ["a non-JSON body", { "Content-Type": "text/plain" }, 415],
  ] as const)("rejects %s at the request boundary", async (_label, headers, status) => {
    const reviewGuided = vi.fn(() => resultFor("guided"));
    const reviewLive = vi.fn(async () => resultFor("custom"));
    const handler = createCoachReviewHandler({ reviewGuided, reviewLive });

    const response = await handler(requestFor(guidedRequest, "demo", headers));

    expect(response.status).toBe(status);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(reviewGuided).not.toHaveBeenCalled();
    expect(reviewLive).not.toHaveBeenCalled();
  });

  it("returns a generic no-store error without leaking provider details", async () => {
    const handler = createCoachReviewHandler({
      reviewGuided: vi.fn(() => {
        throw new Error("sk-secret UPSTREAM_REVIEW_SENTINEL");
      }),
      reviewLive: vi.fn(async () => resultFor("custom")),
    });

    const response = await handler(requestFor(guidedRequest, "demo"));
    const serialized = JSON.stringify(await response.json());

    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(serialized).toContain("Your revision was not lost");
    expect(serialized).not.toMatch(/sk-secret|UPSTREAM_REVIEW_SENTINEL/iu);
  });
});
