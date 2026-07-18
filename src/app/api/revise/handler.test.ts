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
  it("returns a safe error for malformed JSON", async () => {
    const revise = vi.fn();
    const handler = createReviseHandler({ revise });

    const response = await handler(
      new Request("http://localhost/api/revise", {
        method: "POST",
        body: "{not-json",
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "INVALID_JSON" },
    });
    expect(revise).not.toHaveBeenCalled();
  });

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
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(response.status).toBe(400);
    expect(revise).not.toHaveBeenCalled();
  });

  it("rejects a mode header that disagrees with validated input", async () => {
    const revise = vi.fn();
    const handler = createReviseHandler({ revise });

    const response = await handler(
      new Request("http://localhost/api/revise", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: {
          "Content-Type": "application/json",
          "X-ReasonPatch-Mode": "live",
        },
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
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: receipt,
      error: null,
    });
  });

  it("does not leak receipt model failures", async () => {
    const handler = createReviseHandler({
      revise: vi.fn().mockRejectedValue(new Error("private upstream response")),
    });

    const response = await handler(
      new Request("http://localhost/api/revise", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: { "Content-Type": "application/json" },
      }),
    );

    expect(response.status).toBe(503);
    const payload = JSON.stringify(await response.json());
    expect(payload).toContain("UNAVAILABLE");
    expect(payload).not.toContain("private upstream");
  });
});
