import { getActivity } from "./activities";
import {
  AnalyzeRequestSchema,
  ReceiptSchema,
  ReviseRequestSchema,
  TransferRequestSchema,
  TransferSlipSchema,
  type AnalysisResult,
  type ActivityId,
  type AnalyzeRequest,
  type ProbeOutput,
  type Receipt,
  type ReviseRequest,
  type SynthesisOutput,
  type TransferRequest,
  type TransferSlip,
} from "./contracts";
import {
  TRANSFER_EVIDENCE_RULES,
  groundTransferRubric,
  type DemoEvidenceRule,
  type EvaluatedRubric,
} from "./transfer-evaluator";

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
    limitation:
      "The prompt does not provide baseline motivation or prior scores.",
  },
  {
    role: "assumption",
    finding:
      "The causal claim assumes participants and non-participants were comparable before tutoring.",
    evidenceQuote:
      "The tutoring program caused the improvement because participants scored eight points higher.",
    coachingMove:
      "Ask what would need to be true about the groups before tutoring.",
    confidence: 0.91,
    limitation: "Unreported study details could change the diagnosis.",
  },
  {
    role: "rubric",
    finding:
      "The response states a causal conclusion but provides no confounder or stronger comparison evidence.",
    evidenceQuote: "Therefore every school should use it.",
    coachingMove:
      "Connect the claim to each visible rubric criterion before revising.",
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
    limitation:
      "The phrase '99% accurate' combines two different test properties in ordinary speech.",
  },
  {
    role: "assumption",
    finding:
      "The response assumes test accuracy equals the probability of illness after a positive.",
    evidenceQuote: "has a 99% chance of having the condition",
    coachingMove:
      "Ask where the population prevalence appears in the calculation.",
    confidence: 0.93,
    limitation:
      "The learner may know the base rate but have omitted it from the explanation.",
  },
  {
    role: "rubric",
    finding:
      "The explanation uses neither the base rate nor a true-positive/false-positive comparison.",
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
    coachingMove:
      "Imagine who was most likely to notice and answer the newspaper poll.",
    confidence: 0.92,
    limitation: "The poll's recruitment details beyond the prompt are unknown.",
  },
  {
    role: "assumption",
    finding:
      "The conclusion assumes a large sample is automatically representative of all students.",
    evidenceQuote: "the poll proves most students",
    coachingMove:
      "Separate sample size from the way participants entered the sample.",
    confidence: 0.94,
    limitation: "The learner may have omitted an intended qualification.",
  },
  {
    role: "rubric",
    finding:
      "The response does not define the target population or discuss voluntary-response bias.",
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
    {
      id: "association-causation",
      state: "emerging",
      evidence: "most students",
    },
    { id: "confounder", state: "missing", evidence: null },
    { id: "additional-evidence", state: "missing", evidence: null },
  ],
  limitation: "AI-generated challenge, not a grade or verdict.",
};

