import {
  TransferRequestSchema,
  type TransferRequest,
  type TransferSlip,
} from "@/features/repair/contracts";
import { hasMatchingDeclaredMode } from "@/lib/ai/live-access";
import { readBoundedJson } from "../request-boundary";

type Transfer = (request: TransferRequest) => Promise<TransferSlip>;

const json = (body: unknown, status: number) =>
  Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });

export const createTransferHandler = ({
  transfer,
}: Readonly<{ transfer: Transfer }>) =>
  async function handleTransfer(request: Request): Promise<Response> {
    const requestBody = await readBoundedJson(request);
    if (!requestBody.ok) return requestBody.response;

    const parsed = TransferRequestSchema.safeParse(requestBody.body);
    if (!parsed.success || !hasMatchingDeclaredMode(request, parsed.data.mode)) {
      return json(
        {
          success: false,
          data: null,
          error: {
            code: "INVALID_REQUEST",
            message: "Explain the fresh case in your own words before continuing.",
          },
        },
        400,
      );
    }

    try {
      const data = await transfer(parsed.data);
      return json({ success: true, data, error: null }, 200);
    } catch {
      return json(
        {
          success: false,
          data: null,
          error: {
            code: "UNAVAILABLE",
            message:
              "The fresh-case scan could not be completed yet. Your response was not lost.",
          },
        },
        503,
      );
    }
  };
