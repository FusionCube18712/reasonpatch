import { describe, expect, it } from "vitest";

import {
  evaluateScenarioRevision,
  evaluateScenarioTransfer,
} from "./scenario-evaluator";

const validRevisions = {
  "logic-negation-introduction": `1. ¬p                 Premise
2. | p ∧ q            Assumption
3. | p                ∧E 2
4. | ⊥                ¬E 1,3
5. ¬(p ∧ q)          ¬I 2-4`,
  "algebra-square-branches": `1. x² = 9
2. x² - 9 = 0
3. (x - 3)(x + 3) = 0
4. x = 3 or x = -3 by the zero-product property`,
  "python-empty-aggregate": `def average(nums):
    if not nums:
        raise ValueError("average requires at least one value")
    return sum(nums) / len(nums)`,
  "causal-observational-claim":
    "The data show an association between flashcard use and higher scores, but they do not establish causation. Students choosing flashcards may also study longer. A randomized or controlled comparison would better support a causal claim.",
} as const;

const validTransfers = {
  "logic-negation-introduction":
    "Assume r ∧ s. Extract r by conjunction elimination, combine r with ¬r to derive ⊥ while the assumption is open, then discharge the assumption by negation introduction.",
  "algebra-square-branches":
    "The real solutions are y = 4 and y = -4 because both square to 16, so y = ±√16 gives the complete solution set.",
  "python-empty-aggregate":
    "Check for an empty values list before max or min because both raise without values; choose an explicit exception policy.",
  "causal-observational-claim":
    "The pattern does not show firefighters cause damage. Fire severity drives both the number of firefighters and the damage, so a comparison controlling for severity is needed.",
} as const;

