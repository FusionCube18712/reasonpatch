import { describe, expect, it, vi } from "vitest";

import { createCoachTransferHandler } from "./handler";

const transferRequest = {
  scenarioId: "causal-observational-claim" as const,
  response:
    "The number of firefighters does not establish that firefighters cause more damage. Fire severity can drive both the number of firefighters and damage, so compare fires while controlling for severity.",
  mode: "demo" as const,
};

const requestFor = (
  body: unknown,
  declaredMode: "demo" | "live" | null = "demo",
  overrides: HeadersInit = {},
) => {
  const headers = new Headers({
    "Content-Type": "application/json",
    Origin: "https://reasonpatch.local",
    "Sec-Fetch-Site": "same-origin",
    ...overrides,
  });
  if (declaredMode !== null) {
    headers.set("X-ReasonPatch-Mode", declaredMode);
  }
  return new Request("https://reasonpatch.local/api/coach/transfer", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
};

const evaluation = {
  status: "evidence-observed" as const,
  summary: "Evidence was observed in the fresh, isolated case.",
  criteria: [],
  provenance: {
    source: "deterministic-verifier" as const,
    scope: "guided-scenario-only" as const,
    scenarioId: transferRequest.scenarioId,
  },
};

describe("POST /api/coach/transfer handler", () => {
  it("passes only the validated fresh scenario and response to the evaluator", async () => {
    const evaluateTransfer = vi.fn(() => evaluation);
    const handler = createCoachTransferHandler({ evaluateTransfer });

    const response = await handler(requestFor(transferRequest));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      success: true,
      data: evaluation,
      error: null,
    });
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(evaluateTransfer).toHaveBeenCalledWith(
      transferRequest.scenarioId,
      transferRequest.response,
    );
  });

  it.each([
    ["a missing mode header", transferRequest, null],
    ["a live mode", { ...transferRequest, mode: "live" }, "live"],
    ["a mismatched mode header", transferRequest, "live"],
    ["an unknown scenario", { ...transferRequest, scenarioId: "unknown" }, "demo"],
    ["an empty response", { ...transferRequest, response: "" }, "demo"],
  ] as const)("rejects %s before transfer evaluation", async (_label, body, mode) => {
    const evaluateTransfer = vi.fn(() => evaluation);
    const handler = createCoachTransferHandler({ evaluateTransfer });

    const response = await handler(requestFor(body, mode));

    expect(response.status).toBe(400);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(evaluateTransfer).not.toHaveBeenCalled();
  });

  it.each([
    ["attempt", "the learner's original attempt"],
    ["diagnosis", { hingeQuote: "old hinge", hints: ["old hint"] }],
    ["revision", "the coached revision"],
    ["hints", ["the prior coaching hint"]],
  ])("rejects prior %s context instead of forwarding it", async (key, value) => {
    const evaluateTransfer = vi.fn(() => evaluation);
    const handler = createCoachTransferHandler({ evaluateTransfer });

    const response = await handler(
      requestFor({ ...transferRequest, [key]: value }),
    );

    expect(response.status).toBe(400);
    expect(evaluateTransfer).not.toHaveBeenCalled();
  });

  it("rejects cross-site JSON at the shared request boundary", async () => {
    const evaluateTransfer = vi.fn(() => evaluation);
    const handler = createCoachTransferHandler({ evaluateTransfer });

    const response = await handler(
      requestFor(transferRequest, "demo", {
        Origin: "https://attacker.example",
        "Sec-Fetch-Site": "cross-site",
      }),
    );

    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(evaluateTransfer).not.toHaveBeenCalled();
  });

  it("returns a generic no-store error without leaking evaluator details", async () => {
    const handler = createCoachTransferHandler({
      evaluateTransfer: vi.fn(() => {
        throw new Error("PRIVATE_TRANSFER_SENTINEL");
      }),
    });

    const response = await handler(requestFor(transferRequest));
    const serialized = JSON.stringify(await response.json());

    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(serialized).toContain("Your response was not lost");
    expect(serialized).not.toContain("PRIVATE_TRANSFER_SENTINEL");
  });
});
