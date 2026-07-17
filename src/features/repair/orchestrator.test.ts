import { describe, expect, it } from "vitest";

import type { ModelCall, ModelGateway } from "@/lib/ai/model-gateway";
import { ModelGatewayError } from "@/lib/ai/model-gateway";
import { createRepairOrchestrator } from "./orchestrator";
import {
  probeFor,
  validAnalyzeRequest,
  validPlan,
  validSynthesis,
} from "../../../test/fixtures";

class RecordingGateway implements ModelGateway {
  readonly calls: ModelCall[] = [];

  constructor(private readonly failRole: string | null = null) {}

  async generate(call: ModelCall): Promise<unknown> {
    this.calls.push(call);

    if (call.task === "plan") return validPlan;
    if (call.task === "synthesize") return validSynthesis;

    const role = call.task.replace("probe:", "") as
      | "counterexample"
      | "assumption"
      | "rubric";
    if (call.model === "gpt-5.6-luna" && role === this.failRole) {
      throw new ModelGatewayError("Luna quota exhausted", "quota");
    }

    return probeFor(role);
  }
}

describe("repair orchestrator", () => {
  it("uses Sol to plan and synthesize around three Luna probes", async () => {
    const gateway = new RecordingGateway();
    const orchestrator = createRepairOrchestrator({
      gateway,
      createId: () => "run_test",
      now: () => 100,
    });

    const result = await orchestrator.analyze(validAnalyzeRequest);

    expect(gateway.calls.map(({ model, task }) => ({ model, task }))).toEqual([
      { model: "gpt-5.6-sol", task: "plan" },
      { model: "gpt-5.6-luna", task: "probe:counterexample" },
      { model: "gpt-5.6-luna", task: "probe:assumption" },
      { model: "gpt-5.6-luna", task: "probe:rubric" },
      { model: "gpt-5.6-sol", task: "synthesize" },
    ]);
    expect(result.trace.probes.every((probe) => probe.status === "completed")).toBe(
      true,
    );
    expect(result.trace.degraded).toBe(false);
  });

  it("reruns only the failed Luna job on Sol and discloses fallback", async () => {
    const gateway = new RecordingGateway("assumption");
    const orchestrator = createRepairOrchestrator({
      gateway,
      createId: () => "run_fallback",
      now: () => 200,
    });

    const result = await orchestrator.analyze(validAnalyzeRequest);

    expect(gateway.calls).toContainEqual(
      expect.objectContaining({
        model: "gpt-5.6-sol",
        task: "probe:assumption",
      }),
    );
    expect(result.trace.probes).toContainEqual(
      expect.objectContaining({
        role: "assumption",
        model: "gpt-5.6-sol",
        status: "fallback",
        fallbackReason: "quota",
      }),
    );
    expect(result.trace.degraded).toBe(true);
  });

  it("routes every executor directly to Sol when fallback is forced", async () => {
    const gateway = new RecordingGateway();
    const orchestrator = createRepairOrchestrator({
      gateway,
      createId: () => "run_forced",
      now: () => 300,
    });

    await orchestrator.analyze({
      ...validAnalyzeRequest,
      forceLunaFallback: true,
    });

    expect(
      gateway.calls.filter(({ task }) => task.startsWith("probe:")),
    ).toSatisfy((calls: ModelCall[]) =>
      calls.every(({ model }) => model === "gpt-5.6-sol"),
    );
  });
});

