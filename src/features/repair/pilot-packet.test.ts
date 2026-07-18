import { describe, expect, it } from "vitest";

import { getPublicActivity } from "./public-activities";
import type { Receipt } from "./contracts";
import { buildPilotPacket } from "./pilot-packet";

const revisionReceipt: Receipt = {
  activityId: "correlation-causation",
  repairedHinge: "Association is not causation",
  summary: "The revision addresses visible reasoning criteria.",
  changes: [
    {
      label: "Submitted revision",
      before: "The program caused the improvement.",
      after: "The difference alone does not establish causation.",
    },
  ],
  rubric: [
    {
      id: "association-causation",
      label: "Distinguishes association from causation",
      before: "missing",
      after: "met",
      evidence: "does not establish causation",
    },
    {
      id: "confounder",
      label: "Names a plausible confounder or selection effect",
      before: "missing",
      after: "missing",
      evidence: null,
    },
  ],
  remainingCaveat: "Selection still needs attention.",
  provenance: { model: "demo-fixture", mode: "demo" },
};

describe("educator pilot packet", () => {
  it("exports both attempts, evidence, a fresh case, and an unvalidated review protocol", () => {
    const activity = getPublicActivity("correlation-causation");
    const packet = buildPilotPacket({
      activity,
      originalResponse: activity.sampleResponse,
      revisedResponse: "The difference alone does not establish causation.",
      revisionReceipt,
      transferResponse:
        "The recovery difference does not establish causation because patients chose whether to join.",
      transferReceipt: revisionReceipt,
    });

    expect(packet).toContain("DRAFT PILOT INSTRUMENT — NOT VALIDATED — NOT A GRADE");
    expect(packet).toContain(activity.transferPrompt);
    expect(packet).toContain("does not establish causation");
    expect(packet).toContain("No direct evidence.");
    expect(packet).toContain("Hinge repaired: [ ] No  [ ] Partial  [ ] Yes");
    expect(packet).toContain("Administer the fresh case without ReasonPatch assistance");
  });
});
