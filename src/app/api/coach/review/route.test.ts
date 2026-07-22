import { beforeEach, describe, expect, it, vi } from "vitest";

import { getScenario } from "@/features/coach/scenarios";

const service = vi.hoisted(() => ({
  reviewGuidedRevision: vi.fn(),
  reviewCustomRevision: vi.fn(),
  createGateway: vi.fn(() => ({ generate: vi.fn() })),
}));

vi.mock("@/features/coach/review-service", () => ({
  reviewGuidedRevision: service.reviewGuidedRevision,
  reviewCustomRevision: service.reviewCustomRevision,
}));

vi.mock("@/lib/ai/openai-gateway", () => ({
  createOpenAIModelGatewayFromEnvironment: service.createGateway,
}));

import { POST } from "./route";

const scenario = getScenario("algebra-square-branches");
const guidedRequest = {
  source: {
    kind: "guided" as const,
    scenarioId: scenario.id,
    attempt: scenario.attempt,
  },
  revision:
    "x² - 9 = 0, so (x - 3)(x + 3) = 0 and x = 3 or x = -3.",
  mode: "demo" as const,
};

const liveRequest = {
  source: {
    kind: "custom" as const,
    domain: "algebra" as const,
    assignment: "Solve x squared equals nine over the real numbers.",
    attempt: "x squared equals nine, therefore x equals three.",
    constraints: "Show every real branch.",
  },
  diagnosis: {
    hingeQuote: "x equals three",
    issueTitle: "The negative square-root branch is missing",
    criteria: [
      { id: "positive-branch", label: "Includes the positive branch" },
      { id: "negative-branch", label: "Includes the negative branch" },
    ],
  },
  revision:
    "x squared equals nine, so x equals three or x equals negative three.",
  mode: "live" as const,
};

const requestFor = (body: unknown, mode: "demo" | "live") =>
  new Request("https://reasonpatch.local/api/coach/review", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://reasonpatch.local",
      "Sec-Fetch-Site": "same-origin",
      "X-ReasonPatch-Mode": mode,
    },
    body: JSON.stringify(body),
  });

describe("POST /api/coach/review route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("REASONPATCH_LIVE_MODE", "true");
  });

  it("keeps guided review credential-free", async () => {
    service.reviewGuidedRevision.mockReturnValue({ status: "needs-work" });

    const response = await POST(requestFor(guidedRequest, "demo"));

    expect(response.status).toBe(200);
    expect(service.reviewGuidedRevision).toHaveBeenCalledWith(guidedRequest);
    expect(service.createGateway).not.toHaveBeenCalled();
    expect(service.reviewCustomRevision).not.toHaveBeenCalled();
  });

  it("creates a server-side gateway only for validated live review", async () => {
    service.reviewCustomRevision.mockResolvedValue({
      status: "evidence-observed",
    });

    const response = await POST(requestFor(liveRequest, "live"));

    expect(response.status).toBe(200);
    expect(service.createGateway).toHaveBeenCalledTimes(1);
    expect(service.reviewCustomRevision).toHaveBeenCalledWith({
      gateway: service.createGateway.mock.results[0]?.value,
      request: liveRequest,
    });
  });
});
