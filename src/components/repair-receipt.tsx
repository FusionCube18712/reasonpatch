"use client";

import {
  ArrowRight,
  Check,
  Circle,
  Printer,
  ShieldCheck,
} from "@phosphor-icons/react";

import type { Receipt } from "@/features/repair/contracts";

const primaryButtonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#25231f] px-5 text-sm font-medium text-[#f8f4eb] transition duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[#a24f24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a24f24] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5f1e8] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45";

export function RepairReceipt({
  receipt,
  onBeginTransfer,
}: Readonly<{ receipt: Receipt; onBeginTransfer: () => void }>) {
  return (
    <section
      aria-labelledby="receipt-title"
      className="print-receipt stage-enter mt-10 rounded-[2rem] border border-[#25231f]/16 bg-white p-6 sm:p-8"
    >
      <div className="flex flex-col gap-5 border-b border-[#25231f]/10 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#a24f24]">
            AI-generated challenge, not a grade
          </p>
          <h2
            id="receipt-title"
            className="mt-2 text-3xl font-semibold tracking-[-0.045em]"
          >
            Repair receipt
          </h2>
          <p className="mt-2 text-sm text-[#625e56]">{receipt.repairedHinge}</p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="no-print inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-[#25231f]/16 px-4 text-xs font-medium transition hover:border-[#25231f]/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a24f24] active:translate-y-px"
        >
          <Printer size={15} aria-hidden="true" />
          Print receipt
        </button>
      </div>

      <p className="mt-6 max-w-[65ch] text-sm leading-6 text-[#514d46]">
        {receipt.summary}
      </p>
      <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[#625e56]">
        Provenance · {receipt.provenance.mode} · {receipt.provenance.model}
      </p>

      <div className="mt-7 divide-y divide-[#25231f]/10 border-y border-[#25231f]/10">
        {receipt.changes.map((change) => (
          <div
            key={change.label}
            className="grid gap-3 py-5 sm:grid-cols-[0.38fr_1fr]"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#625e56]">
              {change.label}
            </p>
            <div className="text-sm leading-6">
              {change.before ? (
                <p className="text-[#625e56] line-through decoration-[#a24f24]/55">
                  {change.before}
                </p>
              ) : null}
              <p className="mt-1 text-[#34312d]">{change.after}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-7">
        <h3 className="text-sm font-medium">Rubric evidence after revision</h3>
        <ul className="mt-3 divide-y divide-[#25231f]/10">
          {receipt.rubric.map((criterion) => (
            <li
              key={criterion.id}
              className="grid gap-2 py-4 sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div>
                <p className="text-sm">{criterion.label}</p>
                {criterion.evidence ? (
                  <p className="mt-1 text-xs leading-5 text-[#625e56]">
                    “{criterion.evidence}”
                  </p>
                ) : (
                  <p className="mt-1 text-xs leading-5 text-[#625e56]">
                    No direct evidence yet.
                  </p>
                )}
              </div>
              <span
                aria-label={`Rubric state: ${criterion.after}`}
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

      {receipt.remainingCaveat ? (
        <div className="mt-6 flex gap-3 rounded-2xl bg-[#f0ebe2] p-4 text-xs leading-5 text-[#625e56]">
          <ShieldCheck
            size={17}
            className="mt-0.5 shrink-0"
            aria-hidden="true"
          />
          <p>{receipt.remainingCaveat}</p>
        </div>
      ) : null}

      <div className="no-print mt-7 flex flex-col gap-4 border-t border-[#25231f]/12 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#a24f24]">
            Next · check application
          </p>
          <p className="mt-2 max-w-[52ch] text-xs leading-5 text-[#625e56]">
            Open a fresh context with this diagnosis, question, rubric, and
            receipt removed from view.
          </p>
        </div>
        <button
          type="button"
          onClick={onBeginTransfer}
          className={`${primaryButtonClass} shrink-0`}
        >
          Begin isolated fresh case
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
