import { describe, expect, it, vi } from "vitest";

import { AnalysisPlanSchema } from "@/features/repair/contracts";
import { validPlan } from "../../../test/fixtures";
import { createOpenAIModelGateway } from "./openai-gateway";
import { ModelGatewayError } from "./model-gateway";

const call = {
  model: "gpt-5.6-sol" as const,
  task: "plan",
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
      expect.objectContaining<ModelGatewayError>({ kind: "quota" }),
    );
  });

  it("rejects missing parsed output instead of presenting fabricated data", async () => {
    const gateway = createOpenAIModelGateway({
      responses: { parse: vi.fn().mockResolvedValue({ output_parsed: null }) },
    });

    await expect(gateway.generate(call)).rejects.toEqual(
      expect.objectContaining<ModelGatewayError>({ kind: "invalid_output" }),
    );
  });
});

