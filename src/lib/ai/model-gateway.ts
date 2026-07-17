import type { z } from "zod";

export type SupportedModel = "gpt-5.6-sol" | "gpt-5.6-luna";

export type ModelCall = Readonly<{
  model: SupportedModel;
  task: string;
  schemaName: string;
  schema: z.ZodType;
  instructions: string;
  input: Readonly<Record<string, unknown>>;
}>;

export interface ModelGateway {
  generate(call: ModelCall): Promise<unknown>;
}

export type ModelErrorKind =
  | "quota"
  | "timeout"
  | "invalid_output"
  | "upstream";

export class ModelGatewayError extends Error {
  constructor(
    message: string,
    readonly kind: ModelErrorKind,
  ) {
    super(message);
    this.name = "ModelGatewayError";
  }
}

