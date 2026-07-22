import { describe, expect, it, vi } from "vitest";

import { AnalysisPlanSchema } from "@/features/repair/contracts";
import { validPlan } from "../../../test/fixtures";
import { createOpenAIModelGateway } from "./openai-gateway";

const call = {
  model: "gpt-5.6-sol" as const,
  task: "coach:plan",
  schemaName: "reasonpatch_analysis_plan",
  schema: AnalysisPlanSchema,
  instructions: "Locate the reasoning hinge.",
  input: { learnerResponse: "A score difference proves the tutoring caused it." },
};

describe("OpenAI model gateway", () => {
  it("uses Responses structured outputs with storage disabled", async () => {
    const parse = vi.fn().mockResolvedValue({ output_parsed: validPlan });
    const gateway = createOpenAIModelGateway({
      responses: { parse },
    });

    await expect(gateway.generate(call)).resolves.toEqual(validPlan);
    expect(parse).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-5.6-sol",
        store: false,
        reasoning: { effort: "medium" },
        instructions: call.instructions,
        text: { format: expect.any(Object) },
        max_output_tokens: 1_000,
      }),
    );
    expect(parse.mock.calls[0]?.[0].input).toEqual([
      { role: "user", content: JSON.stringify(call.input) },
    ]);
  });

  it("classifies insufficient Luna quota for the Sol fallback path", async () => {
    const gateway = createOpenAIModelGateway({
      responses: {
        parse: vi.fn().mockRejectedValue({
          status: 429,
          code: "insufficient_quota",
          message: "quota",
        }),
      },
    });

    await expect(gateway.generate(call)).rejects.toEqual(
      expect.objectContaining({ kind: "quota" }),
    );
  });

  it.each([
    [{ name: "AbortError" }, "timeout"],
    [{ status: 408 }, "timeout"],
    [{ status: 502 }, "upstream"],
  ] as const)("classifies model transport failures", async (failure, kind) => {
    const gateway = createOpenAIModelGateway({
      responses: { parse: vi.fn().mockRejectedValue(failure) },
    });

    await expect(gateway.generate(call)).rejects.toEqual(
      expect.objectContaining({ kind }),
    );
  });

  it("uses low reasoning effort for Luna executor calls", async () => {
    const parse = vi.fn().mockResolvedValue({ output_parsed: validPlan });
    const gateway = createOpenAIModelGateway({ responses: { parse } });

    await gateway.generate({
      ...call,
      model: "gpt-5.6-luna",
      task: "coach:probe:rubric",
    });

    expect(parse).toHaveBeenCalledWith(
      expect.objectContaining({
        reasoning: { effort: "low" },
        max_output_tokens: 800,
      }),
    );
  });

  it("rejects missing parsed output instead of presenting fabricated data", async () => {
    const gateway = createOpenAIModelGateway({
      responses: { parse: vi.fn().mockResolvedValue({ output_parsed: null }) },
    });

    await expect(gateway.generate(call)).rejects.toEqual(
      expect.objectContaining({ kind: "invalid_output" }),
    );
  });
});
