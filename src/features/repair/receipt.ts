import { ModelGatewayError, type ModelGateway } from "@/lib/ai/model-gateway";

import { getActivity } from "./activities";
import {
  ReceiptSchema,
  ReviseRequestSchema,
  type Receipt,
  type ReviseRequest,
} from "./contracts";
import { assertEvidenceOccursIn } from "./evidence";

const RECEIPT_INSTRUCTIONS = `You are the lead educator producing a ReasonPatch Repair Receipt.
Compare the learner's original and revised explanations against the visible rubric.
Quote brief evidence verbatim from the learner's revision. Describe only observable changes.
Every changes.before value must be a verbatim original excerpt, and every changes.after value must be a verbatim revision excerpt.
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
    const parsed = ReceiptSchema.parse(rawReceipt);
    const canonicalRubric = activity.public.rubric.map((expected) => {
      const criterion = parsed.rubric.find(({ id }) => id === expected.id);
      if (!criterion || criterion.label !== expected.label) {
        throw new ModelGatewayError(
          "The receipt did not preserve the learner-visible rubric.",
          "invalid_output",
        );
      }
      return criterion;
    });
    if (new Set(parsed.rubric.map(({ id }) => id)).size !== canonicalRubric.length) {
      throw new ModelGatewayError(
        "The receipt returned duplicate rubric criteria.",
        "invalid_output",
      );
    }
    canonicalRubric.forEach((criterion) => {
      if (criterion.evidence !== null) {
        assertEvidenceOccursIn(
          request.revisedResponse,
          criterion.evidence,
          `${criterion.label} evidence`,
        );
      }
    });
    parsed.changes.forEach((change) => {
      if (change.before !== null) {
        assertEvidenceOccursIn(
          request.originalResponse,
          change.before,
          `${change.label} original excerpt`,
        );
      }
      assertEvidenceOccursIn(
        request.revisedResponse,
        change.after,
        `${change.label} revision excerpt`,
      );
    });
    return ReceiptSchema.parse({
      ...parsed,
      activityId: request.activityId,
      rubric: canonicalRubric,
      provenance: { model: "gpt-5.6-sol", mode: request.mode },
    });
  },
});
