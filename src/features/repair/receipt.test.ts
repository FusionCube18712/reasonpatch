import { describe, expect, it, vi } from "vitest";

import type { ModelGateway } from "@/lib/ai/model-gateway";
import { createReceiptService } from "./receipt";
import { validAnalyzeRequest } from "../../../test/fixtures";

const validReceipt = {
  activityId: "correlation-causation" as const,
  repairedHinge: "Association is not causation",
  summary: "The revision now qualifies the causal claim.",
  changes: [
    {
      label: "Causal claim",
      before: "The tutoring program caused the improvement",
      after: "difference alone does not establish causation",
    },
  ],
  rubric: [
    {
      id: "association-causation",
      label: "Distinguishes association from causation",
      before: "missing" as const,
      after: "met" as const,
      evidence: "does not establish causation",
    },
    {
      id: "confounder",
      label: "Names a plausible confounder or selection effect",
      before: "missing" as const,
      after: "met" as const,
      evidence: "self-selection",
    },
    {
      id: "additional-evidence",
      label: "States what additional evidence is needed",
      before: "missing" as const,
      after: "met" as const,
      evidence: "randomized comparison",
    },
  ],
  remainingCaveat: "A stronger comparison is still needed.",
  provenance: { model: "gpt-5.6-sol" as const, mode: "live" as const },
};

describe("receipt service", () => {
  it("uses Sol to compare the learner's own before and after evidence", async () => {
    const generate = vi.fn().mockResolvedValue({
      ...validReceipt,
      activityId: "sampling-bias",
      provenance: { model: "gpt-5.6-sol", mode: "demo" },
    });
    const gateway: ModelGateway = { generate };
    const service = createReceiptService(gateway);
    const revisedResponse =
      "Participants scored higher, but self-selection means the difference alone does not establish causation. A randomized comparison would be stronger.";

    await expect(
      service.revise({
        activityId: "correlation-causation",
        originalResponse: validAnalyzeRequest.response,
        revisedResponse,
        mode: "live",
      }),
    ).resolves.toEqual(validReceipt);

    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-5.6-sol",
        task: "receipt",
        input: expect.objectContaining({ revisedResponse }),
      }),
    );
  });

  it("rejects receipt evidence that is not present in the learner revision", async () => {
    const service = createReceiptService({
      generate: vi.fn().mockResolvedValue({
        ...validReceipt,
        rubric: validReceipt.rubric.map((criterion, index) =>
          index === 0
            ? { ...criterion, evidence: "an invented quotation" }
            : criterion,
        ),
      }),
    });

    await expect(
      service.revise({
        activityId: "correlation-causation",
        originalResponse: validAnalyzeRequest.response,
        revisedResponse:
          "Participants scored higher, but the difference alone does not establish causation without a controlled comparison.",
        mode: "live",
      }),
    ).rejects.toThrow();
  });

  it("rejects before and after excerpts that are absent from submitted text", async () => {
    const service = createReceiptService({
      generate: vi.fn().mockResolvedValue({
        ...validReceipt,
        changes: [
          {
            ...validReceipt.changes[0],
            after: "An invented replacement excerpt",
          },
        ],
      }),
    });

    await expect(
      service.revise({
        activityId: "correlation-causation",
        originalResponse: validAnalyzeRequest.response,
        revisedResponse:
          "Participants scored higher, but the difference alone does not establish causation without a controlled comparison.",
        mode: "live",
      }),
    ).rejects.toEqual(expect.objectContaining({ kind: "invalid_output" }));
  });

  it("rejects substituted rubric labels that were not visible to the learner", async () => {
    const service = createReceiptService({
      generate: vi.fn().mockResolvedValue({
        ...validReceipt,
        rubric: validReceipt.rubric.map((criterion, index) =>
          index === 0
            ? { ...criterion, label: "A different hidden scoring criterion" }
            : criterion,
        ),
      }),
    });

    await expect(
      service.revise({
        activityId: "correlation-causation",
        originalResponse: validAnalyzeRequest.response,
        revisedResponse:
          "Participants scored higher, but the difference alone does not establish causation without a controlled comparison.",
        mode: "live",
      }),
    ).rejects.toEqual(expect.objectContaining({ kind: "invalid_output" }));
  });

  it("rejects invalid model receipts instead of presenting them", async () => {
    const service = createReceiptService({
      generate: vi.fn().mockResolvedValue({ ...validReceipt, summary: "You mastered it." }),
    });

    await expect(
      service.revise({
        activityId: "correlation-causation",
        originalResponse: validAnalyzeRequest.response,
        revisedResponse:
          "Participants scored higher, but the observed difference alone does not establish causation without a controlled comparison.",
        mode: "live",
      }),
    ).rejects.toThrow();
  });
});
