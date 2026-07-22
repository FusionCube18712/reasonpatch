import type { DomainId } from "./contracts";
import { ScenarioIdSchema, type ScenarioId } from "./scenario-ids";

export type PublicScenario = Readonly<{
  id: ScenarioId;
  domain: DomainId;
  title: string;
  shortLabel: string;
  assignment: string;
  constraints: string;
  attempt: string;
  transferPrompt: string;
  criteria: ReadonlyArray<Readonly<{ id: string; label: string }>>;
}>;

const SCENARIOS: ReadonlyArray<PublicScenario> = [
  {
    id: "logic-negation-introduction",
    domain: "formal-logic",
    title: "The missing contradiction",
    shortLabel: "Formal logic",
    assignment:
      "Using Fitch-style natural deduction, prove: ¬p ⊢ ¬(p ∧ q). Show every inference and cite the rule used.",
    constraints:
      "Use premise, assumption, conjunction elimination, contradiction, and negation introduction. Do not use truth tables.",
    attempt: `1. ¬p          Premise
2. | p ∧ q     Assumption
3. | p         ∧E 2
4. ¬(p ∧ q)    ¬I 1, 3`,
    transferPrompt:
      "From ¬r, explain how to prove ¬(r ∧ s). Describe what must happen inside the temporary assumption before it can be discharged.",
    criteria: [
      { id: "scoped-assumption", label: "Keeps the assumption in scope" },
      {
        id: "explicit-contradiction",
        label: "Derives an explicit contradiction",
      },
      {
        id: "negation-introduction",
        label: "Cites the complete subproof for negation introduction",
      },
    ],
  },
  {
    id: "algebra-square-branches",
    domain: "algebra",
    title: "The branch that disappeared",
    shortLabel: "Algebra",
    assignment: "Solve x² = 9 over the real numbers and justify every solution.",
    constraints: "Show why the complete real solution set has been found.",
    attempt: `1. x² = 9
2. x = √9
3. x = 3`,
    transferPrompt:
      "Solve y² = 16 in words. Name every real solution and explain why both branches must be considered.",
    criteria: [
      { id: "positive-solution", label: "Includes the positive solution" },
      { id: "negative-solution", label: "Includes the negative solution" },
      { id: "branch-justification", label: "Justifies both branches" },
    ],
  },
  {
    id: "python-empty-aggregate",
    domain: "python",
    title: "The input nobody tried",
    shortLabel: "Python",
    assignment:
      "Review this Python function for correctness on every list input. Identify and repair the first consequential issue without rewriting unrelated code.",
    constraints:
      "Keep behavior for non-empty numeric lists. Choose and document a policy for empty input.",
    attempt: `def average(nums):
    return sum(nums) / len(nums)`,
    transferPrompt:
      "A function returns max(values) - min(values). What must it do before calling max and min, and why?",
    criteria: [
      {
        id: "guard-before-division",
        label: "Places an empty-input guard before division",
      },
      { id: "explicit-policy", label: "Uses an explicit empty-input policy" },
      {
        id: "non-empty-behavior",
        label: "Preserves the non-empty calculation",
      },
    ],
  },
  {
    id: "causal-observational-claim",
    domain: "causal-reasoning",
    title: "The claim outruns the evidence",
    shortLabel: "Causal reasoning",
    assignment:
      "Evaluate this inference: “Students who use flashcards score higher. Therefore flashcards cause higher scores.” Revise it so the conclusion matches the evidence.",
    constraints:
      "Do not invent new data. Distinguish association from causation and identify what evidence would strengthen the claim.",
    attempt:
      "The data show that students who use flashcards score higher, so flashcards definitely cause better exam performance.",
    transferPrompt:
      "Neighborhoods with more firefighters often have more fire damage. Why does that not show that firefighters cause the damage?",
    criteria: [
      { id: "calibrated-claim", label: "Calibrates the causal claim" },
      {
        id: "alternative-explanation",
        label: "Names a plausible alternative explanation",
      },
      { id: "stronger-evidence", label: "Requests stronger causal evidence" },
    ],
  },
] as const;

const cloneScenario = (scenario: PublicScenario): PublicScenario => ({
  ...scenario,
  criteria: scenario.criteria.map((criterion) => ({ ...criterion })),
});

export const listScenarios = (): ReadonlyArray<PublicScenario> =>
  SCENARIOS.map(cloneScenario);

export const getScenario = (rawId: string): PublicScenario => {
  const parsed = ScenarioIdSchema.safeParse(rawId);
  if (!parsed.success) throw new Error(`Unknown scenario: ${rawId}`);
  const scenario = SCENARIOS.find(({ id }) => id === parsed.data);
  if (!scenario) throw new Error(`Unknown scenario: ${rawId}`);
  return cloneScenario(scenario);
};
