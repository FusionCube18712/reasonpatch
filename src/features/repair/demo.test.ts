import { describe, expect, it } from "vitest";

import { createDemoAnalysis, createDemoReceipt } from "./demo";
import { validAnalyzeRequest } from "../../../test/fixtures";

describe("judge-safe demo fixtures", () => {
  it("replays the same validated result shape without an API key", () => {
    const result = createDemoAnalysis({
      ...validAnalyzeRequest,
      mode: "demo",
    });

    expect(result.runId).toBe("demo_correlation_causation");
    expect(result.trace.plannerModel).toBe("demo-fixture");
    expect(result.trace.probes).toHaveLength(3);
    expect(result.diagnosis.socraticQuestion).toContain("motivated students");
  });

  it("shows a truthful Sol takeover trace in the fallback scenario", () => {
    const result = createDemoAnalysis({
      ...validAnalyzeRequest,
      mode: "demo",
      forceLunaFallback: true,
    });

    expect(result.trace.degraded).toBe(true);
    expect(
      result.trace.probes.every(
        (probe) =>
          probe.model === "gpt-5.6-sol" &&
          probe.status === "fallback" &&
          probe.fallbackReason === "forced",
      ),
    ).toBe(true);
  });

  it("produces a reviewable receipt without claiming mastery", () => {
    const receipt = createDemoReceipt({
      activityId: "correlation-causation",
      originalResponse: validAnalyzeRequest.response,
      revisedResponse:
        "Participants averaged eight points higher, but because students chose whether to participate, the difference alone does not establish causation. We need comparable baseline scores and random assignment or a controlled comparison.",
      mode: "demo",
    });

    expect(receipt.changes).toHaveLength(2);
    expect(receipt.rubric.every(({ after }) => after === "met")).toBe(true);
    expect(JSON.stringify(receipt).toLowerCase()).not.toContain("master");
  });
});
