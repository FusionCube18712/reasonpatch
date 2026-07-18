import type { ActivityId } from "./contracts";

export type DemoEvidenceRule = Readonly<{
  supports: RegExp;
  contradicts?: RegExp;
}>;

export type EvaluatedRubric = Readonly<{
  id: string;
  label: string;
  state: "met" | "missing";
  evidence: string | null;
  evidenceIndex: number | null;
}>;

const ADDITIONAL_EVIDENCE_RULE: DemoEvidenceRule = {
  supports:
    /(?:\b(?:need|needs|needed|require|requires|required|would be stronger|should use|could use|before concluding)\b[^.!?\n]{0,100}\b(?:random\w*|control\w*|baseline|comparison|experiment\w*)\b|\b(?:random assignment|controlled comparison|baseline scores?)\b[^.!?\n]{0,60}\b(?:needed|required|stronger|would help)\b)/iu,
  contradicts:
    /(?:\b(?:random\w*|control\w*|baseline|comparison|experiment\w*)\b[^.!?\n]{0,50}\b(?:unnecessary|not needed|irrelevant|does not matter|cannot help)\b|\b(?:no need|need no|do not need|don't need|never need)\b[^.!?\n]{0,60}\b(?:random\w*|control\w*|baseline|comparison|experiment\w*)\b)/iu,
};

const BASE_RATE_RULES: ReadonlyArray<DemoEvidenceRule> = [
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
];

const REPRESENTATIVE_SAMPLE_RULE: DemoEvidenceRule = {
  supports:
    /(?:\b(?:representative|random|stratified)\s+(?:random\s+)?sample\b[^.!?\n]{0,80}\b(?:would be stronger|needed|required|should|could improve)\b|\b(?:need|require|use|draw|select)\b[^.!?\n]{0,80}\b(?:representative|random|stratified)\s+(?:sample|sampling)\b)/iu,
  contradicts:
    /(?:\b(?:representative|random|stratified)\s+(?:random\s+)?sample\b[^.!?\n]{0,50}\b(?:unnecessary|not needed|irrelevant|does not matter)\b|\b(?:need no|do not need|don't need|never need)\b[^.!?\n]{0,60}\b(?:representative|random|stratified)\s+(?:sample|sampling)\b)/iu,
};

export const TRANSFER_EVIDENCE_RULES: Readonly<
  Record<ActivityId, ReadonlyArray<DemoEvidenceRule>>
> = {
  "correlation-causation": [
    {
      supports:
        /(?:\b(?:recovery difference|faster recovery|patients?[^.!?\n]{0,60}(?:recover(?:y|ed)?|difference))\b[^.!?\n]{0,100}\b(?:does not|cannot|is not enough to)\s+(?:establish|prove|show|imply|support|conclude)\s+causation\b|\bpatients?\b[^\n]{0,100}\brecover(?:y|ed)?\b[^\n]{0,100}\bdifference\b[^.!?\n]{0,80}\b(?:does not|cannot|is not enough to)\s+(?:establish|prove|show|imply|support|conclude)\s+causation\b)/iu,
      contradicts:
        /\b(?:association|difference|gap)[^.!?\n]{0,80}\b(?:proves?|establishes?|shows?|implies?|supports?)\s+causation\b/iu,
    },
    {
      supports:
        /(?:\bpatients?\b[^.!?\n]{0,80}\b(?:chose|choose)\s+whether\s+to\s+join\b(?=\s*(?:[.,;!?]|$))|\bpatients?\b[^.!?\n]{0,80}\b(?:chose|choose|voluntar\w*|self[- ]selected)\b[^.!?\n]{0,60}\b(?:join|enroll|participat\w*)\b[^.!?\n]{0,60}\b(?:nutrition|hospital)\s+program\b|\bself[- ]selection\b[^.!?\n]{0,90}\b(?:nutrition program|hospital program)\b)/iu,
      contradicts:
        /(?:\bpatients?\b[^.!?\n]{0,80}\b(?:did\s+not|didn't|never|could\s+not|couldn't|were\s+not\s+allowed\s+to)\s+(?:choose|chose|join|enroll|participat\w*)\b|\b(?:there is|there was|has|had)\s+no\s+(?:plausible\s+)?confound|\b(?:self[- ]selection|confound\w*)\b[^.!?\n]{0,50}\b(?:is|was)?\s*(?:irrelevant|not relevant)|\b(?:self[- ]selection|confound\w*)\b[^.!?\n]{0,50}\b(?:does not|cannot|is not)\s+(?:matter|exist|affect|explain))/iu,
    },
    ADDITIONAL_EVIDENCE_RULE,
  ],
  "base-rate-neglect": BASE_RATE_RULES,
  "sampling-bias": [
    {
      supports:
        /(?:\b(?:dining(?:[- ]hall)?|qr[- ]code|later[- ]hours)\b[^.!?\n]{0,180}\btarget population\b[^.!?\n]{0,100}\ball students\b|\btarget population\b[^.!?\n]{0,100}\ball students\b[^.!?\n]{0,180}\b(?:dining(?:[- ]hall)?|qr[- ]code|later[- ]hours)\b)/iu,
    },
    {
      supports:
        /(?:\b(?:dining(?:[- ]hall)?(?:\s+visitors?)?|qr[- ]code(?:\s+respondents?)?)\b[^.!?\n]{0,120}\b(?:chose|choose)\s+whether\s+to\s+(?:answer|respond)\b(?=\s*(?:[.,;!?]|$))|\b(?:dining(?:[- ]hall)?(?:\s+visitors?)?|qr[- ]code(?:\s+respondents?)?)\b[^.!?\n]{0,120}\b(?:chose|choose|voluntar\w*|self[- ]select\w*)\b[^.!?\n]{0,50}\b(?:answer|respond|participat\w*)\b[^.!?\n]{0,50}\b(?:poll|survey|qr[- ]code)\b|\b(?:poll|sample|respondents?)\b[^.!?\n]{0,140}\b(?:dining(?:[- ]hall)?|qr[- ]code)\b[^.!?\n]{0,140}\b(?:bias(?:ed)?|not represent\w*|self[- ]select\w*)\b)/iu,
      contradicts:
        /(?:\b(?:dining(?:[- ]hall)?(?:\s+visitors?)?|qr[- ]code(?:\s+respondents?)?)\b[^.!?\n]{0,100}\b(?:did\s+not|didn't|never|could\s+not|couldn't|were\s+not\s+allowed\s+to)\s+(?:choose|chose|answer|respond|participat\w*)\b|\b(?:voluntary|self[- ]select\w*)\b[^.!?\n]{0,60}\b(?:cannot|can't|does not|doesn't|not)\s+(?:be\s+)?(?:biased|bias|matter)|\bno\s+(?:voluntary-response\s+)?bias\b)/iu,
    },
    REPRESENTATIVE_SAMPLE_RULE,
  ],
};

type TransferContextRules = Readonly<{
  freshAnchors: ReadonlyArray<RegExp>;
  minimumFreshAnchors: number;
  staleContext?: RegExp;
}>;

const TRANSFER_CONTEXT_RULES: Readonly<
  Record<ActivityId, TransferContextRules>
> = {
  "correlation-causation": {
    minimumFreshAnchors: 2,
    freshAnchors: [
      /\b(?:patients?|hospital)\b/iu,
      /\b(?:recover(?:y|ed)?|two days faster)\b/iu,
      /\b(?:nutrition program|hospital nutrition)\b/iu,
    ],
    staleContext: /\b(?:tutoring|eight points?|school|students?)\b/iu,
  },
  "base-rate-neglect": {
    minimumFreshAnchors: 2,
    freshAnchors: [
      /\b(?:screening|screening test)\b/iu,
      /\bsecond\s+(?:rare\s+)?condition\b/iu,
      /(?:\b(?:1\s+in\s+2,?000|one\s+in\s+two\s+thousand|1\s*\/\s*2,?000)\b|\b0?\.05\s*(?:percent\b|%))/iu,
      /(?:\b98\s*(?:percent\b|%)|\b2\s*(?:percent\b|%)\s+false[- ]positive\b)/iu,
    ],
  },
  "sampling-bias": {
    minimumFreshAnchors: 1,
    freshAnchors: [
      /\bdining(?:\s+hall|\s+service)?s?\b/iu,
      /\bqr[- ]code\b/iu,
      /(?:\blater[- ]hours\b|\b76\s*(?:percent\b|%))/iu,
    ],
    staleContext:
      /(?:\b(?:campus newspaper|online newspaper|lectures? recorded|recorded lectures?)\b|\b82\s*(?:percent\b|%))/iu,
  },
};

const ORIGINAL_BASE_RATE =
  /(?:\b(?:1\s+in\s+1,?000|one\s+in\s+one\s+thousand|1\s*\/\s*1,?000)\b|\b0?\.1\s*(?:percent\b|%))/iu;
const FRESH_BASE_RATE =
  /(?:\b(?:1\s+in\s+2,?000|one\s+in\s+two\s+thousand|1\s*\/\s*2,?000)\b|\b0?\.05\s*(?:percent\b|%))/iu;
const AFFIRMATIVE_FRESH_BASE_RATE =
  /(?:^|[.!?;]\s+)(?:(?:for this screening|for the second (?:rare )?condition|actually|instead),?\s+)?(?:the\s+)?(?:base rate|prevalence)\s+(?:is|equals?|of)\s+(?:1\s+in\s+2,?000|one\s+in\s+two\s+thousand|1\s*\/\s*2,?000|0?\.05\s*(?:percent\b|%))(?=\s*(?:[.;]|$))/imu;
const CORRECT_BASE_RATE_CORRECTION =
  /(?:^|[.!?;]\s+)(?:(?:for this screening|for the second (?:rare )?condition),?\s+)?(?:the\s+)?(?:base rate|prevalence)\s+(?:is|equals?|of)\s+(?:1\s+in\s+2,?000|one\s+in\s+two\s+thousand|1\s*\/\s*2,?000|0?\.05\s*(?:percent\b|%))\s*,?\s*(?:not|rather than|instead of)\s+(?:1\s+in\s+1,?000|one\s+in\s+one\s+thousand|1\s*\/\s*1,?000|0?\.1\s*(?:percent\b|%))(?=\s*(?:[.;]|$))/imu;

const findAnchorPositions = (
  response: string,
  anchors: ReadonlyArray<RegExp>,
): ReadonlyArray<number> =>
  anchors.flatMap((anchor) => {
    const match = anchor.exec(response);
    return match?.index === undefined ? [] : [match.index];
  });

const evidenceIsNearFreshContext = (
  evidencePosition: number,
  anchorPositions: ReadonlyArray<number>,
): boolean =>
  evidencePosition >= 0 &&
  anchorPositions.some(
    (anchorPosition) => Math.abs(anchorPosition - evidencePosition) <= 420,
  );

const baseAssertionIsRejected = (
  response: string,
  assertionEnd: number,
): boolean =>
  /^\s*(?:[.,;]\s*)?(?:(?:but|however)\b[^.!?;\n]{0,80}\b(?:wrong|false|incorrect)\b|(?:(?:that|this)\s+)?(?:claim|statement|value|rate)?\s*(?:is|was)\s+(?:wrong|false|incorrect)\b|no\b)/iu.test(
    response.slice(assertionEnd, assertionEnd + 120),
  );

export const groundTransferRubric = (
  activityId: ActivityId,
  response: string,
  evaluatedRubric: ReadonlyArray<EvaluatedRubric>,
): ReadonlyArray<EvaluatedRubric> => {
  const contextRules = TRANSFER_CONTEXT_RULES[activityId];
  const anchorPositions = findAnchorPositions(response, contextRules.freshAnchors);
  const hasEnoughFreshAnchors =
    anchorPositions.length >= contextRules.minimumFreshAnchors;
  const hasStaleContext = contextRules.staleContext?.test(response) ?? false;
  const freshBaseRateAssertion =
    activityId === "base-rate-neglect"
      ? AFFIRMATIVE_FRESH_BASE_RATE.exec(response)
      : null;
  const staleBaseRate =
    activityId === "base-rate-neglect" && ORIGINAL_BASE_RATE.test(response);
  const freshBaseRateCorrection = staleBaseRate
    ? CORRECT_BASE_RATE_CORRECTION.exec(response)
    : null;
  const acceptedFreshBaseSource = staleBaseRate
    ? freshBaseRateCorrection &&
      !baseAssertionIsRejected(
        response,
        freshBaseRateCorrection.index + freshBaseRateCorrection[0].length,
      )
      ? freshBaseRateCorrection
      : null
    : freshBaseRateAssertion &&
        !baseAssertionIsRejected(
          response,
          freshBaseRateAssertion.index + freshBaseRateAssertion[0].length,
        )
      ? freshBaseRateAssertion
      : null;
  const freshBaseRate =
    acceptedFreshBaseSource === null
      ? null
      : FRESH_BASE_RATE.exec(acceptedFreshBaseSource[0]);

  return evaluatedRubric.map((criterion) => {
    if (!hasEnoughFreshAnchors || hasStaleContext || criterion.state === "missing") {
      return {
        ...criterion,
        state: "missing" as const,
        evidence: null,
        evidenceIndex: null,
      };
    }

    if (activityId === "base-rate-neglect" && criterion.id === "association-causation") {
      if (freshBaseRate) {
        return {
          ...criterion,
          state: "met" as const,
          evidence: freshBaseRate[0],
          evidenceIndex:
            (acceptedFreshBaseSource?.index ?? 0) + freshBaseRate.index,
        };
      }
      if (staleBaseRate) {
        return {
          ...criterion,
          state: "missing" as const,
          evidence: null,
          evidenceIndex: null,
        };
      }
    }

    if (
      criterion.evidence === null ||
      criterion.evidenceIndex === null ||
      !evidenceIsNearFreshContext(criterion.evidenceIndex, anchorPositions)
    ) {
      return {
        ...criterion,
        state: "missing" as const,
        evidence: null,
        evidenceIndex: null,
      };
    }

    return { ...criterion };
  });
};