const correlationReceipt: DemoFixture["receipt"] = {
  repairedHinge: "Association is not causation",
  summary:
    "The submitted response now qualifies the causal claim, introduces self-selection, and asks for stronger comparison evidence.",
  changes: [
    {
      label: "Causal claim",
      before: "The tutoring program caused the improvement.",
      after: "The difference alone does not establish causation.",
    },
    {
      label: "Evidence standard",
      before: null,
      after:
        "Comparable baselines, random assignment, or a well-controlled comparison are needed.",
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
      evidence:
        "comparable baseline scores and random assignment or a controlled comparison",
    },
  ],
  remainingCaveat:
    "The submitted response identifies what evidence is needed; it does not establish whether the program works.",
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
        "The submitted response now brings the rare base rate into the positive-result comparison and distinguishes true from false positives.",
      changes: [
        {
          label: "Probability direction",
          before: "A positive means a 99% chance of the condition.",
          after:
            "Test sensitivity alone does not determine the probability after a positive.",
        },
        {
          label: "Missing denominator",
          before: null,
          after:
            "True positives must be compared with false positives in the tested population.",
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
      remainingCaveat:
        "The submitted response sets up the comparison; it does not show the final arithmetic.",
    },
  },
  "sampling-bias": {
    diagnosis: samplingDiagnosis,
    probes: samplingProbes,
    receipt: {
      repairedHinge: "Size is not representativeness",
      summary:
        "The submitted response now separates the number of responses from the way respondents entered the sample.",
      changes: [
        {
          label: "Sample claim",
          before: "Hundreds of answers prove what most students want.",
          after:
            "A large voluntary sample can still misrepresent the campus population.",
        },
        {
          label: "Selection method",
          before: null,
          after:
            "A representative random sample would support a stronger campus-wide estimate.",
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
      remainingCaveat:
        "The submitted response improves the inference but does not estimate actual campus opinion.",
    },
  },
};

const DEMO_EVIDENCE_RULES: Readonly<
  Record<ActivityId, ReadonlyArray<DemoEvidenceRule>>
> = {
  "correlation-causation": [
    {
      supports:
        /\b(?:association|difference|gap)[^.!?\n]{0,100}\b(?:does not|cannot|is not enough to)\s+(?:establish|prove|show|imply|support|conclude)\s+causation\b/iu,
      contradicts:
        /\b(?:association|difference|gap)[^.!?\n]{0,80}\b(?:proves?|establishes?|shows?|implies?|supports?)\s+causation\b/iu,
    },
    {
      supports:
        /(?:\bself[- ]selection\b[^.!?\n]{0,80}\b(?:could|may|might|can|bias(?:es)?|affect|explain|limit|undermine)|\b(?:students|patients|participants|people)[^.!?\n]{0,60}\b(?:chose|choose|chosen|self[- ]selected)\b|\bmotivat\w*[^.!?\n]{0,60}\b(?:could|may|might|can|affect|explain|differ|chose|choose|chosen)\b|\bconfound(?:er|ing)?\b[^.!?\n]{0,80}\b(?:could|may|might|can|affect|explain|bias))/iu,
      contradicts:
        /(?:\b(?:there is|there was|has|had)\s+no\s+(?:plausible\s+)?confound|\b(?:self[- ]selection|confound\w*)\b[^.!?\n]{0,50}\b(?:is|was)?\s*(?:irrelevant|not relevant)|\b(?:self[- ]selection|confound\w*)\b[^.!?\n]{0,50}\b(?:does not|cannot|is not)\s+(?:matter|exist|affect|explain))/iu,
    },
    {
      supports:
        /(?:\b(?:need|needs|needed|require|requires|required|would be stronger|should use|could use|before concluding)\b[^.!?\n]{0,100}\b(?:random\w*|control\w*|baseline|comparison|experiment\w*)\b|\b(?:random assignment|controlled comparison|baseline scores?)\b[^.!?\n]{0,60}\b(?:needed|required|stronger|would help)\b)/iu,
      contradicts:
        /(?:\b(?:random\w*|control\w*|baseline|comparison|experiment\w*)\b[^.!?\n]{0,50}\b(?:unnecessary|not needed|irrelevant|does not matter|cannot help)\b|\b(?:no need|need no|do not need|don't need|never need)\b[^.!?\n]{0,60}\b(?:random\w*|control\w*|baseline|comparison|experiment\w*)\b)/iu,
    },
  ],
  "base-rate-neglect": [
    {
      supports:
        /(?:\b(?:base rate|prevalence|rare (?:condition|disease))\b[^.!?\n]{0,100}\b(?:include|included|consider|matters|important|must|before interpreting)\b|\b(?:base rate|prevalence)\s+(?:is|of)\s+(?:1\s+in\s+(?:1,?000|2,?000)\b|0?\.(?:05|1)\s*(?:%|percent)\b|rare\b|low\b))/iu,
      contradicts:
        /(?:\b(?:base rate|prevalence)\b[^.!?\n]{0,50}\b(?:does not|doesn't|cannot)\s+(?:matter|need|affect)|\b(?:ignore|ignored)\b[^.!?\n]{0,50}\b(?:base rate|prevalence)\b|\b(?:base rate|prevalence)\s+(?:is|of)\s+(?:[2-9]\d(?:\.\d+)?|1\d(?:\.\d+)?)\s*(?:%|percent)\b)/iu,
    },
    {
      supports:
        /(?:\b(?:compare|count|expect|calculate)\b[^.!?\n]{0,120}\btrue positives?\b[^.!?\n]{0,100}\bfalse positives?\b|\btrue positives?\b[^.!?\n]{0,80}\b(?:with|and|versus|vs\.?)\b[^.!?\n]{0,80}\bfalse positives?\b)/iu,
      contradicts:
        /(?:\b(?:ignore|ignored|irrelevant)\b[^.!?\n]{0,50}\b(?:true|false) positives?\b|\b(?:true|false) positives?\b[^.!?\n]{0,50}\b(?:ignore|ignored|irrelevant|do not matter|don't matter)\b|\b(?:do not|don't|never|need not)\s+(?:compare|count|expect|calculate)\b[^.!?\n]{0,100}\b(?:true|false) positives?\b)/iu,
    },
    {
      supports:
        /(?:\b(?:among|given|after)\s+(?:the\s+)?positive(?:\s+results?)?\b|\bposterior\b|\bprobability\s+(?:after|given)\s+(?:a\s+)?positive\b)/iu,
      contradicts:
        /(?:\bpositive result\b[^.!?\n]{0,60}\b(?:definitely|certainly|must be)\b[^.!?\n]{0,30}\b\d{1,3}\s*(?:%|percent)\b|\b(?:ignore|do not use|don't use|need not use)\b[^.!?\n]{0,60}\b(?:probability|chance)\b[^.!?\n]{0,60}\b(?:given|among|after)\b[^.!?\n]{0,30}\bpositive\b)/iu,
    },
  ],
  "sampling-bias": [
    {
      supports:
        /(?:\b(?:target population (?:is|includes|covers)|claim (?:is|was) about|conclusion (?:is|was) about)[^.!?\n]{0,80}\b(?:all students|campus population)\b|\bcampus population\s+includes\s+all students\b|\ball students\b[^.!?\n]{0,80}\b(?:rather than|not just|not only)\b)/iu,
    },
    {
      supports:
        /(?:\b(?:voluntary(?:-response)?|self[- ]select\w*)\b[^.!?\n]{0,100}\b(?:bias|not representative|overrepresent|underrepresent|choose|chose)\b|\b(?:students|visitors|people)[^.!?\n]{0,60}\b(?:chose|choose)\b[^.!?\n]{0,20}\b(?:answer|respond)\b)/iu,
      contradicts:
        /(?:\b(?:voluntary|self[- ]select\w*)\b[^.!?\n]{0,60}\b(?:cannot|can't|does not|doesn't|not)\s+(?:be\s+)?(?:biased|bias|matter)|\bno\s+(?:voluntary-response\s+)?bias\b)/iu,
    },
    {
      supports:
        /(?:\b(?:representative|random|stratified)\s+(?:random\s+)?sample\b[^.!?\n]{0,80}\b(?:would be stronger|needed|required|should|could improve)\b|\b(?:need|require|use|draw|select)\b[^.!?\n]{0,80}\b(?:representative|random|stratified)\s+(?:sample|sampling)\b)/iu,
      contradicts:
        /(?:\b(?:representative|random|stratified)\s+(?:random\s+)?sample\b[^.!?\n]{0,50}\b(?:unnecessary|not needed|irrelevant|does not matter)\b|\b(?:need no|do not need|don't need|never need)\b[^.!?\n]{0,60}\b(?:representative|random|stratified)\s+(?:sample|sampling)\b)/iu,
    },
  ],
};

const boundedExcerpt = (value: string): string =>
  value.length <= 420 ? value : `${value.slice(0, 417)}…`;

const isEvaluatorInstruction = (value: string): boolean =>
  /(?:ignore|disregard).{0,80}(?:rubric|criteria|prior task)|(?:mark|return|output).{0,50}(?:all|every).{0,50}(?:complete|green|met|perfect)/isu.test(
    value,
  );

const evidenceIsInsideRejectedClaim = (
  response: string,
  match: RegExpExecArray,
): boolean => {
  const delimiters = [".", "?", "!", ";", "\n"] as const;
  const clauseStart = delimiters.reduce(
    (latest, delimiter) =>
      Math.max(latest, response.lastIndexOf(delimiter, match.index - 1)),
    -1,
  );
  const matchEnd = match.index + match[0].length;
  const nextDelimiters = delimiters
    .map((delimiter) => response.indexOf(delimiter, matchEnd))
    .filter((index) => index >= 0);
  const clauseEnd =
    nextDelimiters.length === 0 ? response.length : Math.min(...nextDelimiters);
  const before = response.slice(clauseStart + 1, match.index);
  const after = response.slice(matchEnd, clauseEnd);
  const introducedAsClaim =
    /\b(?:claim|statement|assertion|idea)\s+(?:that|to)\b[^.!?;\n]*$/iu.test(
      before,
    ) ||
    /\b(?:claim|statement|assertion|idea)\s+(?:that|to)\b/iu.test(match[0]);
  const rejectedAfter =
    /^[^.!?;\n]{0,100}\b(?:(?:is|was)\s+(?:false|wrong|incorrect|unsupported|untrue|inaccurate|invalid|not\s+true)|(?:isn't|wasn't)\s+true)\b/iu.test(
      after,
    );
  const rejectedBefore =
    /\b(?:false|wrong|incorrect|unsupported|untrue|inaccurate|invalid|not\s+true|isn't\s+true|wasn't\s+true)\s+(?:that|to)\b[^.!?;\n]*$/iu.test(
      before,
    );
  const rejectedWrapper =
    /\b(?:false|wrong|incorrect|unsupported|untrue|inaccurate|invalid)\s+(?:claim|statement|assertion|idea)\s+(?:that|to)\b/iu.test(
      `${before}${match[0]}`,
    );

  return (introducedAsClaim && rejectedAfter) || rejectedBefore || rejectedWrapper;
};

const evidenceHasDisallowedPolarity = (
  activityId: ActivityId,
  criterionId: string,
  response: string,
  match: RegExpExecArray,
): boolean => {
  const matchEnd = match.index + match[0].length;
  const clauseStart = Math.max(
    response.lastIndexOf(".", match.index - 1),
    response.lastIndexOf("?", match.index - 1),
    response.lastIndexOf("!", match.index - 1),
    response.lastIndexOf(";", match.index - 1),
    response.lastIndexOf("\n", match.index - 1),
  );
  const nextBoundary = [".", "?", "!", ";", "\n"]
    .map((delimiter) => response.indexOf(delimiter, matchEnd))
    .filter((index) => index >= 0)
    .sort((left, right) => left - right)[0] ?? response.length;
  const clauseBefore = response.slice(clauseStart + 1, match.index);
  const after = response.slice(matchEnd, Math.min(nextBoundary, matchEnd + 100));
  const allowedMatch =
    activityId === "correlation-causation" &&
    criterionId === "association-causation"
      ? match[0].replace(
          /\b(?:does not|cannot|is not enough to)\s+(?:establish|prove|show|imply|support|conclude)\s+causation\b/giu,
          "",
        )
      : activityId === "sampling-bias" && criterionId === "confounder"
        ? match[0].replace(/\bnot represent\w*\b/giu, "")
        : match[0];
  const negatedInside =
    /\b(?:not|never|isn't|wasn't|wouldn't|shouldn't|cannot|can't)\b/iu.test(
      allowedMatch,
    );
  const allowedBefore = clauseBefore
    .replace(
      /\b(?:does not|cannot|is not enough to)\s+(?:establish|prove|show|imply|support|conclude)\s+causation\b/giu,
      "",
    )
    .replace(/\bnot represent\w*\b/giu, "");
  const negatedBefore =
    /\b(?:not|never|isn't|wasn't|do not|don't|cannot|can't)\b[^.!?;\n]*$/iu.test(
      allowedBefore,
    );
  const rejectedAfter =
    /^[^.!?;\n]{0,60}\b(?:(?:is|was|would be)\s+(?:wrong|false|incorrect|unsupported|untrue|inaccurate|invalid|unnecessary|not\s+(?:true|needed|stronger))|(?:isn't|wasn't)\s+true)\b/iu.test(
      after,
    );

  return negatedInside || negatedBefore || rejectedAfter;
};

const nextEvidenceBoundary = (
  response: string,
  matchEnd: number,
): Readonly<{ index: number; delimiter: string }> | null => {
  const candidates = [".", "?", "!", ";", "\n"]
    .map((delimiter) => ({ index: response.indexOf(delimiter, matchEnd), delimiter }))
    .filter(({ index }) => index >= 0)
    .sort((left, right) => left.index - right.index);
  return candidates[0] ?? null;
};

const evidenceIsInterrogative = (
  response: string,
  match: RegExpExecArray,
): boolean =>
  nextEvidenceBoundary(response, match.index + match[0].length)?.delimiter === "?";

const evidenceIsInsideQuestionFrame = (
  response: string,
  match: RegExpExecArray,
): boolean => {
  const clauseStart = Math.max(
    response.lastIndexOf(".", match.index - 1),
    response.lastIndexOf("?", match.index - 1),
    response.lastIndexOf("!", match.index - 1),
    response.lastIndexOf(";", match.index - 1),
    response.lastIndexOf("\n", match.index - 1),
  );
  const frame = `${response.slice(clauseStart + 1, match.index)}${match[0]}`;
  return /\b(?:question|issue|uncertainty)\s+(?:(?:is|was|remains?)\s+)?(?:whether|if)\b/iu.test(
    frame,
  );
};

const evidenceIsRejectedByFollowingSentence = (
  response: string,
  match: RegExpExecArray,
): boolean => {
  const boundary = nextEvidenceBoundary(
    response,
    match.index + match[0].length,
  );
  if (!boundary) return false;
  const following = response.slice(boundary.index, boundary.index + 140);
  return /^\s*[.!;]\s*(?:that|this)\s+(?:(?:claim|statement|comparison|idea|inference|conclusion)\s+)?(?:(?:is|was)\s+(?:false|wrong|incorrect|unsupported|untrue|inaccurate|invalid|not\s+true)|(?:isn't|wasn't)\s+true)\b/iu.test(
    following,
  );
};

const findSupportMatches = (
  pattern: RegExp,
  response: string,
): ReadonlyArray<RegExpExecArray> => {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  const matcher = new RegExp(pattern.source, flags);
  return [...response.matchAll(matcher)] as ReadonlyArray<RegExpExecArray>;
};

const evaluateRubric = (
  activityId: ActivityId,
  response: string,
  rules: Readonly<Record<ActivityId, ReadonlyArray<DemoEvidenceRule>>>,
): ReadonlyArray<EvaluatedRubric> => {
  const fixture = DEMO_FIXTURES[activityId];
  const evaluatorInstruction = isEvaluatorInstruction(response);

  return fixture.receipt.rubric.map((criterion, index) => {
    const rule = rules[activityId][index];
    const contradicted = rule?.contradicts?.test(response) ?? false;
    const candidateMatches =
      evaluatorInstruction || contradicted || !rule
        ? []
        : findSupportMatches(rule.supports, response);
    const match = candidateMatches.find(
      (candidateMatch) =>
        !evidenceIsInsideRejectedClaim(response, candidateMatch) &&
        !evidenceHasDisallowedPolarity(
          activityId,
          criterion.id,
          response,
          candidateMatch,
        ) &&
        !evidenceIsInterrogative(response, candidateMatch) &&
        !evidenceIsInsideQuestionFrame(response, candidateMatch) &&
        !evidenceIsRejectedByFollowingSentence(response, candidateMatch),
    );
    return {
      id: criterion.id,
      label: criterion.label,
      state: match ? ("met" as const) : ("missing" as const),
      evidence: match?.[0] ?? null,
      evidenceIndex: match?.index ?? null,
    };
  });
};

const evaluateDemoRubric = (
  activityId: ActivityId,
  response: string,
): ReadonlyArray<EvaluatedRubric> =>
  evaluateRubric(activityId, response, DEMO_EVIDENCE_RULES);

const evaluateTransferRubric = (
  activityId: ActivityId,
  response: string,
): ReadonlyArray<EvaluatedRubric> =>
  evaluateRubric(activityId, response, TRANSFER_EVIDENCE_RULES);

export const createDemoAnalysis = (
  rawRequest: AnalyzeRequest,
): AnalysisResult => {
  const request = AnalyzeRequestSchema.parse(rawRequest);
  if (request.mode !== "demo")
    throw new Error("Demo fixtures require demo mode.");

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
  if (request.mode !== "demo")
    throw new Error("Demo fixtures require demo mode.");
  const fixture = DEMO_FIXTURES[request.activityId];
  const activity = getActivity(request.activityId);
  if (request.originalResponse !== activity.public.sampleResponse) {
    throw new Error("Guided demo requires the curated sample response.");
  }

  const evaluatedRubric = evaluateDemoRubric(
    request.activityId,
    request.revisedResponse,
  ).map((criterion, index) => ({
    ...fixture.receipt.rubric[index],
    after: criterion.state,
    evidence: criterion.evidence,
  }));
  const metCount = evaluatedRubric.filter(
    ({ after }) => after === "met",
  ).length;

  return ReceiptSchema.parse({
    activityId: request.activityId,
    repairedHinge: fixture.receipt.repairedHinge,
    summary: `The submitted response addresses ${metCount} of ${evaluatedRubric.length} visible rubric criteria with traceable text evidence.`,
    changes: [
      {
        label: "Submitted response",
        before: boundedExcerpt(request.originalResponse),
        after: boundedExcerpt(request.revisedResponse),
      },
    ],
    rubric: evaluatedRubric,
    remainingCaveat:
      metCount === evaluatedRubric.length
        ? fixture.receipt.remainingCaveat
        : "One or more visible criteria still lack direct evidence in this response.",
    provenance: { model: "demo-fixture", mode: "demo" },
  });
};

export const createDemoTransferSlip = (
  rawRequest: TransferRequest,
): TransferSlip => {
  const request = TransferRequestSchema.parse(rawRequest);
  const evaluatedRubric = evaluateTransferRubric(
    request.activityId,
    request.response,
  );
  const rubric = groundTransferRubric(
    request.activityId,
    request.response,
    evaluatedRubric,
  );
  const publicRubric = rubric.map(({ id, label, state, evidence }) => ({
    id,
    label,
    state,
    evidence,
  }));
  const metCount = publicRubric.filter(({ state }) => state === "met").length;

  return TransferSlipSchema.parse({
    activityId: request.activityId,
    summary: `The fresh-case response contains candidate evidence for ${metCount} of ${publicRubric.length} visible rubric criteria.`,
    rubric: publicRubric,
    remainingCaveat:
      metCount === publicRubric.length
        ? "This immediate scan is not a delayed or validated measure of learning."
        : "One or more visible criteria still lack direct evidence in this fresh-case response.",
    provenance: { model: "demo-fixture", mode: "demo" },
  });
};