describe("guided scenario evaluator", () => {
  it.each(Object.entries(validRevisions))(
    "recognizes grounded repair evidence for %s",
    (scenarioId, revision) => {
      const result = evaluateScenarioRevision(scenarioId, revision);

      expect(result.status).toBe("evidence-observed");
      expect(result.criteria.every(({ state }) => state === "met")).toBe(true);
      expect(result.criteria.every(({ evidence }) => evidence !== null)).toBe(
        true,
      );
      expect(result.provenance).toEqual({
        source: "deterministic-verifier",
        scope: "guided-scenario-only",
        scenarioId,
      });
      expect(JSON.stringify(result)).not.toMatch(/master(?:y|ed)|grade|correct/iu);
    },
  );

  it.each([
    [
      "logic-negation-introduction",
      "1. ¬p Premise\n2. | p ∧ q Assumption\n3. | p ∧E 2\n4. ¬(p ∧ q) ¬I 1,3",
      "explicit contradiction",
    ],
    [
      "algebra-square-branches",
      "x² = 9, so x = 3. The negative branch is invalid.",
      "negative solution",
    ],
    [
      "python-empty-aggregate",
      "def average(nums):\n    return sum(nums) / len(nums)\n# empty ValueError guard",
      "guard before division",
    ],
    [
      "causal-observational-claim",
      "Although this is an association, flashcards definitely cause higher scores; no controlled comparison is needed.",
      "calibrated causal claim",
    ],
  ])(
    "rejects keyword-stuffed or contradictory repair for %s",
    (scenarioId, revision, missingLabel) => {
      const result = evaluateScenarioRevision(scenarioId, revision);

      expect(result.status).toBe("needs-work");
      expect(result.criteria).toContainEqual(
        expect.objectContaining({ label: expect.stringMatching(missingLabel), state: "missing" }),
      );
    },
  );

  it.each([
    [
      "logic-negation-introduction",
      "2. | p ∧ q Assumption\n3. p\n4. No contradiction can be derived.\n5. ¬(p ∧ q) ¬I 2-4",
      ["explicit-contradiction"],
    ],
    [
      "algebra-square-branches",
      "By the zero-product property, x = 3 is not a solution but x = -3 is.",
      ["positive-solution"],
    ],
    [
      "python-empty-aggregate",
      "DEF average(nums):\n    IF NOT nums:\n        RETURN null\n    RETURN SUM(nums) / LEN(nums)",
      ["guard-before-division", "explicit-policy", "non-empty-behavior"],
    ],
    [
      "causal-observational-claim",
      "The observational association does not establish causation. Motivation is not a plausible alternative explanation. A randomized study is not required.",
      ["alternative-explanation", "stronger-evidence"],
    ],
    [
      "causal-observational-claim",
      "The observational association does not establish causation. Students who choose flashcards are not more motivated. A randomized study is not required.",
      ["alternative-explanation", "stronger-evidence"],
    ],
    [
      "logic-negation-introduction",
      "p ∧ q is not an assumption. No contradiction can be derived. ¬I 2-4 is invalid.",
      ["scoped-assumption", "explicit-contradiction", "negation-introduction"],
    ],
    [
      "algebra-square-branches",
      "By the zero-product property, neither x = 3 nor x = -3 is a solution; both are wrong.",
      ["positive-solution", "negative-solution", "branch-justification"],
    ],
    [
      "causal-observational-claim",
      "This observational association does not establish causation. Motivation is irrelevant. A randomized study would be useless.",
      ["alternative-explanation", "stronger-evidence"],
    ],
  ])(
    "rejects negated or syntactically invalid revision evidence for %s",
    (scenarioId, revision, missingIds) => {
      const result = evaluateScenarioRevision(scenarioId, revision);

      expect(result.status).toBe("needs-work");
      for (const id of missingIds) {
        expect(result.criteria).toContainEqual(
          expect.objectContaining({ id, state: "missing", evidence: null }),
        );
      }
    },
  );

  it.each(Object.entries(validTransfers))(
    "checks only fresh-case evidence for %s",
    (scenarioId, response) => {
      const result = evaluateScenarioTransfer(scenarioId, response);

      expect(result.status).toBe("evidence-observed");
      expect(result.criteria.every(({ state }) => state === "met")).toBe(true);
      expect(result.summary).toMatch(/fresh|new case/iu);
    },
  );

  it.each([
    [
      "logic-negation-introduction",
      validRevisions["logic-negation-introduction"],
    ],
    [
      "algebra-square-branches",
      validRevisions["algebra-square-branches"],
    ],
    ["python-empty-aggregate", validRevisions["python-empty-aggregate"]],
    [
      "causal-observational-claim",
      validRevisions["causal-observational-claim"],
    ],
  ])(
    "rejects a copied original-context repair as transfer evidence for %s",
    (scenarioId, staleResponse) => {
      const result = evaluateScenarioTransfer(scenarioId, staleResponse);

      expect(result.status).toBe("needs-work");
      expect(result.criteria.some(({ state }) => state === "missing")).toBe(true);
    },
  );

  it.each([
    [
      "logic-negation-introduction",
      "Assume r ∧ s. Extract r, but r with ¬r cannot derive a contradiction. Discharge the assumption by negation introduction.",
      ["fresh-contradiction"],
    ],
    [
      "algebra-square-branches",
      "For y² = 16, y = 4 is not a solution and y = -4 is not a solution; both square branches are invalid.",
      ["fresh-positive", "fresh-negative", "fresh-branches"],
    ],
    [
      "python-empty-aggregate",
      "The values need not check empty input before max or min, and an exception policy is unnecessary.",
      ["fresh-order", "fresh-policy"],
    ],
    [
      "python-empty-aggregate",
      "Do not check whether values are empty before max or min; use an exception policy.",
      ["fresh-order"],
    ],
    [
      "causal-observational-claim",
      "This does not show firefighters cause damage. Fire severity does not drive either firefighters or damage. Control for severity is unnecessary.",
      ["fresh-common-cause", "fresh-evidence"],
    ],
    [
      "logic-negation-introduction",
      "Do not assume r ∧ s. Extract r and combine it with ¬r to derive a contradiction. Never discharge by negation introduction.",
      ["fresh-assumption", "fresh-discharge"],
    ],
    [
      "algebra-square-branches",
      "For y² = 16, neither y = 4 nor y = -4 is a solution; both square branches are invalid.",
      ["fresh-positive", "fresh-negative", "fresh-branches"],
    ],
    [
      "python-empty-aggregate",
      "Check whether values are empty before max and min, but do not raise anything or use an explicit policy.",
      ["fresh-policy"],
    ],
    [
      "causal-observational-claim",
      "This does not show firefighters cause damage. Severity fails to drive both firefighters and damage. Controlling for severity would add nothing.",
      ["fresh-common-cause", "fresh-evidence"],
    ],
  ])(
    "rejects negated fresh-case evidence for %s",
    (scenarioId, response, missingIds) => {
      const result = evaluateScenarioTransfer(scenarioId, response);

      expect(result.status).toBe("needs-work");
      for (const id of missingIds) {
        expect(result.criteria).toContainEqual(
          expect.objectContaining({ id, state: "missing", evidence: null }),
        );
      }
    },
  );

  it("accepts a complete algebra justification by direct substitution", () => {
    const result = evaluateScenarioRevision(
      "algebra-square-branches",
      "x = 3 because 3² = 9, and x = -3 because (-3)² = 9.",
    );

    expect(result.status).toBe("evidence-observed");
    expect(result.criteria.every(({ state }) => state === "met")).toBe(true);
  });

  it("fails closed for an unknown scenario instead of applying a generic checker", () => {
    expect(() => evaluateScenarioRevision("unknown", "keyword-rich text")).toThrow(
      /unknown scenario/iu,
    );
    expect(() => evaluateScenarioTransfer("unknown", "keyword-rich text")).toThrow(
      /unknown scenario/iu,
    );
  });
});
