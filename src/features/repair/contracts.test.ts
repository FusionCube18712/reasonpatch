import { describe, expect, it } from "vitest";

import {
  AnalyzeRequestSchema,
  AnalysisPlanSchema,
  ProbeOutputSchema,
  ReceiptSchema,
  ReviseRequestSchema,
  TransferRequestSchema,
  TransferSlipSchema,
} from "./contracts";
import { probeFor, validAnalyzeRequest, validPlan } from "../../../test/fixtures";

describe("repair contracts", () => {
  it("accepts the bounded live analysis request", () => {
    expect(AnalyzeRequestSchema.parse(validAnalyzeRequest)).toEqual(validAnalyzeRequest);
  });

  it("forbids client-forced Sol execution in live mode", () => {
    expect(() =>
      AnalyzeRequestSchema.parse({ ...validAnalyzeRequest, forceLunaFallback: true }),
    ).toThrow();
  });

  it("rejects extra request fields and oversized learner text", () => {
    expect(() =>
      AnalyzeRequestSchema.parse({ ...validAnalyzeRequest, injected: true }),
    ).toThrow();
    expect(() =>
      AnalyzeRequestSchema.parse({
        ...validAnalyzeRequest,
        response: "x".repeat(3_001),
      }),
    ).toThrow();
  });

  it("requires one role-separated job for every probe role", () => {
    expect(AnalysisPlanSchema.parse(validPlan)).toEqual(validPlan);
    expect(() =>
      AnalysisPlanSchema.parse({
        ...validPlan,
        jobs: [validPlan.jobs[0], validPlan.jobs[0], validPlan.jobs[2]],
      }),
    ).toThrow();
  });

  it("keeps probe evidence concise and confidence bounded", () => {
    expect(ProbeOutputSchema.parse(probeFor("counterexample"))).toBeTruthy();
    expect(() =>
      ProbeOutputSchema.parse({
        ...probeFor("counterexample"),
        confidence: 1.2,
      }),
    ).toThrow();
  });

  it("requires a meaningful revision that differs from the original", () => {
    const valid = {
      activityId: "correlation-causation",
      originalResponse: validAnalyzeRequest.response,
      revisedResponse:
        "Participants averaged eight points higher, but self-selection means the difference alone does not establish causation. We need comparable baselines or random assignment.",
      mode: "demo" as const,
    };

    expect(ReviseRequestSchema.parse(valid)).toEqual(valid);
    expect(() =>
      ReviseRequestSchema.parse({
        ...valid,
        revisedResponse: valid.originalResponse,
      }),
    ).toThrow();

    const transfer = {
      activityId: "correlation-causation",
      response:
        "The hospital recovery difference does not establish causation because patients chose whether to join.",
      mode: "demo" as const,
    };
    expect(TransferRequestSchema.parse(transfer)).toEqual(transfer);
    expect(() =>
      TransferRequestSchema.parse({ ...transfer, mode: "live" }),
    ).toThrow();
  });

  it("does not allow a receipt to claim mastery or authorship", () => {
    const unsafeReceipt = {
      activityId: "correlation-causation",
      repairedHinge: "association-as-causation",
      summary: "The learner mastered causal inference.",
      changes: [
        {
          label: "Causal claim",
          before: "Tutoring caused the increase.",
          after: "The difference alone does not establish causation.",
        },
      ],
      rubric: [
        {
          id: "association-causation",
          label: "Distinguishes association from causation",
          before: "missing",
          after: "met",
          evidence: "does not establish causation",
        },
      ],
      remainingCaveat: null,
      provenance: { model: "gpt-5.6-sol", mode: "live" },
    };

    expect(() => ReceiptSchema.parse(unsafeReceipt)).toThrow();
    expect(() =>
      ReceiptSchema.parse({
        ...unsafeReceipt,
        summary: "The revision now qualifies the causal claim.",
        repairedHinge: "Association is not causation",
        changes: [
          {
            ...unsafeReceipt.changes[0],
            label: "Learner-authored revision",
          },
        ],
      }),
    ).toThrow();
  });

  it("requires quoted evidence only for supported rubric states", () => {
    const baseReceipt = {
      activityId: "correlation-causation",
      repairedHinge: "Association is not causation",
      summary: "The submitted revision does not yet address this criterion.",
      changes: [
        {
          label: "Submitted revision",
          before: "Tutoring caused the increase.",
          after: "The explanation remains incomplete.",
        },
      ],
      rubric: [
        {
          id: "association-causation",
          label: "Distinguishes association from causation",
          before: "missing" as const,
          after: "missing" as const,
          evidence: null,
        },
      ],
      remainingCaveat: "Direct evidence is still needed.",
      provenance: { model: "demo-fixture" as const, mode: "demo" as const },
    };

    expect(ReceiptSchema.parse(baseReceipt)).toEqual(baseReceipt);
    expect(() =>
      ReceiptSchema.parse({
        ...baseReceipt,
        rubric: [{ ...baseReceipt.rubric[0], after: "met", evidence: null }],
      }),
    ).toThrow();
  });

  it("keeps transfer state separate from revision before-and-after fields", () => {
    const slip = {
      activityId: "correlation-causation" as const,
      summary:
        "The fresh-case response contains candidate evidence for 1 of 3 visible rubric criteria.",
      rubric: [
        {
          id: "association-causation",
          label: "Distinguishes association from causation",
          state: "met" as const,
          evidence: "does not establish causation",
        },
      ],
      remainingCaveat: "Human review is still required.",
      provenance: { model: "demo-fixture" as const, mode: "demo" as const },
    };

    expect(TransferSlipSchema.parse(slip)).toEqual(slip);
    expect(() =>
      TransferSlipSchema.parse({
        ...slip,
        rubric: [{ ...slip.rubric[0], before: "missing" }],
      }),
    ).toThrow();
  });
});
