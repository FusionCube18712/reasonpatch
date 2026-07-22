import {
  ReviewRequestSchema,
  type ReviewRequest,
} from "@/features/coach/review-contracts";
import { readBoundedJson } from "../../request-boundary";

type GuidedRequest = Extract<ReviewRequest, { mode: "demo" }>;
type LiveRequest = Extract<ReviewRequest, { mode: "live" }>;

type HandlerDependencies = Readonly<{
  reviewGuided: (request: GuidedRequest) => Promise<unknown> | unknown;
  reviewLive: (request: LiveRequest) => Promise<unknown> | unknown;
}>;

const json = (body: unknown, status: number) =>
  Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });

const hasExactMode = (request: Request, mode: "demo" | "live") =>
  request.headers.get("x-reasonpatch-mode") === mode;

export const createCoachReviewHandler = ({
  reviewGuided,
  reviewLive,
}: HandlerDependencies) =>
  async function handleCoachReview(request: Request): Promise<Response> {
    const requestBody = await readBoundedJson(request);
    if (!requestBody.ok) return requestBody.response;

    const parsed = ReviewRequestSchema.safeParse(requestBody.body);
    if (!parsed.success || !hasExactMode(request, parsed.data.mode)) {
      return json(
        {
          success: false,
          data: null,
          error: {
            code: "INVALID_REQUEST",
            message: "Revise the work in your own words, then try again.",
          },
        },
        400,
      );
    }

    try {
      const data =
        parsed.data.mode === "demo"
          ? await reviewGuided(parsed.data)
          : await reviewLive(parsed.data);
      return json({ success: true, data, error: null }, 200);
    } catch {
      return json(
        {
          success: false,
          data: null,
          error: {
            code: "UNAVAILABLE",
            message:
              "Revision review is temporarily unavailable. Your revision was not lost.",
          },
        },
        503,
      );
    }
  };
