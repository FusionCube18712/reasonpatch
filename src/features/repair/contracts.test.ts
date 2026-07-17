import { describe, expect, it } from "vitest";

import {
  AnalyzeRequestSchema,
  AnalysisPlanSchema,
  ProbeOutputSchema,
  ReceiptSchema,
  ReviseRequestSchema,
} from "./contracts";
import { probeFor, validAnalyzeRequest, validPlan } from "../../../test/fixtures";

describe("repair contracts", () => {
  it("accepts the bounded live analysis request", () => {
    expect(AnalyzeRequestSchema.parse(validAnalyzeRequest)).toEqual(validAnalyzeRequest);
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
  });

  it("does not allow a receipt to claim mastery or authorship", () => {
    const unsafeReceipt = {
      activityId: "correlation-causation",
      repairedHinge: "association-as-causation",
      summary: "The learner mastered causal inference.",
      changes: [],
      rubric: [],
      remainingCaveat: null,
      provenance: { model: "gpt-5.6-sol", mode: "live" },
    };

    expect(() => ReceiptSchema.parse(unsafeReceipt)).toThrow();
  });
});

