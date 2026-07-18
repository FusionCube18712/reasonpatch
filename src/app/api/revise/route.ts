import { createDemoReceipt } from "@/features/repair/demo";
import { createReceiptService } from "@/features/repair/receipt";
import { createOpenAIModelGatewayFromEnvironment } from "@/lib/ai/openai-gateway";
import { assertLiveModeEnabled } from "@/lib/ai/live-access";
import { createSlidingWindowLimiter, withRateLimit } from "@/lib/security/rate-limiter";

import { createReviseHandler } from "./handler";

export const runtime = "nodejs";

const reviseHandler = createReviseHandler({
  revise: async (request) => {
    if (request.mode === "demo") return createDemoReceipt(request);
    assertLiveModeEnabled();
    return createReceiptService(createOpenAIModelGatewayFromEnvironment()).revise(request);
  },
});

const globallyLimitedRevise = withRateLimit(reviseHandler, {
  limiter: createSlidingWindowLimiter({ limit: 50, windowMs: 60_000 }),
  keyFor: () => "global-receipt-budget",
});

export const POST = withRateLimit(globallyLimitedRevise, {
  limiter: createSlidingWindowLimiter({ limit: 16, windowMs: 60_000 }),
});
