import { createGuidedDiagnosis } from "@/features/coach/guided-coach";
import { createOfficeHoursCoach } from "@/features/coach/office-hours-coach";
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

import { createCoachDiagnoseHandler } from "./handler";

export const runtime = "nodejs";

const diagnoseHandler = createCoachDiagnoseHandler({
  diagnoseGuided: (request) => createGuidedDiagnosis(request),
  diagnoseLive: async (request) => {
    assertLiveModeEnabled();
    const gateway = createOpenAIModelGatewayFromEnvironment();
    return createOfficeHoursCoach({ gateway }).diagnose(request);
  },
});

const globallyLiveLimited = withRateLimitWhen(diagnoseHandler, {
  limiter: createSlidingWindowLimiter({ limit: 30, windowMs: 60_000 }),
  keyFor: () => "global-v2-live-diagnosis-budget",
  shouldLimit: isLiveModeRequest,
});

const liveLimited = withRateLimitWhen(globallyLiveLimited, {
  limiter: createSlidingWindowLimiter({ limit: 10, windowMs: 60_000 }),
  shouldLimit: isLiveModeRequest,
});

const globallyRequestLimited = withRateLimit(liveLimited, {
  limiter: createSlidingWindowLimiter({ limit: 600, windowMs: 60_000 }),
  keyFor: () => "global-v2-diagnosis-budget",
});

export const POST = withRateLimit(globallyRequestLimited, {
  limiter: createSlidingWindowLimiter({ limit: 120, windowMs: 60_000 }),
});
