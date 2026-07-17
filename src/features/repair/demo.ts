import { getActivity } from "./activities";
import {
  AnalyzeRequestSchema,
  ReceiptSchema,
  ReviseRequestSchema,
  type AnalysisResult,
  type AnalyzeRequest,
  type ProbeOutput,
  type Receipt,
  type ReviseRequest,
  type SynthesisOutput,
} from "./contracts";

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

export const createDemoAnalysis = (rawRequest: AnalyzeRequest): AnalysisResult => {
  const request = AnalyzeRequestSchema.parse(rawRequest);
  if (request.mode !== "demo") throw new Error("Demo fixtures require demo mode.");

  const activity = getActivity(request.activityId);
  const fallback = request.forceLunaFallback;
  const traceModels = fallback
    ? (["gpt-5.6-sol", "gpt-5.6-sol", "gpt-5.6-sol"] as const)
    : (["gpt-5.6-luna", "gpt-5.6-luna", "gpt-5.6-luna"] as const);

  return {
    runId: `demo_${request.activityId.replaceAll("-", "_")}`,
    activity: activity.public,
    diagnosis: correlationDiagnosis,
    probes: correlationProbes.map((probe) => ({ ...probe })),
    trace: {
      plannerModel: "demo-fixture",
      synthesisModel: "demo-fixture",
      degraded: fallback,
      probes: correlationProbes.map((probe, index) => ({
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

  return ReceiptSchema.parse({
    activityId: request.activityId,
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
    provenance: { model: "gpt-5.6-sol", mode: "demo" },
  });
};
