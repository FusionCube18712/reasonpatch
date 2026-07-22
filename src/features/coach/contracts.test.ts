import { describe, expect, it } from "vitest";

import { OfficeHoursRequestSchema } from "./contracts";

const SAMPLE_ATTEMPTS = {
  "logic-negation-introduction": `1. ¬p          Premise
2. | p ∧ q     Assumption
3. | p         ∧E 2
4. ¬(p ∧ q)    ¬I 1, 3`,
  "algebra-square-branches": `1. x² = 9
2. x = √9
3. x = 3`,
  "python-empty-aggregate": `def average(nums):
    return sum(nums) / len(nums)`,
  "causal-observational-claim":
    "The data show that students who use flashcards score higher, so flashcards definitely cause better exam performance.",
} as const;

const validCustomRequest = {
  source: {
    kind: "custom" as const,
    domain: "python" as const,
    assignment:
      "Review this Python function for correctness on every list input.",
    attempt: SAMPLE_ATTEMPTS["python-empty-aggregate"],
    constraints:
      "Keep behavior for non-empty numeric lists and choose an empty-input policy.",
  },
  mode: "live" as const,
  coachStyle: "socratic" as const,
  forceLunaFallback: false,
};

const guidedRequest = (
  scenarioId: keyof typeof SAMPLE_ATTEMPTS = "logic-negation-introduction",
) => ({
  source: {
    kind: "guided" as const,
    scenarioId,
    attempt: SAMPLE_ATTEMPTS[scenarioId],
  },
  mode: "demo" as const,
  coachStyle: "socratic" as const,
  forceLunaFallback: false,
});

describe("office-hours request contract", () => {
  it("accepts strict, bounded custom work only in live mode", () => {
    expect(OfficeHoursRequestSchema.parse(validCustomRequest)).toEqual(
      validCustomRequest,
    );

    expect(() =>
      OfficeHoursRequestSchema.parse({
        ...validCustomRequest,
        source: { ...validCustomRequest.source, injected: true },
      }),
    ).toThrow();
    expect(() =>
      OfficeHoursRequestSchema.parse({
        ...validCustomRequest,
        injected: true,
      }),
    ).toThrow();
    expect(() =>
      OfficeHoursRequestSchema.parse({
        ...validCustomRequest,
        source: {
          ...validCustomRequest.source,
          assignment: "x".repeat(4_001),
        },
      }),
    ).toThrow();
    expect(() =>
      OfficeHoursRequestSchema.parse({
        ...validCustomRequest,
        source: {
          ...validCustomRequest.source,
          attempt: "x".repeat(6_001),
        },
      }),
    ).toThrow();
    expect(() =>
      OfficeHoursRequestSchema.parse({
        ...validCustomRequest,
        source: {
          ...validCustomRequest.source,
          constraints: "x".repeat(2_001),
        },
      }),
    ).toThrow();
    expect(() =>
      OfficeHoursRequestSchema.parse({
        ...validCustomRequest,
        mode: "demo",
      }),
    ).toThrow();
  });

  it.each(Object.keys(SAMPLE_ATTEMPTS) as Array<keyof typeof SAMPLE_ATTEMPTS>)(
    "accepts the exact guided attempt for %s",
    (scenarioId) => {
      const request = guidedRequest(scenarioId);

      expect(OfficeHoursRequestSchema.parse(request)).toEqual(request);
    },
  );

  it("rejects edited, substituted, or extended guided attempts", () => {
    const exact = guidedRequest("logic-negation-introduction");

    expect(() =>
      OfficeHoursRequestSchema.parse({
        ...exact,
        source: { ...exact.source, attempt: `${exact.source.attempt}\n5. done` },
      }),
    ).toThrow();
    expect(() =>
      OfficeHoursRequestSchema.parse({
        ...exact,
        source: {
          ...exact.source,
          attempt: SAMPLE_ATTEMPTS["algebra-square-branches"],
        },
      }),
    ).toThrow();
    expect(() =>
      OfficeHoursRequestSchema.parse({
        ...exact,
        source: { ...exact.source, attempt: ` ${exact.source.attempt}` },
      }),
    ).toThrow();
  });

  it("keeps the guided source union strict", () => {
    const request = guidedRequest("python-empty-aggregate");

    expect(() =>
      OfficeHoursRequestSchema.parse({
        ...request,
        source: { ...request.source, assignment: "client override" },
      }),
    ).toThrow();
    expect(() =>
      OfficeHoursRequestSchema.parse({
        ...request,
        source: { ...request.source, scenarioId: "invented-scenario" },
      }),
    ).toThrow();
  });
});
