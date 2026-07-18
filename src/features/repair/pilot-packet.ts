import type { Receipt } from "./contracts";
import type { PublicActivity } from "./public-activities";

type PilotPacketInput = Readonly<{
  activity: PublicActivity;
  originalResponse: string;
  revisedResponse: string;
  revisionReceipt: Receipt;
  transferResponse: string;
  transferReceipt: Receipt;
}>;

const formatRubric = (title: string, receipt: Receipt): ReadonlyArray<string> => [
  title,
  ...receipt.rubric.flatMap((criterion) => [
    `[${criterion.after.toUpperCase()}] ${criterion.label}`,
    `Evidence: ${criterion.evidence ? `“${criterion.evidence}”` : "No direct evidence."}`,
  ]),
];

export const buildPilotPacket = ({
  activity,
  originalResponse,
  revisedResponse,
  revisionReceipt,
  transferResponse,
  transferReceipt,
}: PilotPacketInput): string =>
  [
    "REASONPATCH EDUCATOR PILOT PACKET",
    "DRAFT PILOT INSTRUMENT — NOT VALIDATED — NOT A GRADE",
    "",
    "Privacy: de-identify learner text before sharing. This file is created locally in the browser.",
    "",
    `ACTIVITY: ${activity.title}`,
    "",
    "ORIGINAL TASK",
    activity.prompt,
    "",
    "ORIGINAL RESPONSE",
    originalResponse,
    "",
    "SUBMITTED REVISION",
    revisedResponse,
    "",
    `REPAIR RECEIPT PROVENANCE: ${revisionReceipt.provenance.mode} · ${revisionReceipt.provenance.model}`,
    ...formatRubric("RUBRIC EVIDENCE AFTER REVISION", revisionReceipt),
    "",
    "FRESH CASE — ADMINISTER WITHOUT A HINGE HINT OR REPLACEMENT ANSWER",
    activity.transferPrompt,
    "",
    "FRESH-CASE RESPONSE",
    transferResponse,
    "",
    `TRANSFER SLIP PROVENANCE: ${transferReceipt.provenance.mode} · ${transferReceipt.provenance.model}`,
    ...formatRubric("RUBRIC EVIDENCE IN THE FRESH CASE", transferReceipt),
    "",
    "BLINDED EDUCATOR REVIEW",
    "Hinge repaired: [ ] No  [ ] Partial  [ ] Yes",
    "Reasoning quality: [ ] 0  [ ] 1  [ ] 2",
    "Answer leakage: [ ] No  [ ] Yes",
    "Notes:",
    "",
    "PILOT PROTOCOL",
    "1. De-identify both responses before a rater sees them.",
    "2. Administer the fresh case without ReasonPatch assistance, ideally after a delay.",
    "3. Blind the educator rater to the learner's assistance condition.",
    "4. Score reasoning evidence, not writing polish or identity.",
    "5. Compare aggregate results with an answer-first condition; do not treat one slip as a learning claim.",
    "",
    "Observed text evidence in a new context — not proof of learning or a verdict about the learner.",
  ].join("\n");

export const pilotPacketFilename = (activity: PublicActivity): string =>
  `reasonpatch-${activity.id}-pilot-packet.txt`;
