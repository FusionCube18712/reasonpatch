import { describe, expect, it } from "vitest";

import { getScenario, listScenarios } from "./scenarios";

const EXPECTED_ATTEMPTS = {
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

describe("public guided scenarios", () => {
  it("offers the four realistic reasoning domains in a stable order", () => {
    expect(listScenarios().map(({ id }) => id)).toEqual([
      "logic-negation-introduction",
      "algebra-square-branches",
      "python-empty-aggregate",
      "causal-observational-claim",
    ]);
  });

  it.each(Object.entries(EXPECTED_ATTEMPTS))(
    "preserves the exact sample attempt for %s",
    (scenarioId, attempt) => {
      expect(getScenario(scenarioId).attempt).toBe(attempt);
    },
  );

  it("returns immutable copies instead of leaking catalog state", () => {
    const listed = listScenarios();
    const logic = getScenario("logic-negation-introduction");

    try {
      (listed as unknown as Array<unknown>).pop();
      (logic as unknown as { attempt: string }).attempt = "tampered";
    } catch {
      // Deeply frozen values and copy-on-read values both satisfy the contract.
    }

    expect(listScenarios()).toHaveLength(4);
    expect(getScenario("logic-negation-introduction").attempt).toBe(
      EXPECTED_ATTEMPTS["logic-negation-introduction"],
    );
  });

  it("keeps reference revisions and private answer keys out of the public catalog", () => {
    const serialized = JSON.stringify(listScenarios());

    expect(serialized).not.toMatch(
      /referenceRevision|referenceAnswer|answerKey|transferAnswer|diagnosis|review|private/iu,
    );
    expect(serialized).not.toContain(
      'raise ValueError("average requires at least one value")',
    );
    expect(serialized).not.toContain("derive ⊥ while the assumption is open");
    expect(serialized).not.toContain("x = 3 or x = -3");
    expect(serialized).not.toContain(
      "A randomized or well-controlled study would be needed",
    );
  });

  it("fails closed for unknown scenario identifiers", () => {
    expect(() => getScenario("invented-scenario")).toThrow(/unknown scenario/iu);
  });
});
