import { createDemoReceipt } from "@/features/repair/demo";
import { createReceiptService } from "@/features/repair/receipt";
import { createOpenAIModelGatewayFromEnvironment } from "@/lib/ai/openai-gateway";

import { createReviseHandler } from "./handler";

export const runtime = "nodejs";

export const POST = createReviseHandler({
  revise: async (request) => {
    if (request.mode === "demo") return createDemoReceipt(request);
    return createReceiptService(createOpenAIModelGatewayFromEnvironment()).revise(request);
  },
});

