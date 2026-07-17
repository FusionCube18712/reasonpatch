import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

import { ModelGatewayError, type ModelGateway } from "./model-gateway";

type ResponsesClient = Pick<OpenAI["responses"], "parse">;

type GatewayDependencies = Readonly<{ responses: ResponsesClient }>;

type OpenAIErrorShape = Readonly<{
  status?: number;
  code?: string;
  name?: string;
}>;

const classify = (error: unknown) => {
  const candidate = error as OpenAIErrorShape;
  if (candidate.code === "insufficient_quota") return "quota" as const;
  if (candidate.name === "AbortError" || candidate.status === 408)
    return "timeout" as const;
  return "upstream" as const;
};

export const createOpenAIModelGateway = ({
  responses,
}: GatewayDependencies): ModelGateway => ({
  async generate(call) {
    try {
      const response = await responses.parse({
        model: call.model,
        store: false,
        reasoning: { effort: call.model === "gpt-5.6-sol" ? "medium" : "low" },
        instructions: call.instructions,
        input: [{ role: "user", content: JSON.stringify(call.input) }],
        text: {
          format: zodTextFormat(call.schema, call.schemaName),
        },
      });

      if (response.output_parsed === null || response.output_parsed === undefined) {
        throw new ModelGatewayError(
          "The model returned no validated structured output.",
          "invalid_output",
        );
      }
      return response.output_parsed;
    } catch (error) {
      if (error instanceof ModelGatewayError) throw error;
      throw new ModelGatewayError("The model request failed.", classify(error));
    }
  },
});

export const createOpenAIModelGatewayFromEnvironment = (): ModelGateway => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new ModelGatewayError("Live mode is not configured.", "upstream");
  }

  const client = new OpenAI({
    apiKey,
    timeout: 25_000,
    maxRetries: 1,
  });
  return createOpenAIModelGateway({ responses: client.responses });
};

