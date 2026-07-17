import type {
  AnalyzeRequest,
  AnalysisPlan,
  ProbeOutput,
  SynthesisOutput,
} from "@/features/repair/contracts";

export const validAnalyzeRequest: AnalyzeRequest = {
  activityId: "correlation-causation",
  response:
    "The tutoring program caused the improvement because participants scored eight points higher. Therefore every school should use it.",
  mode: "live" as const,
  forceLunaFallback: false,
};

export const validPlan: AnalysisPlan = {
  hingeQuote:
    "The tutoring program caused the improvement because participants scored eight points higher.",
  misconception: "association-as-causation",
  explanation:
    "The response treats an observed group difference as proof that the program caused it.",
  jobs: [
    {
      id: "probe_counterexample",
      role: "counterexample",
      objective: "Test whether a plausible selection effect could produce the same difference.",
    },
    {
      id: "probe_assumption",
      role: "assumption",
      objective: "Identify the unstated assumption required for the causal claim.",
    },
    {
      id: "probe_rubric",
      role: "rubric",
      objective: "Map the response to the visible causal-inference rubric.",
    },
  ],
};

export const probeFor = (role: ProbeOutput["role"]): ProbeOutput => ({
  role,
  finding:
    role === "counterexample"
      ? "More motivated students could have chosen tutoring and also scored higher."
      : role === "assumption"
        ? "The claim assumes the groups were comparable before tutoring."
        : "The response does not distinguish association from causation.",
  evidenceQuote: validPlan.hingeQuote,
  coachingMove:
    role === "counterexample"
      ? "Ask the learner to test the claim against self-selection."
      : role === "assumption"
        ? "Ask what must be true about the two groups before tutoring."
        : "Ask what evidence the rubric requires before using causal language.",
  confidence: 0.86,
  limitation: "The short response may omit context the learner considered.",
});

export const validSynthesis: SynthesisOutput = {
  hingeQuote: validPlan.hingeQuote,
  misconception: validPlan.misconception,
  explanation: validPlan.explanation,
  socraticQuestion:
    "What if students who were already more motivated were also more likely to choose tutoring?",
  whyThisQuestion:
    "It tests whether the score difference can be explained without assuming the program caused it.",
  rubric: [
    {
      id: "association-causation",
      state: "missing",
      evidence: null,
    },
    {
      id: "confounder",
      state: "missing",
      evidence: null,
    },
    {
      id: "additional-evidence",
      state: "missing",
      evidence: null,
    },
  ],
  limitation: "This is an AI-generated challenge, not a grade or verdict.",
};
