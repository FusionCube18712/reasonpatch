import { z } from "zod";

import { ScenarioIdSchema } from "./scenario-ids";
import { getScenario } from "./scenarios";
import { containsProhibitedEvidenceVerdict } from "../evidence-claims";

export const DomainIdSchema = z.enum([
  "formal-logic",
  "algebra",
  "python",
  "causal-reasoning",
]);

export const ProbeRoleSchema = z.enum([
  "counterexample",
  "assumption",
  "rubric",
]);

export const CustomWorkSourceSchema = z
  .object({
    kind: z.literal("custom"),
    domain: DomainIdSchema,
    assignment: z.string().trim().min(12).max(4_000),
    attempt: z.string().trim().min(8).max(6_000),
    constraints: z.string().trim().max(2_000),
  })
  .strict();

export const GuidedWorkSourceSchema = z
  .object({
    kind: z.literal("guided"),
    scenarioId: ScenarioIdSchema,
    attempt: z.string().min(8).max(6_000),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.attempt !== getScenario(value.scenarioId).attempt) {
      context.addIssue({
        code: "custom",
        path: ["attempt"],
        message: "Guided mode requires the scenario's exact starting attempt.",
      });
    }
  });

const LiveOfficeHoursRequestSchema = z
  .object({
    source: CustomWorkSourceSchema,
    mode: z.literal("live"),
    coachStyle: z.literal("socratic"),
    forceLunaFallback: z.literal(false),
  })
  .strict();

const GuidedOfficeHoursRequestSchema = z
  .object({
    source: GuidedWorkSourceSchema,
    mode: z.literal("demo"),
    coachStyle: z.literal("socratic"),
    forceLunaFallback: z.boolean(),
  })
  .strict();

export const OfficeHoursRequestSchema = z.discriminatedUnion("mode", [
  LiveOfficeHoursRequestSchema,
  GuidedOfficeHoursRequestSchema,
]);

const ProbeJobSchema = z
  .object({
    id: z.enum(["probe_counterexample", "probe_assumption", "probe_rubric"]),
    role: ProbeRoleSchema,
    objective: z.string().min(12).max(320),
  })
  .strict();

export const CoachPlanSchema = z
  .object({
    hingeQuote: z.string().min(3).max(500),
    issueTitle: z.string().min(8).max(160),
    issueLocation: z.string().min(8).max(320),
    explanation: z.string().min(12).max(700),
    jobs: z.array(ProbeJobSchema).length(3),
  })
  .strict()
  .superRefine((value, context) => {
    const roles = new Set(value.jobs.map(({ role }) => role));
    const ids = new Set(value.jobs.map(({ id }) => id));
    if (roles.size !== 3 || ids.size !== 3) {
      context.addIssue({
        code: "custom",
        path: ["jobs"],
        message: "The plan must contain one job for every probe role.",
      });
    }
  });

export const CoachProbeSchema = z
  .object({
    role: ProbeRoleSchema,
    finding: z.string().min(8).max(700),
    evidenceQuote: z.string().min(3).max(500),
    coachingMove: z.string().min(8).max(500),
    confidence: z.number().min(0).max(1),
    limitation: z.string().min(3).max(280),
  })
  .strict();

export const HintLevelSchema = z.enum([
  "location",
  "concept",
  "strategy",
  "analogy",
]);

const HintSchema = z
  .object({
    level: HintLevelSchema,
    text: z.string().min(8).max(320),
  })
  .strict();

export const CriterionStateSchema = z.enum(["met", "emerging", "missing"]);

const CriterionAssessmentSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u).min(3).max(80),
    label: z.string().min(3).max(180),
    state: CriterionStateSchema,
    evidence: z.string().min(3).max(500).nullable(),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.state === "missing" && value.evidence !== null) {
      context.addIssue({
        code: "custom",
        path: ["evidence"],
        message: "Missing criteria cannot claim learner evidence.",
      });
    }
    if (value.state !== "missing" && value.evidence === null) {
      context.addIssue({
        code: "custom",
        path: ["evidence"],
        message: "Supported criteria require learner evidence.",
      });
    }
  });

export const CoachDiagnosisSchema = z
  .object({
    strengths: z.array(z.string().min(8).max(320)).min(1).max(3),
    hingeQuote: z.string().min(3).max(500),
    issueTitle: z.string().min(8).max(160),
    issueLocation: z.string().min(8).max(320),
    explanation: z.string().min(12).max(700),
    socraticQuestion: z.string().min(8).max(420),
    whyThisQuestion: z.string().min(8).max(420),
    hints: z.array(HintSchema).min(3).max(4),
    criteria: z.array(CriterionAssessmentSchema).min(2).max(4),
    limitation: z.string().min(8).max(320),
  })
  .strict()
  .superRefine((value, context) => {
    if (new Set(value.criteria.map(({ id }) => id)).size !== value.criteria.length) {
      context.addIssue({
        code: "custom",
        path: ["criteria"],
        message: "Diagnosis criterion identifiers must be unique.",
      });
    }

    const questionMarks = value.socraticQuestion.match(/\?/gu)?.length ?? 0;
    if (!value.socraticQuestion.endsWith("?") || questionMarks !== 1) {
      context.addIssue({
        code: "custom",
        path: ["socraticQuestion"],
        message: "The diagnosis must ask exactly one Socratic question.",
      });
    }

    const expectedLevels = ["location", "concept", "strategy", "analogy"];
    const levels = value.hints.map(({ level }) => level);
    if (levels.some((level, index) => level !== expectedLevels[index])) {
      context.addIssue({
        code: "custom",
        path: ["hints"],
        message: "Hints must progress from location to concept to strategy.",
      });
    }

    const claimText = [
      ...value.strengths,
      value.issueTitle,
      value.issueLocation,
      value.explanation,
      value.socraticQuestion,
      value.whyThisQuestion,
      ...value.hints.map(({ text }) => text),
      ...value.criteria.map(({ label }) => label),
      value.limitation,
    ].join("\n");
    if (containsProhibitedEvidenceVerdict(claimText)) {
      context.addIssue({
        code: "custom",
        path: ["limitation"],
        message:
          "A diagnosis may describe evidence, not correctness, grades, authorship, or learning outcomes.",
      });
    }
  });

export type DomainId = z.infer<typeof DomainIdSchema>;
export type ProbeRole = z.infer<typeof ProbeRoleSchema>;
export type OfficeHoursRequest = z.infer<typeof OfficeHoursRequestSchema>;
export type CoachPlan = z.infer<typeof CoachPlanSchema>;
export type CoachProbe = z.infer<typeof CoachProbeSchema>;
export type CoachDiagnosis = z.infer<typeof CoachDiagnosisSchema>;

export type CoachProbeTrace = Readonly<{
  role: ProbeRole;
  model: "gpt-5.6-luna" | "gpt-5.6-sol";
  status: "completed" | "fallback";
  latencyMs: number;
  fallbackReason:
    | "quota"
    | "timeout"
    | "invalid_output"
    | "upstream"
    | "forced"
    | null;
}>;

export type OfficeHoursResult = Readonly<{
  runId: string;
  source: Readonly<{
    kind: "custom";
    domain: DomainId;
    assignment: string;
    constraints: string;
  }>;
  diagnosis: CoachDiagnosis;
  probes: ReadonlyArray<CoachProbe>;
  trace: Readonly<{
    plannerModel: "gpt-5.6-sol";
    synthesisModel: "gpt-5.6-sol";
    degraded: boolean;
    probes: ReadonlyArray<CoachProbeTrace>;
  }>;
}>;
