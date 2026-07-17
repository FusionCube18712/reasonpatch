import { describe, expect, it, vi } from "vitest";

import { createReviseHandler } from "./handler";
import { validAnalyzeRequest } from "../../../../test/fixtures";

const requestBody = {
  activityId: "correlation-causation",
  originalResponse: validAnalyzeRequest.response,
  revisedResponse:
    "Participants averaged eight points higher, but because students chose tutoring, the difference alone does not establish causation. Comparable baselines or random assignment would provide stronger evidence.",
  mode: "demo" as const,
};

describe("revise API handler", () => {
  it("rejects a non-revision before invoking the model", async () => {
    const revise = vi.fn();
    const handler = createReviseHandler({ revise });

    const response = await handler(
      new Request("http://localhost/api/revise", {
        method: "POST",
        body: JSON.stringify({
          ...requestBody,
          revisedResponse: requestBody.originalResponse,
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(revise).not.toHaveBeenCalled();
  });

  it("returns the receipt through the standard success envelope", async () => {
    const receipt = {
      activityId: "correlation-causation" as const,
      repairedHinge: "Association is not causation",
      summary: "The revision now qualifies the causal claim and requests stronger evidence.",
      changes: [
        {
          label: "Causal claim",
          before: "The tutoring program caused the improvement.",
          after: "The difference alone does not establish causation.",
        },
      ],
      rubric: [
        {
          id: "association-causation",
          label: "Distinguishes association from causation",
          before: "missing" as const,
          after: "met" as const,
          evidence: "the difference alone does not establish causation",
        },
      ],
      remainingCaveat: "A stronger study design is still needed.",
      provenance: { model: "gpt-5.6-sol" as const, mode: "demo" as const },
    };
    const handler = createReviseHandler({ revise: vi.fn().mockResolvedValue(receipt) });

    const response = await handler(
      new Request("http://localhost/api/revise", {
        method: "POST",
        body: JSON.stringify(requestBody),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: receipt,
      error: null,
    });
  });
});

