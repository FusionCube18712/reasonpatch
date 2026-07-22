import { z } from "zod";

export const ScenarioIdSchema = z.enum([
  "logic-negation-introduction",
  "algebra-square-branches",
  "python-empty-aggregate",
  "causal-observational-claim",
]);

export type ScenarioId = z.infer<typeof ScenarioIdSchema>;
