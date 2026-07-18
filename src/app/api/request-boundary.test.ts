import { describe, expect, it } from "vitest";

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
      request(JSON.stringify({ text: "x".repeat(17_000) }), {
        "Content-Type": "application/json",
      }),
      413,
    ],
  ] as const)("rejects unsafe or oversized request bodies", async (input, status) => {
    const result = await readBoundedJson(input);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(status);
  });
});
