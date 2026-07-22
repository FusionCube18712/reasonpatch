import { describe, expect, it } from "vitest";

import type { ModelCall, ModelGateway } from "@/lib/ai/model-gateway";
import { createOfficeHoursCoach } from "./office-hours-coach";

class ScriptedGateway implements ModelGateway {
  readonly calls: ModelCall[] = [];

  async generate(call: ModelCall): Promise<unknown> {
    this.calls.push(call);

    if (call.task === "coach:plan") {
      return {
        hingeQuote: "return sum(nums) / len(nums)",
        issueTitle: "Empty input reaches division by zero",
        issueLocation: "The return expression fails when nums is empty.",
        explanation:
          "The calculation works for non-empty lists, but it has no explicit empty-input policy.",
        jobs: [
          {
            id: "probe_counterexample",
            role: "counterexample",
            objective: "Test the function with the smallest boundary input.",
          },
          {
            id: "probe_assumption",
            role: "assumption",
            objective: "Identify the precondition required by the division.",
          },
          {
            id: "probe_rubric",
            role: "rubric",
            objective: "Check the requested behavior for every list input.",
          },
        ],
      };
    }

    if (call.task.startsWith("coach:probe:")) {
      const role = call.task.replace("coach:probe:", "") as
        | "counterexample"
        | "assumption"
        | "rubric";
      return {
        role,
        finding:
          role === "counterexample"
            ? "An empty list makes len(nums) zero."
            : role === "assumption"
              ? "The expression assumes at least one value is present."
              : "The attempt does not yet define behavior for every list input.",
        evidenceQuote: "return sum(nums) / len(nums)",
        coachingMove:
          "Ask the learner to choose an explicit empty-input policy before dividing.",
        confidence: 0.96,
        limitation: "Element types are outside this first-break review.",
      };
    }

    return {
      strengths: [
        "The non-empty calculation is concise and preserves the requested average formula.",
      ],
      hingeQuote: "return sum(nums) / len(nums)",
      issueTitle: "Empty input reaches division by zero",
      issueLocation: "The first consequential break is the return expression.",
      explanation:
        "When nums is empty, len(nums) is zero and the division cannot complete.",
      socraticQuestion:
        "What should the function do before dividing when nums is empty?",
      whyThisQuestion:
        "It asks for a deliberate boundary policy without writing the repair.",
      hints: [
        {
          level: "location",
          text: "Inspect the denominator in the return expression.",
        },
        {
          level: "concept",
          text: "Consider the precondition division needs.",
        },
        {
          level: "strategy",
          text: "Test the function with the smallest possible list.",
        },
      ],
      criteria: [
        {
          id: "empty-input",
          label: "Defines behavior for empty input",
          state: "missing",
          evidence: null,
        },
        {
          id: "non-empty-behavior",
          label: "Preserves behavior for non-empty numeric lists",
          state: "met",
          evidence: "return sum(nums) / len(nums)",
        },
      ],
      limitation:
        "This is a bounded reasoning review, not execution or proof of correctness.",
    };
  }
}

describe("office-hours coach", () => {
  it("diagnoses the first consequential break in custom work without completing it", async () => {
    const gateway = new ScriptedGateway();
    const coach = createOfficeHoursCoach({
      gateway,
      createId: () => "coach_run_test",
      now: () => 100,
    });
    const request = {
      source: {
        kind: "custom" as const,
        domain: "python" as const,
        assignment:
          "Review this Python function for correctness on every list input.",
        attempt: "def average(nums):\n    return sum(nums) / len(nums)",
        constraints:
          "Keep behavior for non-empty numeric lists; choose an empty-input policy.",
      },
      mode: "live" as const,
      coachStyle: "socratic" as const,
      forceLunaFallback: false,
    };
    const requestBefore = structuredClone(request);

    const result = await coach.diagnose(request);

    expect(request).toEqual(requestBefore);
    expect(request.source.attempt).toContain(result.diagnosis.hingeQuote);
    expect(result.diagnosis.strengths).toContain(
      "The non-empty calculation is concise and preserves the requested average formula.",
    );
    expect(result.diagnosis.issueTitle).toBe(
      "Empty input reaches division by zero",
    );
    expect(result.diagnosis.socraticQuestion).toMatch(/^[^?]+\?$/u);
    expect(result.diagnosis.hints.map(({ level }) => level)).toEqual([
      "location",
      "concept",
      "strategy",
    ]);
    expect(JSON.stringify(result)).not.toMatch(
      /replacementAnswer|def average\(nums\):\n\s+if not nums/iu,
    );
    expect(gateway.calls.map(({ model, task }) => ({ model, task }))).toEqual([
      { model: "gpt-5.6-sol", task: "coach:plan" },
      { model: "gpt-5.6-luna", task: "coach:probe:counterexample" },
      { model: "gpt-5.6-luna", task: "coach:probe:assumption" },
      { model: "gpt-5.6-luna", task: "coach:probe:rubric" },
      { model: "gpt-5.6-sol", task: "coach:synthesize" },
    ]);
    expect(result.trace).toEqual(
      expect.objectContaining({
        plannerModel: "gpt-5.6-sol",
        synthesisModel: "gpt-5.6-sol",
        degraded: false,
      }),
    );
    expect(result.trace.probes).toHaveLength(3);
    expect(
      gateway.calls.every(
        ({ instructions }) => !instructions.includes(request.source.attempt),
      ),
    ).toBe(true);
    expect(
      gateway.calls.every(
        ({ input }) => input.learnerAttempt === request.source.attempt,
      ),
    ).toBe(true);
  });

  it("rejects prose evidence that only matches after case or whitespace normalization", async () => {
    const coach = createOfficeHoursCoach({
      gateway: new ScriptedGateway(),
      createId: () => "coach_exact_grounding_test",
      now: () => 100,
    });

    await expect(
      coach.diagnose({
        source: {
          kind: "custom",
          domain: "formal-logic",
          assignment:
            "Review the following symbolic derivation and locate its first invalid inference.",
          attempt: "RETURN   SUM(NUMS) / LEN(NUMS)",
          constraints: "Quote exact learner text when identifying evidence.",
        },
        mode: "live",
        coachStyle: "socratic",
        forceLunaFallback: false,
      }),
    ).rejects.toThrow(/not found/iu);
  });
});
