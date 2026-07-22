import {
  OfficeHoursRequestSchema,
  type OfficeHoursRequest,
} from "@/features/coach/contracts";
import { hasMatchingDeclaredMode } from "@/lib/ai/live-access";
import { readBoundedJson } from "../../request-boundary";

type GuidedRequest = Extract<OfficeHoursRequest, { mode: "demo" }>;
type LiveRequest = Extract<OfficeHoursRequest, { mode: "live" }>;

type HandlerDependencies = Readonly<{
  diagnoseGuided: (request: GuidedRequest) => Promise<unknown> | unknown;
  diagnoseLive: (request: LiveRequest) => Promise<unknown> | unknown;
}>;

const json = (body: unknown, status: number) =>
  Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });

export const createCoachDiagnoseHandler = ({
  diagnoseGuided,
  diagnoseLive,
}: HandlerDependencies) =>
  async function handleCoachDiagnose(request: Request): Promise<Response> {
    const requestBody = await readBoundedJson(request);
    if (!requestBody.ok) return requestBody.response;

    const parsed = OfficeHoursRequestSchema.safeParse(requestBody.body);
    if (!parsed.success || !hasMatchingDeclaredMode(request, parsed.data.mode)) {
      return json(
        {
          success: false,
          data: null,
          error: {
            code: "INVALID_REQUEST",
            message: "Check the work and selected mode, then try again.",
          },
        },
        400,
      );
    }

    try {
      const data =
        parsed.data.mode === "demo"
          ? await diagnoseGuided(parsed.data)
          : await diagnoseLive(parsed.data);
      return json({ success: true, data, error: null }, 200);
    } catch {
      return json(
        {
          success: false,
          data: null,
          error: {
            code: "UNAVAILABLE",
            message:
              "Coaching is temporarily unavailable. Your writing was not lost.",
          },
        },
        503,
      );
    }
  };
