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

  it("fails closed for an unknown scenario instead of applying a generic checker", () => {
    expect(() => evaluateScenarioRevision("unknown", "keyword-rich text")).toThrow(
      /unknown scenario/iu,
    );
    expect(() => evaluateScenarioTransfer("unknown", "keyword-rich text")).toThrow(
      /unknown scenario/iu,
    );
  });
});
