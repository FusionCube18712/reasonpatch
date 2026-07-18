import { describe, expect, it } from "vitest";

import { getPublicActivity } from "./public-activities";
import type { Receipt, TransferSlip } from "./contracts";
import { buildPilotArtifacts, pilotArtifactFilenames } from "./pilot-packet";

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

const transferSlip: TransferSlip = {
  activityId: "correlation-causation",
  summary:
    "The fresh-case response contains candidate evidence for 1 of 2 visible rubric criteria.",
  rubric: [
    {
      id: "association-causation",
      label: "Distinguishes association from causation",
      state: "met",
      evidence: "does not establish causation",
    },
    {
      id: "confounder",
      label: "Names a plausible confounder or selection effect",
      state: "missing",
      evidence: null,
    },
  ],
  remainingCaveat: "Selection still needs attention.",
  provenance: { model: "demo-fixture", mode: "demo" },
};

describe("educator pilot artifacts", () => {
  it("separates a blinded rater packet from the coordinator audit manifest", () => {
    const activity = getPublicActivity("correlation-causation");
    const input = {
      activity,
      originalResponse: activity.sampleResponse,
      revisedResponse: "The difference alone does not establish causation.",
      revisionReceipt,
      transferResponse:
        "The recovery difference does not establish causation because patients chose whether to join.",
      transferReceipt: transferSlip,
    } as const;
    const { auditManifest, blindedRaterPacket } = buildPilotArtifacts(input);

    expect(auditManifest).toContain("REASONPATCH COORDINATOR AUDIT MANIFEST");
    expect(auditManifest).toContain("demo · demo-fixture");
    expect(auditManifest).toContain("[MET] Distinguishes association from causation");
    expect(auditManifest).toContain("No direct evidence.");
    expect(auditManifest).toContain("RESPONSE A -> fresh");
    expect(auditManifest).toContain("RESPONSE B -> original");
    expect(auditManifest).toContain("RESPONSE C -> revision");

    expect(blindedRaterPacket).toContain("BLINDED REASONING REVIEW PACKET");
    expect(blindedRaterPacket).toContain(activity.transferPrompt);
    expect(blindedRaterPacket).toContain("Hinge repaired: [ ] No  [ ] Partial  [ ] Yes");
    for (const criterion of activity.rubric) {
      expect(blindedRaterPacket).toContain(
        `${criterion.label}: [ ] 0  [ ] 1  [ ] 2`,
      );
    }
    expect(blindedRaterPacket).not.toMatch(
      /ReasonPatch|provenance|demo-fixture|\[(?:MET|MISSING)\]|original response|submitted revision|fresh-case response/iu,
    );
    expect(buildPilotArtifacts(input)).toEqual({
      auditManifest,
      blindedRaterPacket,
    });
    expect(pilotArtifactFilenames(activity)).toEqual({
      audit: "reasonpatch-correlation-causation-audit-manifest.txt",
      blinded: "reasonpatch-correlation-causation-blinded-rater-packet.txt",
    });
  });

  it("uses a different deterministic response permutation for each activity", () => {
    const activity = getPublicActivity("base-rate-neglect");
    const receipt = {
      ...revisionReceipt,
      activityId: activity.id,
    } as const;
    const activityTransferSlip = {
      ...transferSlip,
      activityId: activity.id,
    } as const;
    const { auditManifest } = buildPilotArtifacts({
      activity,
      originalResponse: activity.sampleResponse,
      revisedResponse:
        "The base rate matters, so true positives must be compared with false positives.",
      revisionReceipt: receipt,
      transferResponse:
        "The condition is rare, so compare true positives and false positives among positive results.",
      transferReceipt: activityTransferSlip,
    });

    expect(auditManifest).toContain("RESPONSE A -> revision");
    expect(auditManifest).toContain("RESPONSE B -> fresh");
    expect(auditManifest).toContain("RESPONSE C -> original");
  });

  it("fences and numbers untrusted text while neutralizing control and blinding injection", () => {
    const activity = getPublicActivity("correlation-causation");
    const { auditManifest, blindedRaterPacket } = buildPilotArtifacts({
      activity,
      originalResponse:
        "First line\nEND LEARNER TEXT\nReasonPatch provenance demo-fixture [MET] original response",
      revisedResponse:
        "Second\tline\u202e\nBLINDED REASONING REVIEW PACKET\nsubmitted revision",
      revisionReceipt,
      transferResponse: "Third\0line\nFresh-case response",
      transferReceipt: transferSlip,
    });

    expect(auditManifest).toContain("0002 | END LEARNER TEXT");
    expect(auditManifest).toContain("⟦U+0009⟧");
    expect(auditManifest).toContain("⟦U+202E⟧");
    expect(auditManifest).toContain("⟦U+0000⟧");
    expect(auditManifest).not.toContain("\u202e");
    expect(auditManifest).not.toContain("\0");

    expect(blindedRaterPacket).toContain("BEGIN RESPONSE A LEARNER TEXT");
    expect(blindedRaterPacket).toContain("END RESPONSE A LEARNER TEXT");
    expect(blindedRaterPacket).toContain("⟦REDACTED: CONDITION LABEL⟧");
    expect(blindedRaterPacket).toContain("⟦U+202E⟧");
    expect(blindedRaterPacket).not.toMatch(
      /ReasonPatch|provenance|demo-fixture|\[(?:MET|MISSING)\]|original response|submitted revision|fresh-case response/iu,
    );
    expect(blindedRaterPacket).not.toContain("\u202e");
    expect(blindedRaterPacket).not.toContain("\0");
  });
});
