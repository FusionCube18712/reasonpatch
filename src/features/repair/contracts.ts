import { z } from "zod";

export const ActivityIdSchema = z.enum([
  "correlation-causation",
  "base-rate-neglect",
  "sampling-bias",
]);

export const AnalyzeRequestSchema = z
  .object({
    activityId: ActivityIdSchema,
    response: z.string().trim().min(24).max(3_000),
    mode: z.enum(["demo", "live"]),
    forceLunaFallback: z.boolean(),
  })
  .strict();

export const ProbeRoleSchema = z.enum([
  "counterexample",
  "assumption",
  "rubric",
]);

const ProbeJobSchema = z
  .object({
    id: z.enum(["probe_counterexample", "probe_assumption", "probe_rubric"]),
    role: ProbeRoleSchema,
    objective: z.string().min(12).max(320),
  })
  .strict();

export const AnalysisPlanSchema = z
  .object({
    hingeQuote: z.string().min(8).max(420),
    misconception: z.string().min(3).max(120),
    explanation: z.string().min(12).max(600),
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
        message: "Plan must contain exactly one job for each probe role.",
      });
    }
  });

export const ProbeOutputSchema = z
  .object({
    role: ProbeRoleSchema,
    finding: z.string().min(8).max(600),
    evidenceQuote: z.string().min(3).max(420),
    coachingMove: z.string().min(8).max(500),
    confidence: z.number().min(0).max(1),
    limitation: z.string().min(3).max(240),
  })
  .strict();

export const RubricStateSchema = z.enum(["met", "emerging", "missing"]);

const RubricAssessmentSchema = z
  .object({
    id: z.enum(["association-causation", "confounder", "additional-evidence"]),
    state: RubricStateSchema,
    evidence: z.string().max(420).nullable(),
  })
  .strict();

export const SynthesisOutputSchema = z
  .object({
    hingeQuote: z.string().min(8).max(420),
    misconception: z.string().min(3).max(120),
    explanation: z.string().min(12).max(600),
    socraticQuestion: z.string().min(8).max(420),
    whyThisQuestion: z.string().min(8).max(420),
    rubric: z.array(RubricAssessmentSchema).length(3),
    limitation: z.string().min(8).max(240),
  })
  .strict();

export const ReviseRequestSchema = z
  .object({
    activityId: ActivityIdSchema,
    originalResponse: z.string().trim().min(24).max(3_000),
    revisedResponse: z.string().trim().min(36).max(3_000),
    mode: z.enum(["demo", "live"]),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.originalResponse === value.revisedResponse) {
      context.addIssue({
        code: "custom",
        path: ["revisedResponse"],
        message: "Revision must differ from the original response.",
      });
    }
  });

const ReceiptChangeSchema = z
  .object({
    label: z.string().min(3).max(120),
    before: z.string().max(420).nullable(),
    after: z.string().min(3).max(420),
  })
  .strict();

const ReceiptRubricSchema = z
  .object({
    id: z.string().min(3).max(80),
    label: z.string().min(3).max(180),
    before: RubricStateSchema,
    after: RubricStateSchema,
    evidence: z.string().min(3).max(420),
  })
  .strict();

export const ReceiptSchema = z
  .object({
    activityId: ActivityIdSchema,
    repairedHinge: z.string().min(3).max(180),
    summary: z.string().min(8).max(500),
    changes: z.array(ReceiptChangeSchema).min(1).max(5),
    rubric: z.array(ReceiptRubricSchema).min(1).max(3),
    remainingCaveat: z.string().max(320).nullable(),
    provenance: z
      .object({
        model: z.literal("gpt-5.6-sol"),
        mode: z.enum(["demo", "live"]),
      })
      .strict(),
  })
  .strict()
  .superRefine((value, context) => {
    const claims = `${value.summary} ${value.repairedHinge}`.toLowerCase();
    if (/\b(master(?:y|ed)?|authorship|proof of learning)\b/u.test(claims)) {
      context.addIssue({
        code: "custom",
        path: ["summary"],
        message: "Receipts may describe revision evidence, not mastery or authorship.",
      });
    }
  });

export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;
export type AnalysisPlan = z.infer<typeof AnalysisPlanSchema>;
export type ProbeRole = z.infer<typeof ProbeRoleSchema>;
export type ProbeOutput = z.infer<typeof ProbeOutputSchema>;
export type SynthesisOutput = z.infer<typeof SynthesisOutputSchema>;
export type ReviseRequest = z.infer<typeof ReviseRequestSchema>;
export type Receipt = z.infer<typeof ReceiptSchema>;

export type ProbeTrace = Readonly<{
  role: ProbeRole;
  model: "gpt-5.6-luna" | "gpt-5.6-sol";
  status: "completed" | "fallback";
  latencyMs: number;
  fallbackReason: "quota" | "timeout" | "invalid_output" | "upstream" | "forced" | null;
}>;

export type AnalysisResult = Readonly<{
  runId: string;
  activity: Readonly<{
    id: z.infer<typeof ActivityIdSchema>;
    title: string;
    prompt: string;
    rubric: ReadonlyArray<Readonly<{ id: string; label: string }>>;
  }>;
  diagnosis: SynthesisOutput;
  probes: ReadonlyArray<ProbeOutput>;
  trace: Readonly<{
    plannerModel: "gpt-5.6-sol" | "demo-fixture";
    synthesisModel: "gpt-5.6-sol" | "demo-fixture";
    degraded: boolean;
    probes: ReadonlyArray<ProbeTrace>;
  }>;
}>;

