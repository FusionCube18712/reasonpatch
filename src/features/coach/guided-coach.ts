import {
  CoachDiagnosisSchema,
  OfficeHoursRequestSchema,
  type CoachDiagnosis,
  type OfficeHoursRequest,
} from "./contracts";
import type { ScenarioId } from "./scenario-ids";

type GuidedRequest = Extract<OfficeHoursRequest, { mode: "demo" }>;

export type GuidedDiagnosisResult = Readonly<{
  runId: string;
  source: Readonly<{ kind: "guided"; scenarioId: ScenarioId }>;
  diagnosis: CoachDiagnosis;
  provenance: Readonly<{
    mode: "demo";
    source: "guided-fixture";
    simulated: true;
    modelCalls: 0;
  }>;
}>;

const FIXTURES: Readonly<Record<ScenarioId, CoachDiagnosis>> = {
  "logic-negation-introduction": {
    strengths: [
      "The attempt opens the intended assumption and correctly extracts p by conjunction elimination.",
    ],
    hingeQuote: "4. ¬(p ∧ q)    ¬I 1, 3",
    issueTitle: "Negation introduction closes before a contradiction is derived",
    issueLocation: "The first consequential break is the transition to line 4.",
    explanation:
      "The overall strategy is sound, but the open subproof needs an explicit contradiction before negation introduction can discharge it.",
    socraticQuestion:
      "Given the premise ¬p and the p inside the open subproof, what can you derive next?",
    whyThisQuestion:
      "It points to the missing rule application without completing the proof.",
    hints: [
      { level: "location", text: "Inspect the transition after line 3." },
      {
        level: "concept",
        text: "Negation introduction discharges a subproof that ends in contradiction.",
      },
      {
        level: "strategy",
        text: "Use the two claims about p while the conjunction assumption remains open.",
      },
    ],
    criteria: [
      {
        id: "scoped-assumption",
        label: "Keeps the assumption in scope",
        state: "emerging",
        evidence: "| p ∧ q     Assumption",
      },
      {
        id: "explicit-contradiction",
        label: "Derives an explicit contradiction",
        state: "missing",
        evidence: null,
      },
      {
        id: "negation-introduction",
        label: "Uses the complete subproof",
        state: "missing",
        evidence: null,
      },
    ],
    limitation:
      "This fixture checks a standard Fitch-style pattern; course notation may differ.",
  },
  "algebra-square-branches": {
    strengths: [
      "The attempt identifies 3 as a valid solution and uses the principal square root accurately.",
    ],
    hingeQuote: "2. x = √9",
    issueTitle: "The negative square branch disappears",
    issueLocation: "The first consequential break is the move from line 1 to line 2.",
    explanation:
      "The equation asks for every real value whose square is 9, but the principal square root notation retains only one branch.",
    socraticQuestion:
      "What other real number squares to 9, and how can your algebra preserve both branches?",
    whyThisQuestion:
      "It exposes the incomplete solution set without supplying the derivation.",
    hints: [
      { level: "location", text: "Recheck the move from x² = 9 to line 2." },
      {
        level: "concept",
        text: "A principal square root is one number, while an equation can have multiple roots.",
      },
      {
        level: "strategy",
        text: "Test values on both sides of zero or preserve both branches algebraically.",
      },
    ],
    criteria: [
      {
        id: "positive-solution",
        label: "Includes the positive solution",
        state: "met",
        evidence: "x = 3",
      },
      {
        id: "negative-solution",
        label: "Includes the negative solution",
        state: "missing",
        evidence: null,
      },
      {
        id: "branch-justification",
        label: "Justifies both branches",
        state: "missing",
        evidence: null,
      },
    ],
    limitation: "This fixture is limited to real-number algebra for x² = 9.",
  },
  "python-empty-aggregate": {
    strengths: [
      "The non-empty average calculation is concise and preserves the requested formula.",
    ],
    hingeQuote: "return sum(nums) / len(nums)",
    issueTitle: "Empty input reaches division by zero",
    issueLocation: "The first consequential break is the unguarded return expression.",
    explanation:
      "For an empty list, len(nums) becomes zero, so the function needs an explicit policy before division.",
    socraticQuestion:
      "What should the function do before dividing when nums is empty?",
    whyThisQuestion:
      "It asks the learner to choose a boundary policy without writing the repair.",
    hints: [
      { level: "location", text: "Inspect the denominator in the return line." },
      {
        level: "concept",
        text: "Ask which precondition division requires for every allowed input.",
      },
      {
        level: "strategy",
        text: "Try the smallest possible list before changing the successful path.",
      },
    ],
    criteria: [
      {
        id: "guard-before-division",
        label: "Places an empty-input guard before division",
        state: "missing",
        evidence: null,
      },
      {
        id: "explicit-policy",
        label: "Uses an explicit empty-input policy",
        state: "missing",
        evidence: null,
      },
      {
        id: "non-empty-behavior",
        label: "Preserves the non-empty calculation",
        state: "met",
        evidence: "return sum(nums) / len(nums)",
      },
    ],
    limitation:
      "This fixture never executes submitted code and does not inspect element types.",
  },
  "causal-observational-claim": {
    strengths: [
      "The attempt states the observed relationship in scores clearly and keeps the claim focused.",
    ],
    hingeQuote: "definitely cause better exam performance",
    issueTitle: "An observed association is upgraded to definite causation",
    issueLocation: "The first consequential break is the causal wording in the conclusion.",
    explanation:
      "Students choosing flashcards may differ in study time, motivation, or prior achievement, so the observed association has alternative explanations.",
    socraticQuestion:
      "What alternative explanation could produce the same score association if flashcards had no causal effect?",
    whyThisQuestion:
      "It tests the causal warrant without inventing evidence or rewriting the claim.",
    hints: [
      { level: "location", text: "Look at the certainty word in the conclusion." },
      {
        level: "concept",
        text: "Observational groups may differ before the behavior being studied.",
      },
      {
        level: "strategy",
        text: "Name one factor that could influence both flashcard use and scores.",
      },
    ],
    criteria: [
      {
        id: "calibrated-claim",
        label: "Calibrates the causal claim",
        state: "missing",
        evidence: null,
      },
      {
        id: "alternative-explanation",
        label: "Names a plausible alternative explanation",
        state: "missing",
        evidence: null,
      },
      {
        id: "stronger-evidence",
        label: "Requests stronger causal evidence",
        state: "missing",
        evidence: null,
      },
    ],
    limitation:
      "This fixture checks a basic causal warrant, not the quality of an underlying study.",
  },
};

const cloneDiagnosis = (diagnosis: CoachDiagnosis): CoachDiagnosis =>
  CoachDiagnosisSchema.parse(structuredClone(diagnosis));

export const createGuidedDiagnosis = (
  rawRequest: GuidedRequest,
): GuidedDiagnosisResult => {
  const request = OfficeHoursRequestSchema.parse(rawRequest);
  if (request.source.kind !== "guided") {
    throw new Error("Guided diagnosis requires an exact guided attempt.");
  }
  return {
    runId: `guided_${request.source.scenarioId}`,
    source: { kind: "guided", scenarioId: request.source.scenarioId },
    diagnosis: cloneDiagnosis(FIXTURES[request.source.scenarioId]),
    provenance: {
      mode: "demo",
      source: "guided-fixture",
      simulated: true,
      modelCalls: 0,
    },
  };
};
