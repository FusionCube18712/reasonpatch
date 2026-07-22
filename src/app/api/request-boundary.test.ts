import { describe, expect, it } from "vitest";

import { CustomReviewRequestSchema } from "@/features/coach/review-contracts";
import { readBoundedJson } from "./request-boundary";

const request = (body: string, headers: HeadersInit = {}) =>
  new Request("http://localhost/api/analyze", {
    method: "POST",
    body,
    headers,
  });

describe("API request boundary", () => {
  it("accepts bounded same-origin JSON", async () => {
    const result = await readBoundedJson(
      request('{"ok":true}', {
        "Content-Type": "application/json",
        Origin: "http://localhost",
      }),
    );

    expect(result).toEqual({ ok: true, body: { ok: true } });
  });

  it.each([
    [request("{}", { "Content-Type": "text/plain" }), 415],
    [
      request("{}", {
        "Content-Type": "application/json",
        Origin: "https://attacker.example",
      }),
      403,
    ],
    [
      request("{}", {
        "Content-Type": "application/json",
        "Sec-Fetch-Site": "cross-site",
      }),
      403,
    ],
    [
      request(JSON.stringify({ text: "x".repeat(100_000) }), {
        "Content-Type": "application/json",
      }),
      413,
    ],
  ] as const)("rejects unsafe or oversized request bodies", async (input, status) => {
    const result = await readBoundedJson(input);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(status);
  });

  it("accepts a schema-valid maximum-sized multibyte live review", async () => {
    const attempt = `hinge ${"界".repeat(5_994)}`;
    const body = {
      source: {
        kind: "custom",
        domain: "formal-logic",
        assignment: "界".repeat(4_000),
        attempt,
        constraints: "界".repeat(2_000),
      },
      diagnosis: {
        hingeQuote: "hinge",
        issueTitle: "Issue title",
        criteria: [
          { id: "first-rule", label: "First visible criterion" },
          { id: "second-rule", label: "Second visible criterion" },
        ],
      },
      revision: `改${"界".repeat(5_999)}`,
      mode: "live",
    } as const;
    expect(CustomReviewRequestSchema.safeParse(body).success).toBe(true);
    const encoded = JSON.stringify(body);
    expect(new TextEncoder().encode(encoded).byteLength).toBeGreaterThan(16_384);

    const result = await readBoundedJson(
      request(encoded, { "Content-Type": "application/json" }),
    );

    expect(result).toEqual({ ok: true, body });
  });

  it("cancels an undeclared chunked body as soon as it crosses the byte limit", async () => {
    const encoder = new TextEncoder();
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode(`{"text":"${"x".repeat(9_000)}`));
        controller.enqueue(encoder.encode("x".repeat(9_000)));
        controller.enqueue(encoder.encode('"}'));
        controller.close();
      },
      cancel() {
        cancelled = true;
      },
    });
    const input = new Request("http://localhost/api/analyze", {
      method: "POST",
      body,
      headers: { "Content-Type": "application/json" },
      // Node's fetch implementation requires this for streaming request bodies.
      duplex: "half",
    } as RequestInit & { duplex: "half" });

    const result = await readBoundedJson(input);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(413);
    expect(cancelled).toBe(true);
  });
});
