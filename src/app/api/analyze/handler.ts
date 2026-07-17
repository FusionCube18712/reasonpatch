import { AnalyzeRequestSchema, type AnalysisResult } from "@/features/repair/contracts";

type Analyze = (request: ReturnType<typeof AnalyzeRequestSchema.parse>) => Promise<AnalysisResult>;

type HandlerDependencies = Readonly<{ analyze: Analyze }>;

const json = (body: unknown, status: number) =>
  Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });

export const createAnalyzeHandler = ({ analyze }: HandlerDependencies) =>
  async function handleAnalyze(request: Request): Promise<Response> {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return json(
        {
          success: false,
          data: null,
          error: { code: "INVALID_JSON", message: "Send a valid JSON request." },
        },
        400,
      );
    }

    const parsed = AnalyzeRequestSchema.safeParse(body);
    if (!parsed.success) {
      return json(
        {
          success: false,
          data: null,
          error: {
            code: "INVALID_REQUEST",
            message: "Check the activity and explanation, then try again.",
          },
        },
        400,
      );
    }

    try {
      const data = await analyze(parsed.data);
      return json({ success: true, data, error: null }, 200);
    } catch {
      return json(
        {
          success: false,
          data: null,
          error: {
            code: "UNAVAILABLE",
            message: "Analysis is temporarily unavailable. Your writing was not lost.",
          },
        },
        503,
      );
    }
  };

