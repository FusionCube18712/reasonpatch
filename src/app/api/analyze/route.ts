import { createDemoAnalysis } from "@/features/repair/demo";
import { createRepairOrchestrator } from "@/features/repair/orchestrator";
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

import { createAnalyzeHandler } from "./handler";

export const runtime = "nodejs";

const analyzeHandler = createAnalyzeHandler({
  analyze: async (request) => {
    if (request.mode === "demo") return createDemoAnalysis(request);
    assertLiveModeEnabled();
    const gateway = createOpenAIModelGatewayFromEnvironment();
    return createRepairOrchestrator({ gateway }).analyze(request);
  },
});

const globallyLiveLimitedAnalyze = withRateLimitWhen(analyzeHandler, {
  limiter: createSlidingWindowLimiter({ limit: 40, windowMs: 60_000 }),
  keyFor: () => "global-analysis-budget",
  shouldLimit: isLiveModeRequest,
});

const liveLimitedAnalyze = withRateLimitWhen(globallyLiveLimitedAnalyze, {
  limiter: createSlidingWindowLimiter({ limit: 12, windowMs: 60_000 }),
  shouldLimit: isLiveModeRequest,
});

const globallyRequestLimitedAnalyze = withRateLimit(liveLimitedAnalyze, {
  limiter: createSlidingWindowLimiter({ limit: 800, windowMs: 60_000 }),
  keyFor: () => "global-request-budget",
});

export const POST = withRateLimit(globallyRequestLimitedAnalyze, {
  limiter: createSlidingWindowLimiter({ limit: 180, windowMs: 60_000 }),
});
