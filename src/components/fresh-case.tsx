"use client";

import {
  ArrowCounterClockwise,
  ArrowRight,
  Check,
  Circle,
  DownloadSimple,
  LockKey,
  WarningCircle,
} from "@phosphor-icons/react";
import { useEffect, useRef, type RefObject } from "react";

import type { Receipt } from "@/features/repair/contracts";
import type { PublicActivity } from "@/features/repair/public-activities";
import { revealStage } from "@/lib/ui/reveal-stage";

const primaryButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#25231f] px-5 text-sm font-medium text-[#f8f4eb] transition duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[#a24f24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a24f24] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5f1e8] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45";

const downloadButtonClass =
  "inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-[#25231f]/20 bg-[#fbf8f1] px-4 text-xs font-medium transition hover:border-[#25231f]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a24f24] active:translate-y-px";

type FreshCaseProps = Readonly<{
  activity: PublicActivity;
  response: string;
  receipt: Receipt | null;
  busy: boolean;
  error: string | null;
  onResponseChange: (response: string) => void;
  onSubmit: () => void;
  onRetry: () => void;
  onDownloadBlinded: () => void;
  onDownloadAudit: () => void;
}>;

export function FreshCase({
  activity,
  response,
  receipt,
  busy,
  error,
  onResponseChange,
  onSubmit,
  onRetry,
  onDownloadBlinded,
  onDownloadAudit,
}: FreshCaseProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const slipHeadingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    revealStage(headingRef.current);
  }, []);

  useEffect(() => {
    if (receipt) revealStage(slipHeadingRef.current);
  }, [receipt]);

  return (
    <section
      aria-labelledby="transfer-title"
      className="stage-enter mx-auto max-w-4xl rounded-[2rem] border border-[#25231f]/16 bg-[#eee7dc] p-6 sm:p-8 lg:p-10"
    >
      <div className="flex flex-col gap-5 border-b border-[#25231f]/12 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#a24f24]">
            Step 04 · Isolated fresh case
          </p>
          <h2
            ref={headingRef}
            id="transfer-title"
            tabIndex={-1}
            className="mt-2 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl"
          >
            Try the reasoning on a fresh case
          </h2>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[#386044]/20 bg-[#e5eee7] px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-[#386044]">
          <LockKey size={13} aria-hidden="true" />
          Prior context hidden
        </span>
      </div>

      <p className="mt-6 max-w-[66ch] text-sm leading-6 text-[#625e56]">
        One successful edit is not evidence of transfer. Prior diagnosis,
        question, rubric, and receipt are hidden during this immediate
        fresh-context check.
      </p>
      <div className="mt-6 rounded-2xl border border-[#25231f]/12 bg-[#fbf8f1] p-5 text-sm leading-6 text-[#393631]">
        {activity.transferPrompt}
      </div>
      <label
        htmlFor="transfer-response"
        className="mt-6 block text-sm font-medium"
      >
        Fresh-case explanation
      </label>
      <p id="transfer-help" className="mt-1 text-xs leading-5 text-[#625e56]">
        After submission, a transparent guided scan checks the same public
        rubric. It makes no model call.
      </p>
      <textarea
        id="transfer-response"
        aria-describedby="transfer-help"
        value={response}
        onChange={(event) => onResponseChange(event.target.value)}
        disabled={busy}
        maxLength={3_000}
        placeholder="Explain the fresh case in your own words…"
        className="mt-3 min-h-36 w-full resize-y rounded-2xl border border-[#25231f]/16 bg-white/80 p-4 text-[15px] leading-7 outline-none transition focus:border-[#a24f24] focus:ring-2 focus:ring-[#a24f24]/15 disabled:cursor-not-allowed disabled:opacity-60"
      />
      <div className="mt-2 flex justify-between gap-4 text-[11px] text-[#625e56]">
        <span>Do not include names or personal details</span>
        <span className="font-mono">{response.length} / 3000</span>
      </div>
      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={onSubmit}
          disabled={busy || response.trim().length < 36}
          className={primaryButtonClass}
        >
          {busy ? "Checking fresh-case evidence…" : "Check transfer evidence"}
          {!busy ? <ArrowRight size={16} aria-hidden="true" /> : null}
        </button>
      </div>

      {error ? (
        <div
          role="alert"
          className="stage-enter mt-6 rounded-2xl border border-[#a24f24]/30 bg-[#f7e9df] p-4 text-sm text-[#6d351b]"
        >
          <div className="flex gap-3">
            <WarningCircle
              size={20}
              className="mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <div>
              <p>{error}</p>
              <button
                type="button"
                onClick={onRetry}
                disabled={busy}
                className="mt-3 inline-flex items-center gap-2 font-medium underline decoration-[#a24f24]/40 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a24f24] disabled:opacity-45"
              >
                <ArrowCounterClockwise size={15} aria-hidden="true" />
                Retry fresh-case scan
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {receipt ? (
        <TransferSlipView
          receipt={receipt}
          headingRef={slipHeadingRef}
          onDownloadBlinded={onDownloadBlinded}
          onDownloadAudit={onDownloadAudit}
        />
      ) : null}
    </section>
  );
}

function TransferSlipView({
  receipt,
  headingRef,
  onDownloadBlinded,
  onDownloadAudit,
}: Readonly<{
  receipt: Receipt;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onDownloadBlinded: () => void;
  onDownloadAudit: () => void;
}>) {
  return (
    <div
      aria-labelledby="transfer-slip-title"
      className="mt-8 border-t border-[#25231f]/14 pt-7"
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#a24f24]">
        Candidate evidence detected · not a verdict
      </p>
      <h2
        ref={headingRef}
        id="transfer-slip-title"
        tabIndex={-1}
        className="mt-2 text-3xl font-semibold tracking-[-0.045em]"
      >
        Transfer slip
      </h2>
      <p className="mt-3 text-sm leading-6 text-[#514d46]">{receipt.summary}</p>
      <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[#625e56]">
        Provenance · deterministic guided rubric scan ·{" "}
        {receipt.provenance.model}
      </p>
      <div className="mt-6">
        <h3 className="text-sm font-medium">
          Candidate rubric evidence in the fresh case
        </h3>
        <ul className="mt-3 divide-y divide-[#25231f]/10">
          {receipt.rubric.map((criterion) => (
            <li
              key={criterion.id}
              className="grid gap-2 py-4 sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div>
                <p className="text-sm">{criterion.label}</p>
                <p className="mt-1 text-xs leading-5 text-[#625e56]">
                  {criterion.evidence
                    ? `“${criterion.evidence}”`
                    : "No direct evidence yet."}
                </p>
              </div>
              <span
                aria-label={`Transfer rubric state: ${criterion.after}`}
                className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-[0.1em] ${
                  criterion.after === "met"
                    ? "bg-[#e5eee7] text-[#386044]"
                    : criterion.after === "emerging"
                      ? "bg-[#f7e9df] text-[#763a1e]"
                      : "bg-[#f0ebe2] text-[#625e56]"
                }`}
              >
                {criterion.after === "met" ? (
                  <Check size={12} weight="bold" aria-hidden="true" />
                ) : (
                  <Circle size={12} weight="bold" aria-hidden="true" />
                )}
                {criterion.after}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-6 rounded-2xl bg-[#fbf8f1] p-4 text-xs leading-5 text-[#625e56]">
        Observed evidence in a new context — not proof of learning or mastery.
      </p>
      <div className="mt-6 border-t border-[#25231f]/12 pt-6">
        <p className="max-w-[62ch] text-xs leading-5 text-[#625e56]">
          Two local-only artifacts keep human review separate from the system
          audit trail. Both contain raw submitted text; a coordinator must
          de-identify them before sharing.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={onDownloadBlinded}
            className={downloadButtonClass}
          >
            <DownloadSimple size={15} aria-hidden="true" />
            Download blinded rater packet
          </button>
          <button
            type="button"
            onClick={onDownloadAudit}
            className={downloadButtonClass}
          >
            <DownloadSimple size={15} aria-hidden="true" />
            Download audit manifest
          </button>
        </div>
      </div>
    </div>
  );
}
