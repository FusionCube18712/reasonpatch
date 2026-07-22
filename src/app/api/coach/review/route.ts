import {
  reviewCustomRevision,
  reviewGuidedRevision,
} from "@/features/coach/review-service";
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

import { createCoachReviewHandler } from "./handler";

export const runtime = "nodejs";

const reviewHandler = createCoachReviewHandler({
  reviewGuided: (request) => reviewGuidedRevision(request),
  reviewLive: async (request) => {
    assertLiveModeEnabled();
    const gateway = createOpenAIModelGatewayFromEnvironment();
    return reviewCustomRevision({ gateway, request });
  },
});

const globallyLiveLimited = withRateLimitWhen(reviewHandler, {
  limiter: createSlidingWindowLimiter({ limit: 30, windowMs: 60_000 }),
  keyFor: () => "global-v2-live-review-budget",
  shouldLimit: isLiveModeRequest,
});

const liveLimited = withRateLimitWhen(globallyLiveLimited, {
  limiter: createSlidingWindowLimiter({ limit: 10, windowMs: 60_000 }),
  shouldLimit: isLiveModeRequest,
});

const globallyRequestLimited = withRateLimit(liveLimited, {
  limiter: createSlidingWindowLimiter({ limit: 600, windowMs: 60_000 }),
  keyFor: () => "global-v2-review-budget",
});

export const POST = withRateLimit(globallyRequestLimited, {
  limiter: createSlidingWindowLimiter({ limit: 120, windowMs: 60_000 }),
});
