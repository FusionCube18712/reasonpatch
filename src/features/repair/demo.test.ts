import { describe, expect, it } from "vitest";

import { createDemoAnalysis, createDemoReceipt } from "./demo";
import { getActivity } from "./activities";
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

  it.each([
    ["correlation-causation", "association-as-causation", "Association is not causation"],
    ["base-rate-neglect", "base-rate-neglect", "Accuracy is not the posterior"],
    ["sampling-bias", "sample-size-erases-bias", "Size is not representativeness"],
  ] as const)(
    "keeps the %s demo diagnosis and receipt activity-specific",
    (activityId, misconception, repairedHinge) => {
      const activity = getActivity(activityId).public;
      const analysis = createDemoAnalysis({
        activityId,
        response: activity.sampleResponse,
        mode: "demo",
        forceLunaFallback: false,
      });
      const receipt = createDemoReceipt({
        activityId,
        originalResponse: activity.sampleResponse,
        revisedResponse:
          "My revision now names the missing comparison, qualifies the original conclusion, and states what stronger evidence would be needed before making the claim.",
        mode: "demo",
      });

      expect(analysis.diagnosis.misconception).toBe(misconception);
      expect(activity.sampleResponse).toContain(analysis.diagnosis.hingeQuote);
      expect(receipt.repairedHinge).toBe(repairedHinge);
    },
  );
});
