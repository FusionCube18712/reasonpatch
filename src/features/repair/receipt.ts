import type { ModelGateway } from "@/lib/ai/model-gateway";

import { getActivity } from "./activities";
import {
  ReceiptSchema,
  ReviseRequestSchema,
  type Receipt,
  type ReviseRequest,
} from "./contracts";

const RECEIPT_INSTRUCTIONS = `You are the lead educator producing a ReasonPatch Repair Receipt.
Compare the learner's original and revised explanations against the visible rubric.
Quote brief evidence from the learner's revision. Describe only observable changes.
Never claim mastery, learning, authorship, accuracy, or a grade. Never rewrite the response.`;

export const createReceiptService = (gateway: ModelGateway) => ({
  async revise(rawRequest: ReviseRequest): Promise<Receipt> {
    const request = ReviseRequestSchema.parse(rawRequest);
    const activity = getActivity(request.activityId);
    const rawReceipt = await gateway.generate({
      model: "gpt-5.6-sol",
      task: "receipt",
      schemaName: "reasonpatch_repair_receipt",
      schema: ReceiptSchema,
      instructions: RECEIPT_INSTRUCTIONS,
      input: {
        activity: activity.public,
        instructorIntent: activity.private.instructorIntent,
        originalResponse: request.originalResponse,
        revisedResponse: request.revisedResponse,
      },
    });
    return ReceiptSchema.parse(rawReceipt);
  },
});

