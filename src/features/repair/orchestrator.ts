import type {
  ModelErrorKind,
  ModelGateway,
  SupportedModel,
} from "@/lib/ai/model-gateway";
import { ModelGatewayError } from "@/lib/ai/model-gateway";

import { getActivity } from "./activities";
import {
  AnalyzeRequestSchema,
  AnalysisPlanSchema,
  ProbeOutputSchema,
  SynthesisOutputSchema,
  type AnalysisResult,
  type AnalyzeRequest,
  type ProbeOutput,
  type ProbeRole,
  type ProbeTrace,
} from "./contracts";
import {
  PLAN_INSTRUCTIONS,
  PROBE_INSTRUCTIONS,
  SYNTHESIS_INSTRUCTIONS,
} from "./prompts";
import { assertEvidenceOccursIn } from "./evidence";

type OrchestratorDependencies = Readonly<{
  gateway: ModelGateway;
  createId?: () => string;
  now?: () => number;
}>;

type ProbeRun = Readonly<{ output: ProbeOutput; trace: ProbeTrace }>;

const defaultId = () => crypto.randomUUID();

const classifyFailure = (error: unknown): ModelErrorKind =>
  error instanceof ModelGatewayError ? error.kind : "upstream";

export const createRepairOrchestrator = ({
  gateway,
  createId = defaultId,
  now = Date.now,
}: OrchestratorDependencies) => {
  const generateProbe = async (
    role: ProbeRole,
    model: SupportedModel,
    input: Readonly<Record<string, unknown>>,
  ): Promise<ProbeOutput> => {
    const output = await gateway.generate({
      model,
      task: `probe:${role}`,
      schemaName: `reasonpatch_${role}_probe`,
      schema: ProbeOutputSchema,
      instructions: PROBE_INSTRUCTIONS,
      input,
    });
    const parsed = ProbeOutputSchema.parse(output);
    if (parsed.role !== role) {
      throw new ModelGatewayError(
        `The ${role} executor returned a ${parsed.role} result.`,
        "invalid_output",
      );
    }
    assertEvidenceOccursIn(
      String(input.learnerResponse ?? ""),
      parsed.evidenceQuote,
      `${role} evidence`,
    );
    return parsed;
  };

  const executeProbe = async (
    role: ProbeRole,
    input: Readonly<Record<string, unknown>>,
    forceFallback: boolean,
  ): Promise<ProbeRun> => {
    const startedAt = now();

    if (forceFallback) {
      const output = await generateProbe(role, "gpt-5.6-sol", input);
      return {
        output,
        trace: {
          role,
          model: "gpt-5.6-sol",
          status: "fallback",
          latencyMs: Math.max(0, now() - startedAt),
          fallbackReason: "forced",
        },
      };
    }

    try {
      const output = await generateProbe(role, "gpt-5.6-luna", input);
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
      const reason = classifyFailure(error);
      const output = await generateProbe(role, "gpt-5.6-sol", input);
      return {
        output,
        trace: {
          role,
          model: "gpt-5.6-sol",
          status: "fallback",
          latencyMs: Math.max(0, now() - startedAt),
          fallbackReason: reason,
        },
      };
    }
  };

  const analyze = async (rawRequest: AnalyzeRequest): Promise<AnalysisResult> => {
    const request = AnalyzeRequestSchema.parse(rawRequest);
    const activity = getActivity(request.activityId);

    const rawPlan = await gateway.generate({
      model: "gpt-5.6-sol",
      task: "plan",
      schemaName: "reasonpatch_analysis_plan",
      schema: AnalysisPlanSchema,
      instructions: PLAN_INSTRUCTIONS,
      input: {
        activity: activity.public,
        instructorIntent: activity.private.instructorIntent,
        answerBoundary: activity.private.answerBoundary,
        learnerResponse: request.response,
      },
    });
    const plan = AnalysisPlanSchema.parse(rawPlan);
    assertEvidenceOccursIn(
      request.response,
      plan.hingeQuote,
      "Analysis hinge",
    );

    const probeRuns = await Promise.all(
      plan.jobs.map((job) =>
        executeProbe(
          job.role,
          {
            job,
            hingeQuote: plan.hingeQuote,
            activityPrompt: activity.public.prompt,
            learnerResponse: request.response,
            instructorIntent: activity.private.instructorIntent,
          },
          request.forceLunaFallback,
        ),
      ),
    );

    const probes = probeRuns.map(({ output }) => output);
    const rawSynthesis = await gateway.generate({
      model: "gpt-5.6-sol",
      task: "synthesize",
      schemaName: "reasonpatch_synthesis",
      schema: SynthesisOutputSchema,
      instructions: SYNTHESIS_INSTRUCTIONS,
      input: {
        plan,
        probes,
        rubric: activity.public.rubric,
        learnerResponse: request.response,
        answerBoundary: activity.private.answerBoundary,
      },
    });
    const diagnosis = SynthesisOutputSchema.parse(rawSynthesis);
    assertEvidenceOccursIn(
      request.response,
      diagnosis.hingeQuote,
      "Synthesis hinge",
    );
    const traces = probeRuns.map(({ trace }) => trace);

    return {
      runId: createId(),
      activity: activity.public,
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

  return { analyze } as const;
};
