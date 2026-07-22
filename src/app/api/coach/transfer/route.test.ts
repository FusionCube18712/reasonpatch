import { beforeEach, describe, expect, it, vi } from "vitest";

const evaluator = vi.hoisted(() => ({
  evaluateScenarioTransfer: vi.fn(),
}));

vi.mock("@/features/coach/scenario-evaluator", () => ({
  evaluateScenarioTransfer: evaluator.evaluateScenarioTransfer,
}));

import { POST } from "./route";

const requestBody = {
  scenarioId: "algebra-square-branches" as const,
  response:
    "For y² = 16, y = 4 or y = -4; both branches matter by factoring with the zero-product property.",
  mode: "demo" as const,
};

const request = (body: unknown) =>
  new Request("https://reasonpatch.local/api/coach/transfer", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://reasonpatch.local",
      "Sec-Fetch-Site": "same-origin",
      "X-ReasonPatch-Mode": "demo",
    },
    body: JSON.stringify(body),
  });

describe("POST /api/coach/transfer route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("evaluates only fresh-context scalar inputs", async () => {
    evaluator.evaluateScenarioTransfer.mockReturnValue({
      status: "evidence-observed",
    });

    const response = await POST(request(requestBody));

    expect(response.status).toBe(200);
    expect(evaluator.evaluateScenarioTransfer).toHaveBeenCalledWith(
      requestBody.scenarioId,
      requestBody.response,
    );
  });

  it("does not invoke the evaluator when prior coaching context is supplied", async () => {
    const response = await POST(
      request({
        ...requestBody,
        diagnosis: { hingeQuote: "prior hinge" },
        revision: "prior coached revision",
      }),
    );

    expect(response.status).toBe(400);
    expect(evaluator.evaluateScenarioTransfer).not.toHaveBeenCalled();
  });
});
