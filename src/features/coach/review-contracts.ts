import { z } from "zod";

import { CustomWorkSourceSchema, GuidedWorkSourceSchema } from "./contracts";

const DiagnosisReferenceSchema = z
  .object({
    hingeQuote: z.string().min(3).max(500),
    issueTitle: z.string().min(8).max(160),
    criteria: z
      .array(
        z
          .object({
            id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u).min(3).max(80),
            label: z.string().min(3).max(180),
          })
          .strict(),
      )
      .min(2)
      .max(4),
  })
  .strict()
  .superRefine((value, context) => {
    if (new Set(value.criteria.map(({ id }) => id)).size !== value.criteria.length) {
      context.addIssue({
        code: "custom",
        path: ["criteria"],
        message: "Diagnosis criterion identifiers must be unique.",
      });
    }
  });

export const CustomReviewRequestSchema = z
  .object({
    source: CustomWorkSourceSchema,
    diagnosis: DiagnosisReferenceSchema,
    revision: z.string().trim().min(12).max(6_000),
    mode: z.literal("live"),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.revision === value.source.attempt) {
      context.addIssue({
        code: "custom",
        path: ["revision"],
        message: "The revision must differ from the original attempt.",
      });
    }
    if (!value.source.attempt.includes(value.diagnosis.hingeQuote)) {
      context.addIssue({
        code: "custom",
        path: ["diagnosis", "hingeQuote"],
        message: "The hinge quote must occur in the original attempt.",
      });
    }
  });

export const GuidedReviewRequestSchema = z
  .object({
    source: GuidedWorkSourceSchema,
    revision: z.string().trim().min(12).max(6_000),
    mode: z.literal("demo"),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.revision === value.source.attempt) {
      context.addIssue({
        code: "custom",
        path: ["revision"],
        message: "The revision must differ from the original attempt.",
      });
    }
  });

export const ReviewRequestSchema = z.union([
  GuidedReviewRequestSchema,
  CustomReviewRequestSchema,
]);

export type ReviewRequest = z.infer<typeof ReviewRequestSchema>;
