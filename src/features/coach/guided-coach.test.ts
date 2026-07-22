import { describe, expect, it } from "vitest";

import { createGuidedDiagnosis } from "./guided-coach";
import { getScenario } from "./scenarios";

const EXPECTED_DIAGNOSES = {
  "logic-negation-introduction": {
    hingeQuote: "4. ¬(p ∧ q)    ¬I 1, 3",
    strength: /extract(?:ed|s)? p|conjunction elimination/iu,
    issue: /contradiction|negation introduction/iu,
  },
  "algebra-square-branches": {
    hingeQuote: "2. x = √9",
    strength: /3 is (?:a|one) (?:valid )?solution|principal square root/iu,
    issue: /negative|branch/iu,
  },
  "python-empty-aggregate": {
    hingeQuote: "return sum(nums) / len(nums)",
    strength: /non-empty|average formula|calculation/iu,
    issue: /empty|division by zero/iu,
  },
  "causal-observational-claim": {
    hingeQuote: "definitely cause better exam performance",
    strength: /observed (?:relationship|association)|score difference/iu,
    issue: /association|causal|causation/iu,
  },
} as const;

const guidedRequest = (scenarioId: keyof typeof EXPECTED_DIAGNOSES) => ({
  source: {
    kind: "guided" as const,
    scenarioId,
    attempt: getScenario(scenarioId).attempt,
  },
  mode: "demo" as const,
  coachStyle: "socratic" as const,
  forceLunaFallback: false,
});

describe("guided office-hours coach", () => {
  it.each(Object.entries(EXPECTED_DIAGNOSES))(
    "returns a focused, answer-withholding diagnosis for %s",
    (rawScenarioId, expected) => {
      const scenarioId = rawScenarioId as keyof typeof EXPECTED_DIAGNOSES;
      const scenario = getScenario(scenarioId);
      const result = createGuidedDiagnosis(guidedRequest(scenarioId));

      expect(result.source).toEqual({ kind: "guided", scenarioId });
      expect(result.diagnosis.hingeQuote).toBe(expected.hingeQuote);
      expect(scenario.attempt).toContain(result.diagnosis.hingeQuote);
      expect(result.diagnosis.strengths).toEqual(
        expect.arrayContaining([expect.stringMatching(expected.strength)]),
      );
      expect(
        `${result.diagnosis.issueTitle} ${result.diagnosis.explanation}`,
      ).toMatch(expected.issue);
      expect(result.diagnosis.socraticQuestion).toMatch(/^[^?]+\?$/u);
      expect(result.diagnosis.hints.map(({ level }) => level)).toEqual([
        "location",
        "concept",
        "strategy",
      ]);
      expect(JSON.stringify(result)).not.toMatch(
        /referenceRevision|referenceAnswer|replacementAnswer|answerKey/iu,
      );
    },
  );

  it("labels the replay as simulated demo data without invented model execution", () => {
    const result = createGuidedDiagnosis(
      guidedRequest("python-empty-aggregate"),
    );

    expect(result.provenance).toEqual({
      mode: "demo",
      source: "guided-fixture",
      simulated: true,
      modelCalls: 0,
    });
    expect(JSON.stringify(result)).not.toMatch(
      /gpt-5\.6-(?:sol|luna)|latencyMs|"status":"completed"/u,
    );
  });

  it("returns isolated immutable values instead of exposing fixture state", () => {
    const request = guidedRequest("algebra-square-branches");
    const first = createGuidedDiagnosis(request);
    const second = createGuidedDiagnosis(request);
    const originalStrength = second.diagnosis.strengths[0];
    const originalHint = second.diagnosis.hints[0]?.text;

    expect(first).not.toBe(second);
    expect(first.diagnosis).not.toBe(second.diagnosis);
    expect(first.diagnosis.hints).not.toBe(second.diagnosis.hints);

    try {
      (first.diagnosis.strengths as string[])[0] = "tampered";
      (first.diagnosis.hints as Array<{ level: string; text: string }>)[0] = {
        level: "location",
        text: "tampered",
      };
    } catch {
      // Frozen and cloned values both protect the fixture contract.
    }

    const third = createGuidedDiagnosis(request);
    expect(third.diagnosis.strengths[0]).toBe(originalStrength);
    expect(third.diagnosis.hints[0]?.text).toBe(originalHint);
  });

  it("rejects an edited attempt rather than attaching a canned diagnosis", () => {
    const request = guidedRequest("causal-observational-claim");

    expect(() =>
      createGuidedDiagnosis({
        ...request,
        source: {
          ...request.source,
          attempt: `${request.source.attempt} I added a new conclusion.`,
        },
      }),
    ).toThrow(/exact|guided|attempt/iu);
  });
});
