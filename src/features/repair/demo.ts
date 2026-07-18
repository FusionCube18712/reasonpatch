import { getActivity } from "./activities";
import {
  AnalyzeRequestSchema,
  ReceiptSchema,
  ReviseRequestSchema,
  type AnalysisResult,
  type ActivityId,
  type AnalyzeRequest,
  type ProbeOutput,
  type Receipt,
  type ReviseRequest,
  type SynthesisOutput,
} from "./contracts";

type DemoFixture = Readonly<{
  diagnosis: SynthesisOutput;
  probes: ReadonlyArray<ProbeOutput>;
  receipt: Omit<Receipt, "activityId" | "provenance">;
}>;

const correlationProbes: ReadonlyArray<ProbeOutput> = [
  {
    role: "counterexample",
    finding:
      "More motivated students could choose tutoring and also perform better, producing the same score gap without a program effect.",
    evidenceQuote:
      "The tutoring program caused the improvement because participants scored eight points higher.",
    coachingMove: "Test the claim against a self-selection explanation.",
    confidence: 0.89,
    limitation: "The prompt does not provide baseline motivation or prior scores.",
  },
  {
    role: "assumption",
    finding:
      "The causal claim assumes participants and non-participants were comparable before tutoring.",
    evidenceQuote:
      "The tutoring program caused the improvement because participants scored eight points higher.",
    coachingMove: "Ask what would need to be true about the groups before tutoring.",
    confidence: 0.91,
    limitation: "Unreported study details could change the diagnosis.",
  },
  {
    role: "rubric",
    finding:
      "The response states a causal conclusion but provides no confounder or stronger comparison evidence.",
    evidenceQuote: "Therefore every school should use it.",
    coachingMove: "Connect the claim to each visible rubric criterion before revising.",
    confidence: 0.87,
    limitation: "Rubric mapping is an AI-generated challenge, not a grade.",
  },
];

const correlationDiagnosis: SynthesisOutput = {
  hingeQuote:
    "The tutoring program caused the improvement because participants scored eight points higher.",
  misconception: "association-as-causation",
  explanation:
    "The first unsupported inference is the jump from an observed group difference to a causal conclusion.",
  socraticQuestion:
    "What if more motivated students were also more likely to choose tutoring?",
  whyThisQuestion:
    "It tests whether the eight-point difference could appear even if tutoring were not the cause.",
  rubric: [
    { id: "association-causation", state: "missing", evidence: null },
    { id: "confounder", state: "missing", evidence: null },
    { id: "additional-evidence", state: "missing", evidence: null },
  ],
  limitation: "AI-generated challenge, not a grade or verdict.",
};

const baseRateProbes: ReadonlyArray<ProbeOutput> = [
  {
    role: "counterexample",
    finding:
      "Even a highly accurate test can produce many false positives when the condition is very rare.",
    evidenceQuote:
      "The test is 99% accurate, so a person who tests positive has a 99% chance of having the condition.",
    coachingMove: "Compare true and false positives in a concrete population.",
    confidence: 0.94,
    limitation: "The phrase '99% accurate' combines two different test properties in ordinary speech.",
  },
  {
    role: "assumption",
    finding: "The response assumes test accuracy equals the probability of illness after a positive.",
    evidenceQuote: "has a 99% chance of having the condition",
    coachingMove: "Ask where the population prevalence appears in the calculation.",
    confidence: 0.93,
    limitation: "The learner may know the base rate but have omitted it from the explanation.",
  },
  {
    role: "rubric",
    finding: "The explanation uses neither the base rate nor a true-positive/false-positive comparison.",
    evidenceQuote: "The test is 99% accurate",
    coachingMove: "Map a concrete count to each visible rubric item.",
    confidence: 0.9,
    limitation: "Rubric mapping is an AI-generated challenge, not a grade.",
  },
];

const baseRateDiagnosis: SynthesisOutput = {
  hingeQuote:
    "The test is 99% accurate, so a person who tests positive has a 99% chance of having the condition.",
  misconception: "base-rate-neglect",
  explanation:
    "The response swaps the test's detection rate for the probability of illness after a positive result.",
  socraticQuestion:
    "In 100,000 people, how many false positives would you expect compared with true positives?",
  whyThisQuestion:
    "Concrete counts force the rare population base rate back into the comparison without giving away the final probability.",
  rubric: [
    { id: "association-causation", state: "missing", evidence: null },
    { id: "confounder", state: "missing", evidence: null },
    { id: "additional-evidence", state: "missing", evidence: null },
  ],
  limitation: "AI-generated challenge, not a grade or verdict.",
};

