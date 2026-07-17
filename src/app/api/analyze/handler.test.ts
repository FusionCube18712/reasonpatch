import { describe, expect, it, vi } from "vitest";

import { createAnalyzeHandler } from "./handler";
import { validAnalyzeRequest, validSynthesis } from "../../../../test/fixtures";

describe("analyze API handler", () => {
  it("returns a consistent 400 envelope for invalid learner input", async () => {
    const analyze = vi.fn();
    const handler = createAnalyzeHandler({ analyze });

    const response = await handler(
      new Request("http://localhost/api/analyze", {
        method: "POST",
        body: JSON.stringify({ activityId: "unknown" }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      success: false,
      data: null,
      error: { code: "INVALID_REQUEST" },
    });
    expect(analyze).not.toHaveBeenCalled();
  });

  it("returns analysis through the success envelope", async () => {
    const data = {
      runId: "run_test",
      activity: { id: "correlation-causation", title: "Causation or coincidence?" },
      diagnosis: validSynthesis,
      probes: [],
      trace: { degraded: false, probes: [] },
    };
    const analyze = vi.fn().mockResolvedValue(data);
    const handler = createAnalyzeHandler({ analyze });

    const response = await handler(
      new Request("http://localhost/api/analyze", {
        method: "POST",
        body: JSON.stringify(validAnalyzeRequest),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data,
      error: null,
    });
  });

  it("does not leak upstream error details", async () => {
    const handler = createAnalyzeHandler({
      analyze: vi.fn().mockRejectedValue(new Error("secret upstream payload")),
    });

    const response = await handler(
      new Request("http://localhost/api/analyze", {
        method: "POST",
        body: JSON.stringify(validAnalyzeRequest),
      }),
    );

    expect(response.status).toBe(503);
    expect(JSON.stringify(await response.json())).not.toContain("secret");
  });
});

