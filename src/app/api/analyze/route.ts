import { createDemoAnalysis } from "@/features/repair/demo";
import { createRepairOrchestrator } from "@/features/repair/orchestrator";
import { createOpenAIModelGatewayFromEnvironment } from "@/lib/ai/openai-gateway";
import { assertLiveModeEnabled } from "@/lib/ai/live-access";
import { createSlidingWindowLimiter, withRateLimit } from "@/lib/security/rate-limiter";

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

const globallyLimitedAnalyze = withRateLimit(analyzeHandler, {
  limiter: createSlidingWindowLimiter({ limit: 40, windowMs: 60_000 }),
  keyFor: () => "global-analysis-budget",
});

export const POST = withRateLimit(globallyLimitedAnalyze, {
  limiter: createSlidingWindowLimiter({ limit: 12, windowMs: 60_000 }),
});
