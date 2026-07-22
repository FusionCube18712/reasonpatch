import { z } from "zod";

import { ScenarioIdSchema } from "@/features/coach/scenario-ids";
import { readBoundedJson } from "../../request-boundary";

const TransferRequestSchema = z
  .object({
    scenarioId: ScenarioIdSchema,
    response: z.string().trim().min(12).max(6_000),
    mode: z.literal("demo"),
  })
  .strict();

type HandlerDependencies = Readonly<{
  evaluateTransfer: (scenarioId: string, response: string) => unknown;
}>;

const json = (body: unknown, status: number) =>
  Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });

export const createCoachTransferHandler = ({
  evaluateTransfer,
}: HandlerDependencies) =>
  async function handleCoachTransfer(request: Request): Promise<Response> {
    const requestBody = await readBoundedJson(request);
    if (!requestBody.ok) return requestBody.response;

    const parsed = TransferRequestSchema.safeParse(requestBody.body);
    if (
      !parsed.success ||
      request.headers.get("x-reasonpatch-mode") !== parsed.data.mode
    ) {
      return json(
        {
          success: false,
          data: null,
          error: {
            code: "INVALID_REQUEST",
            message: "Explain the fresh case in your own words, then try again.",
          },
        },
        400,
      );
    }

    try {
      const data = evaluateTransfer(
        parsed.data.scenarioId,
        parsed.data.response,
      );
      return json({ success: true, data, error: null }, 200);
    } catch {
      return json(
        {
          success: false,
          data: null,
          error: {
            code: "UNAVAILABLE",
            message:
              "The fresh-case check is temporarily unavailable. Your response was not lost.",
          },
        },
        503,
      );
    }
  };
