import {
  ModelGatewayError,
  type ModelErrorKind,
  type ModelGateway,
  type SupportedModel,
} from "@/lib/ai/model-gateway";

import {
  CoachDiagnosisSchema,
  CoachPlanSchema,
  CoachProbeSchema,
  OfficeHoursRequestSchema,
  type CoachProbe,
  type CoachProbeTrace,
  type OfficeHoursRequest,
  type OfficeHoursResult,
  type ProbeRole,
} from "./contracts";
import {
  COACH_PLAN_INSTRUCTIONS,
  COACH_PROBE_INSTRUCTIONS,
  COACH_SYNTHESIS_INSTRUCTIONS,
} from "./prompts";

type CoachDependencies = Readonly<{
  gateway: ModelGateway;
  createId?: () => string;
  now?: () => number;
}>;

type ProbeRun = Readonly<{
  output: CoachProbe;
  trace: CoachProbeTrace;
}>;

const defaultId = () => crypto.randomUUID();

const classifyFailure = (error: unknown): ModelErrorKind =>
  error instanceof ModelGatewayError ? error.kind : "upstream";

const assertGroundedQuote = (
  domain: OfficeHoursRequest["source"]["domain"],
  attempt: string,
  quote: string,
  label: string,
): void => {
  const grounded =
    domain === "python"
      ? attempt.replace(/\r\n/gu, "\n").includes(quote.replace(/\r\n/gu, "\n"))
      : attempt
          .normalize("NFKC")
          .toLocaleLowerCase("en-US")
          .replace(/\s+/gu, " ")
          .includes(
            quote
              .normalize("NFKC")
              .toLocaleLowerCase("en-US")
              .replace(/\s+/gu, " ")
              .trim(),
          );

  if (!grounded || quote.trim().length < 3) {
    throw new ModelGatewayError(
      `${label} was not found in the learner attempt.`,
      "invalid_output",
    );
  }
};

export const createOfficeHoursCoach = ({
  gateway,
  createId = defaultId,
  now = Date.now,
}: CoachDependencies) => {
  const generateProbe = async (
    role: ProbeRole,
    model: SupportedModel,
    input: Readonly<Record<string, unknown>>,
    request: OfficeHoursRequest,
  ): Promise<CoachProbe> => {
    const rawProbe = await gateway.generate({
      model,
      task: `coach:probe:${role}`,
      schemaName: `reasonpatch_coach_${role}_probe`,
      schema: CoachProbeSchema,
      instructions: COACH_PROBE_INSTRUCTIONS,
      input,
    });
    const probe = CoachProbeSchema.parse(rawProbe);
    if (probe.role !== role) {
      throw new ModelGatewayError(
        `The ${role} executor returned a ${probe.role} result.`,
        "invalid_output",
      );
    }
    assertGroundedQuote(
      request.source.domain,
      request.source.attempt,
      probe.evidenceQuote,
      `${role} evidence`,
    );
    return probe;
  };

  const executeProbe = async (
    role: ProbeRole,
    input: Readonly<Record<string, unknown>>,
    request: OfficeHoursRequest,
  ): Promise<ProbeRun> => {
    const startedAt = now();
    try {
      const output = await generateProbe(
        role,
        "gpt-5.6-luna",
        input,
        request,
      );
      return {
        output,
        trace: {
          role,
          model: "gpt-5.6-luna",
          status: "completed",
          latencyMs: Math.max(0, now() - startedAt),
          fallbackReason: null,
        },
      };
    } catch (error) {
      const output = await generateProbe(
        role,
        "gpt-5.6-sol",
        input,
        request,
      );
      return {
        output,
        trace: {
          role,
          model: "gpt-5.6-sol",
          status: "fallback",
          latencyMs: Math.max(0, now() - startedAt),
          fallbackReason: classifyFailure(error),
        },
      };
    }
  };

  const diagnose = async (
    rawRequest: OfficeHoursRequest,
  ): Promise<OfficeHoursResult> => {
    const request = OfficeHoursRequestSchema.parse(rawRequest);
    const learnerInput = {
      domain: request.source.domain,
      assignment: request.source.assignment,
      constraints: request.source.constraints,
      learnerAttempt: request.source.attempt,
    } as const;

    const rawPlan = await gateway.generate({
      model: "gpt-5.6-sol",
      task: "coach:plan",
      schemaName: "reasonpatch_coach_plan",
      schema: CoachPlanSchema,
      instructions: COACH_PLAN_INSTRUCTIONS,
      input: learnerInput,
    });
    const plan = CoachPlanSchema.parse(rawPlan);
    assertGroundedQuote(
      request.source.domain,
      request.source.attempt,
      plan.hingeQuote,
      "Plan hinge",
    );

    const probeRuns = await Promise.all(
      plan.jobs.map((job) =>
        executeProbe(
          job.role,
          {
            ...learnerInput,
            job,
            hingeQuote: plan.hingeQuote,
            issueTitle: plan.issueTitle,
          },
          request,
        ),
      ),
    );
    const probes = probeRuns.map(({ output }) => output);

    const rawDiagnosis = await gateway.generate({
      model: "gpt-5.6-sol",
      task: "coach:synthesize",
      schemaName: "reasonpatch_coach_diagnosis",
      schema: CoachDiagnosisSchema,
      instructions: COACH_SYNTHESIS_INSTRUCTIONS,
      input: {
        ...learnerInput,
        plan,
        probes,
      },
    });
    const diagnosis = CoachDiagnosisSchema.parse(rawDiagnosis);
    assertGroundedQuote(
      request.source.domain,
      request.source.attempt,
      diagnosis.hingeQuote,
      "Diagnosis hinge",
    );
    diagnosis.criteria.forEach((criterion) => {
      if (criterion.evidence !== null) {
        assertGroundedQuote(
          request.source.domain,
          request.source.attempt,
          criterion.evidence,
          `${criterion.label} evidence`,
        );
      }
    });
    const traces = probeRuns.map(({ trace }) => trace);

    return {
      runId: createId(),
      source: {
        kind: "custom",
        domain: request.source.domain,
        assignment: request.source.assignment,
        constraints: request.source.constraints,
      },
      diagnosis,
      probes,
      trace: {
        plannerModel: "gpt-5.6-sol",
        synthesisModel: "gpt-5.6-sol",
        degraded: traces.some(({ status }) => status === "fallback"),
        probes: traces,
      },
    };
  };

  return { diagnose } as const;
};
