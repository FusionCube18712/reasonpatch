type ScenarioId =
  | "logic-negation-introduction"
  | "algebra-square-branches"
  | "python-empty-aggregate"
  | "causal-observational-claim";

type Criterion = Readonly<{
  id: string;
  label: string;
  state: "met" | "missing";
  evidence: string | null;
}>;

export type ScenarioEvaluation = Readonly<{
  status: "evidence-observed" | "needs-work";
  summary: string;
  criteria: ReadonlyArray<Criterion>;
  provenance: Readonly<{
    source: "deterministic-verifier";
    scope: "guided-scenario-only";
    scenarioId: ScenarioId;
  }>;
}>;

type Rule = Readonly<{
  id: string;
  label: string;
  supports: RegExp;
  contradicts?: RegExp;
}>;

type RuleSet = Readonly<{
  freshContext?: Readonly<{
    anchors: ReadonlyArray<RegExp>;
    stale?: RegExp;
  }>;
  rules: ReadonlyArray<Rule>;
}>;

const SCENARIO_IDS = new Set<string>([
  "logic-negation-introduction",
  "algebra-square-branches",
  "python-empty-aggregate",
  "causal-observational-claim",
]);

const revisionRules: Readonly<Record<ScenarioId, RuleSet>> = {
  "logic-negation-introduction": {
    rules: [
      {
        id: "scoped-assumption",
        label: "Opens the conjunction as a scoped assumption",
        supports: /(?:\|\s*)?p\s*∧\s*q[^\n]{0,40}\bassumption\b/iu,
        contradicts:
          /(?:p\s*∧\s*q[^.!?\n]{0,50}\b(?:is\s+not|isn't|not\s+an?)\s+assumption\b|\b(?:do\s+not|don't|never)\s+(?:assume|suppose)[^.!?\n]{0,40}p\s*∧\s*q)/iu,
      },
      {
        id: "explicit-contradiction",
        label: "Derives an explicit contradiction",
        supports: /(?:⊥[^\n]{0,40}(?:¬e|contradict)|\bcontradiction\b)/iu,
        contradicts:
          /(?:\b(?:cannot|can't|does not|doesn't|never)\b[^.!?\n]{0,60}\b(?:derive|reach|obtain|yield)[^.!?\n]{0,30}\bcontradiction\b|\bno\s+contradiction\b|\bcontradiction\b[^.!?\n]{0,35}\b(?:cannot|can't|is not|isn't)\b)/iu,
      },
      {
        id: "negation-introduction",
        label: "Discharges the full subproof with negation introduction",
        supports: /(?:¬i\s*2\s*[-–]\s*4|negation introduction[^\n]{0,60}(?:2\s*[-–]\s*4|subproof))/iu,
        contradicts:
          /(?:¬i\s*2\s*[-–]\s*4[^.!?\n]{0,35}\b(?:invalid|wrong|unsupported)\b|\b(?:do\s+not|don't|never|should\s+not|shouldn't)\b[^.!?\n]{0,60}\b(?:discharg|negation\s+introduction|¬i)\b)/iu,
      },
    ],
  },
  "algebra-square-branches": {
    rules: [
      {
        id: "positive-solution",
        label: "Includes the positive solution",
        supports: /\bx\s*=\s*3\b/iu,
        contradicts:
          /(?:\bneither\b[^.!?\n]{0,60}\bx\s*=\s*3\b|\bx\s*=\s*3\b[^.!?\n]{0,45}\b(?:is\s+not|isn't|invalid|extraneous|not\s+a\s+solution)\b)/iu,
      },
      {
        id: "negative-solution",
        label: "Includes the negative solution",
        supports: /\bx\s*=\s*[-−]\s*3\b/iu,
        contradicts:
          /(?:\bneither\b[^.!?\n]{0,80}\bx\s*=\s*[-−]\s*3\b|(?:negative branch|x\s*=\s*[-−]\s*3)[^.!?\n]{0,40}\b(?:invalid|not (?:valid|a solution)|extraneous)\b)/iu,
      },
      {
        id: "branch-justification",
        label: "Justifies both square branches",
        supports:
          /(?:zero[- ]product|\(x\s*[-−]\s*3\)\s*\(x\s*\+\s*3\)|±\s*(?:√|sqrt)|both[^.!?\n]{0,80}(?:square\s+to\s+9|solutions?)|3\s*(?:²|\^\s*2)\s*=\s*9[^.!?\n]{0,100}\(?\s*[-−]\s*3\s*\)?\s*(?:²|\^\s*2)\s*=\s*9)/iu,
        contradicts:
          /(?:\bboth\b[^.!?\n]{0,80}\b(?:invalid|extraneous|wrong)\b|\bzero[- ]product\b[^.!?\n]{0,50}\b(?:invalid|wrong|does\s+not\s+apply)\b)/iu,
      },
    ],
  },
  "python-empty-aggregate": {
    rules: [
      {
        id: "guard-before-division",
        label: "Places an empty-input guard before division",
        supports:
          /(?:if\s+(?:not\s+nums|len\s*\(\s*nums\s*\)\s*==\s*0)|if\s+nums\s*==\s*\[\s*\])[^]*?return\s+sum\s*\(\s*nums\s*\)\s*\/\s*len\s*\(\s*nums\s*\)/u,
      },
      {
        id: "explicit-policy",
        label: "Uses an explicit empty-input policy",
        supports:
          /(?:if\s+(?:not\s+nums|len\s*\(\s*nums\s*\)\s*==\s*0)|if\s+nums\s*==\s*\[\s*\])[^\n]*\n\s+(?:raise\s+[A-Za-z]+Error|return\s+(?:None|0))/u,
      },
      {
        id: "non-empty-behavior",
        label: "Preserves the non-empty average calculation",
        supports:
          /return\s+sum\s*\(\s*nums\s*\)\s*\/\s*len\s*\(\s*nums\s*\)/u,
      },
    ],
  },
  "causal-observational-claim": {
    rules: [
      {
        id: "calibrated-claim",
        label: "Uses a calibrated causal claim",
        supports:
          /(?:association|observational)[^.!?\n]{0,100}\b(?:does not|do not|cannot|is not enough to)\s+(?:establish|prove|show|support)\s+caus/iu,
        contradicts:
          /\b(?:definitely|certainly|proves?|establishes?)\b[^.!?\n]{0,80}\bcaus/iu,
      },
      {
        id: "alternative-explanation",
        label: "Names a plausible alternative explanation",
        supports:
          /(?:(?:study longer|motivat\w*|prior achievement|self[- ]select\w*|students?\s+(?:who\s+choose|choosing))[^.!?\n]{0,90}\b(?:may|might|could|plausible|alternative|differ|also)\b|\b(?:may|might|could)\b[^.!?\n]{0,90}(?:study longer|motivat\w*|prior achievement|self[- ]select\w*))/iu,
        contradicts:
          /(?:motivat\w*[^.!?\n]{0,60}\b(?:is\s+not|isn't|cannot\s+be|cannot\s+plausibly\s+explain|not\s+a|irrelevant)\b[^.!?\n]{0,45}(?:plausible|alternative|explanation)?|students?\s+(?:who\s+choose|choosing)[^.!?\n]{0,80}\b(?:are\s+not|aren't|do\s+not|don't)\b[^.!?\n]{0,45}\b(?:motivat\w*|study|differ)|\b(?:irrelevant|cannot\s+plausibly\s+explain)\b[^.!?\n]{0,35}\bmotivat\w*)/iu,
      },
      {
        id: "stronger-evidence",
        label: "Requests stronger causal evidence",
        supports:
          /(?:(?:randomi[sz]ed|controlled (?:study|comparison|experiment)|control for|adjust for)[^.!?\n]{0,100}\b(?:better|stronger|would|could|needed|required|support)|\b(?:need|request|stronger)\b[^.!?\n]{0,100}(?:randomi[sz]ed|controlled|control for|adjust for))/iu,
        contradicts:
          /(?:\b(?:no|not)\s+(?:randomi[sz]ed|controlled)[^.!?\n]{0,40}\b(?:needed|required|necessary)\b|\b(?:randomi[sz]ed|controlled)[^.!?\n]{0,70}\b(?:is|are)\s+not\s+(?:needed|required|necessary)\b|\b(?:randomi[sz]ed|controlled)[^.!?\n]{0,60}\b(?:useless|unhelpful|irrelevant)\b)/iu,
      },
    ],
  },
};

const transferRules: Readonly<Record<ScenarioId, RuleSet>> = {
  "logic-negation-introduction": {
    freshContext: {
      anchors: [/r\s*∧\s*s/iu, /¬r|not r/iu],
      stale: /p\s*∧\s*q|¬p|not p/iu,
    },
    rules: [
      {
        id: "fresh-assumption",
        label: "Opens the fresh conjunction assumption",
        supports: /(?:assum|suppos)[^.!?\n]{0,60}r\s*∧\s*s/iu,
        contradicts:
          /\b(?:do\s+not|don't|never|avoid)\b[^.!?\n]{0,45}\b(?:assum|suppos)[^.!?\n]{0,45}r\s*∧\s*s/iu,
      },
      {
        id: "fresh-contradiction",
        label: "Derives a contradiction from r and ¬r",
        supports:
          /(?:extract|derive|obtain)[^.!?\n]{0,50}\br\b[^.!?\n]{0,100}(?:¬r|not r)[^.!?\n]{0,80}(?:⊥|contradict)/iu,
        contradicts:
          /\b(?:cannot|can't|does\s+not|doesn't|never)\b[^.!?\n]{0,80}\b(?:derive|yield|reach)[^.!?\n]{0,40}\b(?:⊥|contradiction)\b/iu,
      },
      {
        id: "fresh-discharge",
        label: "Discharges the fresh assumption",
        supports: /discharg[^.!?\n]{0,80}(?:negation introduction|¬i)/iu,
        contradicts:
          /\b(?:do\s+not|don't|never|avoid|should\s+not|shouldn't)\b[^.!?\n]{0,60}\bdischarg[^.!?\n]{0,60}(?:negation introduction|¬i)/iu,
      },
    ],
  },
  "algebra-square-branches": {
    freshContext: {
      anchors: [/\by\b/iu, /\b16\b/iu],
      stale: /\bx\b|\b9\b/iu,
    },
    rules: [
      {
        id: "fresh-positive",
        label: "Names the positive fresh-case solution",
        supports: /\by\s*=\s*4\b/iu,
        contradicts:
          /(?:\bneither\b[^.!?\n]{0,60}\by\s*=\s*4\b|\by\s*=\s*4\b[^.!?\n]{0,45}\b(?:is\s+not|isn't|invalid|extraneous|not\s+a\s+solution)\b)/iu,
      },
      {
        id: "fresh-negative",
        label: "Names the negative fresh-case solution",
        supports: /\by\s*=\s*[-−]\s*4\b/iu,
        contradicts:
          /(?:\bneither\b[^.!?\n]{0,80}\by\s*=\s*[-−]\s*4\b|\by\s*=\s*[-−]\s*4\b[^.!?\n]{0,45}\b(?:is\s+not|isn't|invalid|extraneous|not\s+a\s+solution)\b)/iu,
      },
      {
        id: "fresh-branches",
        label: "Explains why both fresh-case branches matter",
        supports: /(?:both[^.!?\n]{0,60}square|±\s*√?\s*16|factor|zero[- ]product)/iu,
        contradicts:
          /\bboth\b[^.!?\n]{0,80}\b(?:invalid|extraneous|wrong)\b/iu,
      },
    ],
  },
  "python-empty-aggregate": {
    freshContext: {
      anchors: [/\bvalues\b/iu, /\bmax\b/iu, /\bmin\b/iu],
      stale: /\baverage\b|sum\s*\(|len\s*\(\s*nums|\bnums\b/iu,
    },
    rules: [
      {
        id: "fresh-empty-input",
        label: "Identifies the fresh empty-input boundary",
        supports: /(?:empty|no values|zero elements)/iu,
      },
      {
        id: "fresh-order",
        label: "Places the fresh guard before max and min",
        supports:
          /(?:check|guard|detect|handle)[^.!?\n]{0,80}\bempty\b[^.!?\n]{0,80}\bbefore\b[^.!?\n]{0,80}(?:max|min)/iu,
        contradicts:
          /(?:\b(?:do\s+not|don't|need\s+not|should\s+not|shouldn't)\b[^.!?\n]{0,45}\b(?:check|guard|detect|handle)\b[^.!?\n]{0,100}\b(?:empty|before)\b|\b(?:check|guard|detect|handle)\b[^.!?\n]{0,100}\b(?:unnecessary|not\s+(?:needed|required|necessary))\b)/iu,
      },
      {
        id: "fresh-policy",
        label: "Names an explicit fresh-case policy",
        supports: /(?:raise|exception|sentinel|documented policy|explicit policy)/iu,
        contradicts:
          /(?:\b(?:exception|sentinel|documented\s+policy|explicit\s+policy)\b[^.!?\n]{0,60}\b(?:unnecessary|not\s+(?:needed|required|necessary))\b|\b(?:do\s+not|don't|never|avoid)\b[^.!?\n]{0,45}\b(?:raise|return|use)[^.!?\n]{0,45}\b(?:exception|sentinel|policy|anything)\b)/iu,
      },
    ],
  },
  "causal-observational-claim": {
    freshContext: {
      anchors: [/firefighters?/iu, /(?:fire )?severity|larger fires?/iu],
      stale: /flashcards?|students?|exam scores?/iu,
    },
    rules: [
      {
        id: "fresh-causal-caution",
        label: "Rejects the fresh direct-causal conclusion",
        supports:
          /(?:does not|doesn't|cannot)[^.!?\n]{0,60}(?:show|prove|establish)[^.!?\n]{0,50}(?:firefighters? cause|caus)/iu,
      },
      {
        id: "fresh-common-cause",
        label: "Identifies fire severity as a common cause",
        supports:
          /(?:severity|larger fires?|fire size)[^.!?\n]{0,100}(?:both|drives?|causes?)[^.!?\n]{0,100}(?:firefighters?|damage)/iu,
        contradicts:
          /(?:severity|larger fires?|fire size)[^.!?\n]{0,60}\b(?:does\s+not|doesn't|cannot|can't|is\s+not|isn't|fails?\s+to)\b[^.!?\n]{0,80}\b(?:drive|cause|affect|explain)\b/iu,
      },
      {
        id: "fresh-evidence",
        label: "Requests a severity-aware comparison",
        supports: /(?:control(?:ling)? for|account(?:ing)? for|adjust(?:ing)? for)[^.!?\n]{0,60}severity/iu,
        contradicts:
          /(?:control(?:ling)? for|account(?:ing)? for|adjust(?:ing)? for)[^.!?\n]{0,60}severity[^.!?\n]{0,70}\b(?:unnecessary|useless|not\s+(?:needed|required|necessary)|add\s+nothing)\b/iu,
      },
    ],
  },
};

const asScenarioId = (value: string): ScenarioId => {
  if (!SCENARIO_IDS.has(value)) throw new Error(`Unknown scenario: ${value}`);
  return value as ScenarioId;
};

const firstMatch = (pattern: RegExp, text: string): string | null =>
  pattern.exec(text)?.[0]?.trim() ?? null;

const evaluate = (
  scenarioId: ScenarioId,
  rawText: string,
  ruleSet: RuleSet,
  phase: "revision" | "transfer",
): ScenarioEvaluation => {
  const text =
    scenarioId === "python-empty-aggregate"
      ? rawText
          .split("\n")
          .filter((line) => !line.trimStart().startsWith("#"))
          .join("\n")
      : rawText;
  const hasFreshContext = ruleSet.freshContext
    ? ruleSet.freshContext.anchors.every((anchor) => anchor.test(text)) &&
      !(ruleSet.freshContext.stale?.test(text) ?? false)
    : true;

  const criteria = ruleSet.rules.map((rule): Criterion => {
    const evidence = hasFreshContext ? firstMatch(rule.supports, text) : null;
    const contradicted = rule.contradicts?.test(text) ?? false;
    return {
      id: rule.id,
      label: rule.label,
      state: evidence !== null && !contradicted ? "met" : "missing",
      evidence: evidence !== null && !contradicted ? evidence : null,
    };
  });
  const observed = criteria.every(({ state }) => state === "met");

  return {
    status: observed ? "evidence-observed" : "needs-work",
    summary: observed
      ? phase === "transfer"
        ? "Evidence was observed in the fresh, isolated case."
        : "Evidence was observed for every guided-scenario criterion."
      : phase === "transfer"
        ? "The fresh case still needs learner evidence for one or more criteria."
        : "The revision still needs learner evidence for one or more guided-scenario criteria.",
    criteria,
    provenance: {
      source: "deterministic-verifier",
      scope: "guided-scenario-only",
      scenarioId,
    },
  };
};

export const evaluateScenarioRevision = (
  rawScenarioId: string,
  revision: string,
): ScenarioEvaluation => {
  const scenarioId = asScenarioId(rawScenarioId);
  return evaluate(scenarioId, revision, revisionRules[scenarioId], "revision");
};

export const evaluateScenarioTransfer = (
  rawScenarioId: string,
  response: string,
): ScenarioEvaluation => {
  const scenarioId = asScenarioId(rawScenarioId);
  return evaluate(scenarioId, response, transferRules[scenarioId], "transfer");
};
