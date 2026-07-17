import { createDemoAnalysis } from "@/features/repair/demo";
import { createRepairOrchestrator } from "@/features/repair/orchestrator";
import { createOpenAIModelGatewayFromEnvironment } from "@/lib/ai/openai-gateway";

import { createAnalyzeHandler } from "./handler";

export const runtime = "nodejs";

export const POST = createAnalyzeHandler({
  analyze: async (request) => {
    if (request.mode === "demo") return createDemoAnalysis(request);
    const gateway = createOpenAIModelGatewayFromEnvironment();
    return createRepairOrchestrator({ gateway }).analyze(request);
  },
});

