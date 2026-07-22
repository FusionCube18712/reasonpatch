import { describe, expect, it } from "vitest";

import { CoachDiagnosisSchema, OfficeHoursRequestSchema } from "./contracts";

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

describe("coach diagnosis contract", () => {
  const validDiagnosis = {
    strengths: ["The learner begins from the supplied premise."],
    hingeQuote: "2. x = √9",
    issueTitle: "The negative square branch disappears",
    issueLocation: "The first consequential break occurs on line two.",
    explanation:
      "The principal square root notation retains only one real branch.",
    socraticQuestion:
      "What other real number squares to nine besides positive three?",
    whyThisQuestion:
      "It tests the missing branch without supplying the full derivation.",
    hints: [
      { level: "location", text: "Inspect the transition on line two." },
      { level: "concept", text: "An equation can have two square roots." },
      { level: "strategy", text: "Factor the difference of two squares." },
    ],
    criteria: [
      {
        id: "positive-branch",
        label: "Includes the positive branch",
        state: "met",
        evidence: "2. x = √9",
      },
      {
        id: "negative-branch",
        label: "Includes the negative branch",
        state: "missing",
        evidence: null,
      },
    ],
    limitation: "This is a bounded formative review of submitted text.",
  } as const;

  it("rejects duplicate visible criterion identifiers", () => {
    expect(() =>
      CoachDiagnosisSchema.parse({
        ...validDiagnosis,
        criteria: [validDiagnosis.criteria[0], validDiagnosis.criteria[0]],
      }),
    ).toThrow();
  });

  it.each([
    "The answer is correct.",
    "This proves the learner understands the concept.",
    "This confirms the revision's accuracy.",
    "This is learner-authored work.",
  ])("rejects categorical diagnosis verdicts: %s", (claim) => {
    expect(() =>
      CoachDiagnosisSchema.parse({ ...validDiagnosis, explanation: claim }),
    ).toThrow();
  });
});
