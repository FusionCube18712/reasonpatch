import { evaluateScenarioTransfer } from "@/features/coach/scenario-evaluator";
import {
  createSlidingWindowLimiter,
  withRateLimit,
} from "@/lib/security/rate-limiter";

import { createCoachTransferHandler } from "./handler";

export const runtime = "nodejs";

const transferHandler = createCoachTransferHandler({
  evaluateTransfer: evaluateScenarioTransfer,
});

const globallyRequestLimited = withRateLimit(transferHandler, {
  limiter: createSlidingWindowLimiter({ limit: 600, windowMs: 60_000 }),
  keyFor: () => "global-v2-transfer-budget",
});

export const POST = withRateLimit(globallyRequestLimited, {
  limiter: createSlidingWindowLimiter({ limit: 120, windowMs: 60_000 }),
});
