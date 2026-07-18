import { createDemoTransferSlip } from "@/features/repair/demo";
import {
  createSlidingWindowLimiter,
  withRateLimit,
} from "@/lib/security/rate-limiter";

import { createTransferHandler } from "./handler";

export const runtime = "nodejs";

const transferHandler = createTransferHandler({
  transfer: async (request) => createDemoTransferSlip(request),
});

const globallyRequestLimitedTransfer = withRateLimit(transferHandler, {
  limiter: createSlidingWindowLimiter({ limit: 800, windowMs: 60_000 }),
  keyFor: () => "global-request-budget",
});

export const POST = withRateLimit(globallyRequestLimitedTransfer, {
  limiter: createSlidingWindowLimiter({ limit: 180, windowMs: 60_000 }),
});
