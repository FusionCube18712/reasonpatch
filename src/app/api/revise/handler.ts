import {
  ReviseRequestSchema,
  type Receipt,
  type ReviseRequest,
} from "@/features/repair/contracts";

type Revise = (request: ReviseRequest) => Promise<Receipt>;

const json = (body: unknown, status: number) =>
  Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });

export const createReviseHandler = ({ revise }: Readonly<{ revise: Revise }>) =>
  async function handleRevise(request: Request): Promise<Response> {
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

    const parsed = ReviseRequestSchema.safeParse(body);
    if (!parsed.success) {
      return json(
        {
          success: false,
          data: null,
          error: {
            code: "INVALID_REQUEST",
            message: "Revise the explanation in your own words before continuing.",
          },
        },
        400,
      );
    }

    try {
      const data = await revise(parsed.data);
      return json({ success: true, data, error: null }, 200);
    } catch {
      return json(
        {
          success: false,
          data: null,
          error: {
            code: "UNAVAILABLE",
            message: "The receipt could not be created yet. Your revision was not lost.",
          },
        },
        503,
      );
    }
  };

