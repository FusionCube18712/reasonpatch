import { describe, expect, it, vi } from "vitest";

import { getScenario } from "@/features/coach/scenarios";
import { createCoachDiagnoseHandler } from "./handler";

const guidedRequest = () => {
  const scenario = getScenario("logic-negation-introduction");
  return {
    source: {
      kind: "guided" as const,
      scenarioId: scenario.id,
      attempt: scenario.attempt,
    },
    mode: "demo" as const,
    coachStyle: "socratic" as const,
    forceLunaFallback: false,
  };
};

const customRequest = {
  source: {
    kind: "custom" as const,
    domain: "python" as const,
    assignment:
      "Review this Python function for correctness on every list input.",
    attempt: "def average(nums):\n    return sum(nums) / len(nums)",
    constraints: "Choose an explicit empty-input policy.",
  },
  mode: "live" as const,
  coachStyle: "socratic" as const,
  forceLunaFallback: false,
};

const requestFor = (body: unknown, declaredMode: "demo" | "live") =>
  new Request("https://reasonpatch.local/api/coach/diagnose", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://reasonpatch.local",
      "Sec-Fetch-Site": "same-origin",
      "X-ReasonPatch-Mode": declaredMode,
    },
    body: JSON.stringify(body),
  });

const resultFor = (kind: "guided" | "custom") => ({
  runId: `run_${kind}`,
  source: { kind },
  diagnosis: { issueTitle: "One bounded issue" },
  probes: [],
  trace: { source: kind === "guided" ? "demo-fixture" : "model" },
});

describe("POST /api/coach/diagnose handler", () => {
  it("routes an exact guided scenario to the credential-free coach", async () => {
    const diagnoseGuided = vi.fn(async () => resultFor("guided"));
    const diagnoseLive = vi.fn(async () => resultFor("custom"));
    const handler = createCoachDiagnoseHandler({ diagnoseGuided, diagnoseLive });

    const response = await handler(requestFor(guidedRequest(), "demo"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      success: true,
      data: resultFor("guided"),
      error: null,
    });
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(diagnoseGuided).toHaveBeenCalledWith(guidedRequest());
    expect(diagnoseLive).not.toHaveBeenCalled();
  });

  it("routes custom work only through the live coach", async () => {
    const diagnoseGuided = vi.fn(async () => resultFor("guided"));
    const diagnoseLive = vi.fn(async () => resultFor("custom"));
    const handler = createCoachDiagnoseHandler({ diagnoseGuided, diagnoseLive });

    const response = await handler(requestFor(customRequest, "live"));

    expect(response.status).toBe(200);
    expect(diagnoseLive).toHaveBeenCalledWith(customRequest);
    expect(diagnoseGuided).not.toHaveBeenCalled();
  });

  it("rejects an edited guided fixture and a mode-header mismatch", async () => {
    const diagnoseGuided = vi.fn(async () => resultFor("guided"));
    const diagnoseLive = vi.fn(async () => resultFor("custom"));
    const handler = createCoachDiagnoseHandler({ diagnoseGuided, diagnoseLive });
    const guided = guidedRequest();

    const edited = await handler(
      requestFor(
        {
          ...guided,
          source: { ...guided.source, attempt: `${guided.source.attempt}\n5. done` },
        },
        "demo",
      ),
    );
    const mismatched = await handler(requestFor(customRequest, "demo"));

    expect(edited.status).toBe(400);
    expect(mismatched.status).toBe(400);
    expect(diagnoseGuided).not.toHaveBeenCalled();
    expect(diagnoseLive).not.toHaveBeenCalled();
  });

  it("rejects a missing mode header before invoking either coach", async () => {
    const diagnoseGuided = vi.fn(async () => resultFor("guided"));
    const diagnoseLive = vi.fn(async () => resultFor("custom"));
    const handler = createCoachDiagnoseHandler({ diagnoseGuided, diagnoseLive });
    const request = requestFor(guidedRequest(), "demo");
    request.headers.delete("X-ReasonPatch-Mode");

    const response = await handler(request);

    expect(response.status).toBe(400);
    expect(diagnoseGuided).not.toHaveBeenCalled();
    expect(diagnoseLive).not.toHaveBeenCalled();
  });

  it("returns generic errors without leaking provider details", async () => {
    const handler = createCoachDiagnoseHandler({
      diagnoseGuided: vi.fn(async () => {
        throw new Error("sk-secret UPSTREAM_INTERNAL_SENTINEL");
      }),
      diagnoseLive: vi.fn(async () => resultFor("custom")),
    });

    const response = await handler(requestFor(guidedRequest(), "demo"));
    const serialized = JSON.stringify(await response.json());

    expect(response.status).toBe(503);
    expect(serialized).toContain("Your writing was not lost");
    expect(serialized).not.toMatch(/sk-secret|UPSTREAM_INTERNAL_SENTINEL/iu);
  });

  it("rejects cross-site JSON before invoking either coach", async () => {
    const diagnoseGuided = vi.fn(async () => resultFor("guided"));
    const diagnoseLive = vi.fn(async () => resultFor("custom"));
    const handler = createCoachDiagnoseHandler({ diagnoseGuided, diagnoseLive });
    const request = requestFor(guidedRequest(), "demo");
    request.headers.set("Origin", "https://attacker.example");
    request.headers.set("Sec-Fetch-Site", "cross-site");

    const response = await handler(request);

    expect(response.status).toBe(403);
    expect(diagnoseGuided).not.toHaveBeenCalled();
    expect(diagnoseLive).not.toHaveBeenCalled();
  });
});