const samplingProbes: ReadonlyArray<ProbeOutput> = [
  {
    role: "counterexample",
    finding:
      "A large voluntary poll can still overrepresent students with strong views about lecture recordings.",
    evidenceQuote: "Because hundreds of students answered",
    coachingMove: "Imagine who was most likely to notice and answer the newspaper poll.",
    confidence: 0.92,
    limitation: "The poll's recruitment details beyond the prompt are unknown.",
  },
  {
    role: "assumption",
    finding: "The conclusion assumes a large sample is automatically representative of all students.",
    evidenceQuote: "the poll proves most students",
    coachingMove: "Separate sample size from the way participants entered the sample.",
    confidence: 0.94,
    limitation: "The learner may have omitted an intended qualification.",
  },
  {
    role: "rubric",
    finding: "The response does not define the target population or discuss voluntary-response bias.",
    evidenceQuote: "most students want every lecture recorded",
    coachingMove: "Connect the recruitment method to each visible rubric item.",
    confidence: 0.89,
    limitation: "Rubric mapping is an AI-generated challenge, not a grade.",
  },
];

const samplingDiagnosis: SynthesisOutput = {
  hingeQuote:
    "Because hundreds of students answered, the poll proves most students want every lecture recorded.",
  misconception: "sample-size-erases-bias",
  explanation:
    "The response treats sample size as a substitute for a representative selection process.",
  socraticQuestion:
    "Which students were most likely to notice and choose to answer the newspaper's online poll?",
  whyThisQuestion:
    "It tests whether the people who volunteered could differ systematically from the campus population.",
  rubric: [
    { id: "association-causation", state: "emerging", evidence: "most students" },
    { id: "confounder", state: "missing", evidence: null },
    { id: "additional-evidence", state: "missing", evidence: null },
  ],
  limitation: "AI-generated challenge, not a grade or verdict.",
};

const correlationReceipt: DemoFixture["receipt"] = {
  repairedHinge: "Association is not causation",
  summary:
    "The revision now qualifies the causal claim, introduces self-selection, and asks for stronger comparison evidence.",
  changes: [
    {
      label: "Causal claim",
      before: "The tutoring program caused the improvement.",
      after: "The difference alone does not establish causation.",
    },
    {
      label: "Evidence standard",
      before: null,
      after: "Comparable baselines, random assignment, or a well-controlled comparison are needed.",
    },
  ],
  rubric: [
    {
      id: "association-causation",
      label: "Distinguishes association from causation",
      before: "missing",
      after: "met",
      evidence: "the difference alone does not establish causation",
    },
    {
      id: "confounder",
      label: "Names a plausible confounder or selection effect",
      before: "missing",
      after: "met",
      evidence: "students chose whether to participate",
    },
    {
      id: "additional-evidence",
      label: "States what additional evidence is needed",
      before: "missing",
      after: "met",
      evidence: "comparable baseline scores and random assignment or a controlled comparison",
    },
  ],
  remainingCaveat:
    "The revision identifies what evidence is needed; it does not establish whether the program works.",
};

const DEMO_FIXTURES: Readonly<Record<ActivityId, DemoFixture>> = {
  "correlation-causation": {
    diagnosis: correlationDiagnosis,
    probes: correlationProbes,
    receipt: correlationReceipt,
  },
  "base-rate-neglect": {
    diagnosis: baseRateDiagnosis,
    probes: baseRateProbes,
    receipt: {
      repairedHinge: "Accuracy is not the posterior",
      summary:
        "The revision now brings the rare base rate into the positive-result comparison and distinguishes true from false positives.",
      changes: [
        {
          label: "Probability direction",
          before: "A positive means a 99% chance of the condition.",
          after: "Test sensitivity alone does not determine the probability after a positive.",
        },
        {
          label: "Missing denominator",
          before: null,
          after: "True positives must be compared with false positives in the tested population.",
        },
      ],
      rubric: [
        {
          id: "association-causation",
          label: "Uses the population base rate",
          before: "missing",
          after: "met",
          evidence: "the rare population base rate",
        },
        {
          id: "confounder",
          label: "Counts true and false positives",
          before: "missing",
          after: "met",
          evidence: "compare true positives with false positives",
        },
        {
          id: "additional-evidence",
          label: "States the correct conditional comparison",
          before: "missing",
          after: "met",
          evidence: "probability after a positive",
        },
      ],
      remainingCaveat: "The revision sets up the comparison; it does not show the final arithmetic.",
    },
  },
  "sampling-bias": {
    diagnosis: samplingDiagnosis,
    probes: samplingProbes,
    receipt: {
      repairedHinge: "Size is not representativeness",
      summary:
        "The revision now separates the number of responses from the way respondents entered the sample.",
      changes: [
        {
          label: "Sample claim",
          before: "Hundreds of answers prove what most students want.",
          after: "A large voluntary sample can still misrepresent the campus population.",
        },
        {
          label: "Selection method",
          before: null,
          after: "A representative random sample would support a stronger campus-wide estimate.",
        },
      ],
      rubric: [
        {
          id: "association-causation",
          label: "Identifies the target population",
          before: "emerging",
          after: "met",
          evidence: "the campus population",
        },
        {
          id: "confounder",
          label: "Explains voluntary-response bias",
          before: "missing",
          after: "met",
          evidence: "students chose whether to answer",
        },
        {
          id: "additional-evidence",
          label: "Proposes a more representative sample",
          before: "missing",
          after: "met",
          evidence: "a representative random sample",
        },
      ],
      remainingCaveat: "The revision improves the inference but does not estimate actual campus opinion.",
    },
  },
};

