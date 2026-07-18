import { describe, expect, it, vi } from "vitest";

import { createTransferHandler } from "./handler";

const requestBody = {
  activityId: "correlation-causation",
  response:
    "The recovery difference does not establish causation because patients chose to join; random assignment would be stronger.",
  mode: "demo" as const,
};

const request = (body: unknown, mode = "demo") =>
  new Request("http://localhost/api/transfer", {
    method: "POST",
    body: typeof body === "string" ? body : JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      "X-ReasonPatch-Mode": mode,
    },
  });

describe("transfer API handler", () => {
  it("rejects malformed or non-demo requests before scanning", async () => {
    const transfer = vi.fn();
    const handler = createTransferHandler({ transfer });

    const malformed = await handler(request("{not-json"));
    const live = await handler(request({ ...requestBody, mode: "live" }, "live"));

    expect(malformed.status).toBe(400);
    expect(live.status).toBe(400);
    expect(transfer).not.toHaveBeenCalled();
  });

  it("rejects a mode header that disagrees with validated input", async () => {
    const transfer = vi.fn();
    const handler = createTransferHandler({ transfer });

    const response = await handler(request(requestBody, "live"));

    expect(response.status).toBe(400);
    expect(transfer).not.toHaveBeenCalled();
  });

  it("returns the transfer slip through the standard success envelope", async () => {
    const slip = {
      activityId: "correlation-causation" as const,
      summary:
        "The fresh-case response contains candidate evidence for 3 of 3 visible rubric criteria.",
      rubric: [],
      remainingCaveat:
        "This immediate scan is not a delayed or validated measure of learning.",
      provenance: { model: "demo-fixture" as const, mode: "demo" as const },
    };
    const transfer = vi.fn().mockResolvedValue(slip);
    const handler = createTransferHandler({ transfer });

    const response = await handler(request(requestBody));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: slip,
      error: null,
    });
    expect(transfer).toHaveBeenCalledWith(requestBody);
  });

  it("does not leak transfer-scan failures", async () => {
    const handler = createTransferHandler({
      transfer: vi.fn().mockRejectedValue(new Error("private failure")),
    });

    const response = await handler(request(requestBody));
    const payload = JSON.stringify(await response.json());

    expect(response.status).toBe(503);
    expect(payload).toContain("UNAVAILABLE");
    expect(payload).not.toContain("private failure");
  });
});
