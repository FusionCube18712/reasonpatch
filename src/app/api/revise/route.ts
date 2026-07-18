import { createDemoReceipt } from "@/features/repair/demo";
import { createReceiptService } from "@/features/repair/receipt";
import { createOpenAIModelGatewayFromEnvironment } from "@/lib/ai/openai-gateway";
import {
  assertLiveModeEnabled,
  isLiveModeRequest,
} from "@/lib/ai/live-access";
import {
  createSlidingWindowLimiter,
  withRateLimit,
  withRateLimitWhen,
} from "@/lib/security/rate-limiter";

import { createReviseHandler } from "./handler";

export const runtime = "nodejs";

const reviseHandler = createReviseHandler({
  revise: async (request) => {
    if (request.mode === "demo") return createDemoReceipt(request);
    assertLiveModeEnabled();
    return createReceiptService(createOpenAIModelGatewayFromEnvironment()).revise(request);
  },
});

const globallyLiveLimitedRevise = withRateLimitWhen(reviseHandler, {
  limiter: createSlidingWindowLimiter({ limit: 50, windowMs: 60_000 }),
  keyFor: () => "global-receipt-budget",
  shouldLimit: isLiveModeRequest,
});

const liveLimitedRevise = withRateLimitWhen(globallyLiveLimitedRevise, {
  limiter: createSlidingWindowLimiter({ limit: 16, windowMs: 60_000 }),
  shouldLimit: isLiveModeRequest,
});

const globallyRequestLimitedRevise = withRateLimit(liveLimitedRevise, {
  limiter: createSlidingWindowLimiter({ limit: 800, windowMs: 60_000 }),
  keyFor: () => "global-request-budget",
});

export const POST = withRateLimit(globallyRequestLimitedRevise, {
  limiter: createSlidingWindowLimiter({ limit: 180, windowMs: 60_000 }),
});