const DEMO_EVIDENCE_PATTERNS: Readonly<
  Record<ActivityId, ReadonlyArray<RegExp>>
> = {
  "correlation-causation": [
    /(?:association|does not establish causation|cannot establish causation|cannot conclude causation)/iu,
    /(?:self[- ]selection|confound\w*|motivat\w*|chose|prior scores?)/iu,
    /(?:random\w*|control\w*|baseline|comparison|experiment\w*)/iu,
  ],
  "base-rate-neglect": [
    /(?:base rate|prevalence|1 in 1,?000|rare condition)/iu,
    /(?:true positives?|false positives?|100,?000)/iu,
    /(?:given a positive|among (?:the )?positive|posterior|positive result)/iu,
  ],
  "sampling-bias": [
    /(?:all students|campus population|target population)/iu,
    /(?:voluntary|self[- ]select|chose|choose|notice)/iu,
    /(?:random\w*|representative|stratif\w*)/iu,
  ],
};

const boundedExcerpt = (value: string): string =>
  value.length <= 420 ? value : `${value.slice(0, 417)}…`;

export const createDemoAnalysis = (rawRequest: AnalyzeRequest): AnalysisResult => {
  const request = AnalyzeRequestSchema.parse(rawRequest);
  if (request.mode !== "demo") throw new Error("Demo fixtures require demo mode.");

  const activity = getActivity(request.activityId);
  if (request.response !== activity.public.sampleResponse) {
    throw new Error("Guided demo requires the curated sample response.");
  }
  const fixture = DEMO_FIXTURES[request.activityId];
  const fallback = request.forceLunaFallback;
  const traceModels = fallback
    ? (["gpt-5.6-sol", "gpt-5.6-sol", "gpt-5.6-sol"] as const)
    : (["gpt-5.6-luna", "gpt-5.6-luna", "gpt-5.6-luna"] as const);

  return {
    runId: `demo_${request.activityId.replaceAll("-", "_")}`,
    activity: activity.public,
    diagnosis: { ...fixture.diagnosis },
    probes: fixture.probes.map((probe) => ({ ...probe })),
    trace: {
      plannerModel: "demo-fixture",
      synthesisModel: "demo-fixture",
      degraded: fallback,
      probes: fixture.probes.map((probe, index) => ({
        role: probe.role,
        model: traceModels[index] ?? "gpt-5.6-luna",
        status: fallback ? "fallback" : "completed",
        latencyMs: [684, 731, 592][index] ?? 600,
        fallbackReason: fallback ? "forced" : null,
      })),
    },
  };
};

export const createDemoReceipt = (rawRequest: ReviseRequest): Receipt => {
  const request = ReviseRequestSchema.parse(rawRequest);
  if (request.mode !== "demo") throw new Error("Demo fixtures require demo mode.");
  const fixture = DEMO_FIXTURES[request.activityId];
  const activity = getActivity(request.activityId);
  if (request.originalResponse !== activity.public.sampleResponse) {
    throw new Error("Guided demo requires the curated sample response.");
  }

  const evaluatedRubric = fixture.receipt.rubric.map((criterion, index) => {
    const match = DEMO_EVIDENCE_PATTERNS[request.activityId][index]?.exec(
      request.revisedResponse,
    );
    return {
      ...criterion,
      after: match ? ("met" as const) : ("missing" as const),
      evidence: match?.[0] ?? null,
    };
  });
  const metCount = evaluatedRubric.filter(({ after }) => after === "met").length;

  return ReceiptSchema.parse({
    activityId: request.activityId,
    repairedHinge: fixture.receipt.repairedHinge,
    summary: `The revision addresses ${metCount} of ${evaluatedRubric.length} visible rubric criteria with traceable text evidence.`,
    changes: [
      {
        label: "Submitted revision",
        before: boundedExcerpt(request.originalResponse),
        after: boundedExcerpt(request.revisedResponse),
      },
    ],
    rubric: evaluatedRubric,
    remainingCaveat:
      metCount === evaluatedRubric.length
        ? fixture.receipt.remainingCaveat
        : "One or more visible criteria still lack direct evidence in this revision.",
    provenance: { model: "demo-fixture", mode: "demo" },
  });
};
