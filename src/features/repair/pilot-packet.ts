import type { ActivityId, Receipt } from "./contracts";
import type { PublicActivity } from "./public-activities";

type PilotArtifactInput = Readonly<{
  activity: PublicActivity;
  originalResponse: string;
  revisedResponse: string;
  revisionReceipt: Receipt;
  transferResponse: string;
  transferReceipt: Receipt;
}>;

type PilotStage = "original" | "revision" | "fresh";
type AnonymousId = "A" | "B" | "C";

type ResponseRecord = Readonly<{
  id: AnonymousId;
  stage: PilotStage;
  prompt: string;
  text: string;
}>;

const ANONYMOUS_IDS: ReadonlyArray<AnonymousId> = ["A", "B", "C"];

const STAGE_PERMUTATIONS: Readonly<Record<ActivityId, ReadonlyArray<PilotStage>>> = {
  "correlation-causation": ["fresh", "original", "revision"],
  "base-rate-neglect": ["revision", "fresh", "original"],
  "sampling-bias": ["original", "fresh", "revision"],
};

const BLINDING_REDACTIONS: ReadonlyArray<Readonly<[RegExp, string]>> = [
  [/reasonpatch/giu, "⟦REDACTED: CONDITION LABEL⟧"],
  [/provenance/giu, "⟦REDACTED: METADATA LABEL⟧"],
  [/demo[ -]fixture/giu, "⟦REDACTED: EXECUTION LABEL⟧"],
  [/\[(?:met|missing)\]/giu, "⟦REDACTED: STATE LABEL⟧"],
  [/original[ -]response/giu, "⟦REDACTED: STAGE LABEL⟧"],
  [/submitted[ -]revision/giu, "⟦REDACTED: STAGE LABEL⟧"],
  [/fresh[ -]case[ -]response/giu, "⟦REDACTED: STAGE LABEL⟧"],
];

const UNSAFE_CHARACTER =
  /[\u0000-\u0009\u000B\u000C\u000E-\u001F\u007F-\u009F\u061C\u200B-\u200F\u2028-\u202E\u2060-\u2069\uFEFF]/gu;

const visibleCodePoint = (character: string): string =>
  `⟦U+${character.codePointAt(0)?.toString(16).toUpperCase().padStart(4, "0")}⟧`;

const encodeUnsafeCharacters = (value: string): string =>
  value
    .replace(/\r\n/gu, "\n")
    .replace(/\r/gu, "⟦U+000D⟧")
    .replace(UNSAFE_CHARACTER, visibleCodePoint);

const redactBlindingLeaks = (value: string): string =>
  BLINDING_REDACTIONS.reduce(
    (redacted, [pattern, replacement]) => redacted.replace(pattern, replacement),
    value,
  );

const formatLearnerText = (
  record: ResponseRecord,
  blinded: boolean,
): ReadonlyArray<string> => {
  const source = blinded ? redactBlindingLeaks(record.text) : record.text;
  const numberedLines = encodeUnsafeCharacters(source)
    .split("\n")
    .map((line, index) => `${String(index + 1).padStart(4, "0")} | ${line}`);

  return [
    `BEGIN RESPONSE ${record.id} LEARNER TEXT`,
    ...numberedLines,
    `END RESPONSE ${record.id} LEARNER TEXT`,
  ];
};

const encodeInline = (value: string): string =>
  encodeUnsafeCharacters(value).replace(/\n/gu, "⟦U+000A⟧");

const buildResponseRecords = ({
  activity,
  originalResponse,
  revisedResponse,
  transferResponse,
}: PilotArtifactInput): ReadonlyArray<ResponseRecord> => {
  const sources: Readonly<Record<PilotStage, Omit<ResponseRecord, "id">>> = {
    original: { stage: "original", prompt: activity.prompt, text: originalResponse },
    revision: { stage: "revision", prompt: activity.prompt, text: revisedResponse },
    fresh: { stage: "fresh", prompt: activity.transferPrompt, text: transferResponse },
  };

  return STAGE_PERMUTATIONS[activity.id].map((stage, index) => ({
    ...sources[stage],
    id: ANONYMOUS_IDS[index] ?? "C",
  }));
};

const formatAuditRubric = (
  stage: PilotStage,
  { revisionReceipt, transferReceipt }: PilotArtifactInput,
): ReadonlyArray<string> => {
  const receipt = stage === "fresh" ? transferReceipt : revisionReceipt;

  return receipt.rubric.flatMap((criterion) => {
    const state = stage === "original" ? criterion.before : criterion.after;
    const evidence = stage === "original" ? null : criterion.evidence;
    return [
      `[${state.toUpperCase()}] ${encodeInline(criterion.label)}`,
      `Evidence: ${evidence ? `“${encodeInline(evidence)}”` : "No direct evidence."}`,
    ];
  });
};

const formatAuditRecord = (
  record: ResponseRecord,
  input: PilotArtifactInput,
): ReadonlyArray<string> => {
  const receipt = record.stage === "fresh" ? input.transferReceipt : input.revisionReceipt;
  const provenance =
    record.stage === "original"
      ? "learner submission · no automated scan"
      : `${receipt.provenance.mode} · ${receipt.provenance.model}`;

  return [
    `RESPONSE ${record.id}`,
    `STAGE: ${record.stage}`,
    `PROVENANCE: ${provenance}`,
    "TASK",
    record.prompt,
    ...formatLearnerText(record, false),
    "RECORDED RUBRIC STATES",
    ...formatAuditRubric(record.stage, input),
  ];
};

const formatBlankReview = (
  record: ResponseRecord,
  activity: PublicActivity,
): ReadonlyArray<string> => [
  `ANONYMOUS RESPONSE ${record.id}`,
  "TASK",
  record.prompt,
  ...formatLearnerText(record, true),
  "BLANK RUBRIC — COMPLETE WITHOUT AUTOMATED ASSISTANCE",
  ...activity.rubric.map(
    ({ label }) => `${label}: [ ] 0  [ ] 1  [ ] 2`,
  ),
  "Hinge repaired: [ ] No  [ ] Partial  [ ] Yes",
  "Reasoning quality: [ ] 0  [ ] 1  [ ] 2",
  "Answer leakage: [ ] No  [ ] Yes",
  "Notes:",
];

export const buildPilotArtifacts = (input: PilotArtifactInput) => {
  const records = buildResponseRecords(input);
  const auditManifest = [
    "REASONPATCH COORDINATOR AUDIT MANIFEST",
    "DRAFT PILOT INSTRUMENT — NOT VALIDATED — NOT A GRADE",
    "Contains raw submitted text. De-identify before sharing either artifact.",
    "",
    "PRIVATE ID MAP",
    ...records.map(({ id, stage }) => `RESPONSE ${id} -> ${stage}`),
    "",
    ...records.flatMap((record) => [...formatAuditRecord(record, input), ""]),
  ].join("\n");
  const blindedRaterPacket = [
    "BLINDED REASONING REVIEW PACKET",
    "DRAFT INSTRUMENT — NOT VALIDATED — NOT A GRADE",
    "PRIVACY CHECK — Verify that all learner text is de-identified before release.",
    "Responses use anonymous IDs and a non-chronological order.",
    "",
    ...records.flatMap((record) => [...formatBlankReview(record, input.activity), ""]),
  ].join("\n");

  return { auditManifest, blindedRaterPacket } as const;
};

export const pilotArtifactFilenames = (activity: PublicActivity) => ({
  audit: `reasonpatch-${activity.id}-audit-manifest.txt`,
  blinded: `reasonpatch-${activity.id}-blinded-rater-packet.txt`,
}) as const;
