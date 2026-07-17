"use client";

import {
  ArrowCounterClockwise,
  ArrowRight,
  Check,
  Circle,
  GitDiff,
  Lightning,
  Printer,
  ShieldCheck,
  Sparkle,
  WarningCircle,
} from "@phosphor-icons/react";
import { useMemo, useState } from "react";

import { getActivity, listActivities } from "@/features/repair/activities";
import type {
  AnalysisResult,
  AnalyzeRequest,
  Receipt,
} from "@/features/repair/contracts";

type ApiEnvelope<T> = Readonly<{
  success: boolean;
  data: T | null;
  error: Readonly<{ code: string; message: string }> | null;
}>;

type RunMode = AnalyzeRequest["mode"];
type LoadingTask = "analysis" | "receipt" | null;

const activities = listActivities().map(({ public: activity }) => activity);

const buttonClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#25231f] px-5 text-sm font-medium text-[#f8f4eb] transition duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-[#a24f24] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a24f24] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5f1e8] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45";

export function RepairStudio() {
  const [activityId, setActivityId] = useState("correlation-causation");
  const activity = useMemo(() => getActivity(activityId).public, [activityId]);
  const [response, setResponse] = useState(activity.sampleResponse);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [revision, setRevision] = useState("");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingTask, setLoadingTask] = useState<LoadingTask>(null);
  const [forceFallback, setForceFallback] = useState(false);
  const [mode, setMode] = useState<RunMode>("demo");
  const [errorAction, setErrorAction] = useState<"analysis" | "receipt">("analysis");

  const selectActivity = (nextId: string) => {
    const next = getActivity(nextId).public;
    setActivityId(next.id);
    setResponse(next.sampleResponse);
    setAnalysis(null);
    setRevision("");
    setReceipt(null);
    setError(null);
  };

  const analyze = async () => {
    setError(null);
    setErrorAction("analysis");
    setLoadingTask("analysis");
    try {
      const result = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityId: activity.id,
          response,
          mode,
          forceLunaFallback: forceFallback,
        }),
      });
      const envelope = (await result.json()) as ApiEnvelope<AnalysisResult>;
      if (!result.ok || !envelope.success || !envelope.data) {
        throw new Error(envelope.error?.message ?? "Analysis is temporarily unavailable.");
      }
      setAnalysis(envelope.data);
      setRevision("");
      setReceipt(null);
    } catch (caught) {
      setAnalysis(null);
      setError(caught instanceof Error ? caught.message : "Analysis is temporarily unavailable.");
    } finally {
      setLoadingTask(null);
    }
  };

  const createReceipt = async () => {
    setError(null);
    setErrorAction("receipt");
    setLoadingTask("receipt");
    try {
      const result = await fetch("/api/revise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityId: activity.id,
          originalResponse: response,
          revisedResponse: revision,
          mode,
        }),
      });
      const envelope = (await result.json()) as ApiEnvelope<Receipt>;
      if (!result.ok || !envelope.success || !envelope.data) {
        throw new Error(envelope.error?.message ?? "The receipt could not be created yet.");
      }
      setReceipt(envelope.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The receipt could not be created yet.");
    } finally {
      setLoadingTask(null);
    }
  };

  return (
    <section className="px-4 sm:px-6 lg:px-10" aria-label="Reasoning repair workspace">
      <div className="mx-auto max-w-[1400px] overflow-hidden rounded-[2rem] border border-[#25231f]/14 bg-[#fbf8f1] shadow-[0_28px_80px_-50px_rgba(71,52,34,0.4)] lg:rounded-[2.5rem]">
        <div className="no-print grid border-b border-[#25231f]/12 lg:grid-cols-[1fr_auto]">
          <div className="flex gap-2 overflow-x-auto px-4 py-4 sm:px-6">
            {activities.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => selectActivity(item.id)}
                aria-pressed={item.id === activity.id}
                className={`shrink-0 rounded-full border px-4 py-2 text-left text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a24f24] ${
                  item.id === activity.id
                    ? "border-[#25231f] bg-[#25231f] text-[#f8f4eb]"
                    : "border-[#25231f]/14 bg-transparent text-[#625e56] hover:border-[#25231f]/40"
                }`}
              >
                <span className="mr-2 font-mono text-[10px]">0{index + 1}</span>
                {item.title}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 border-t border-[#25231f]/12 px-4 py-3 lg:border-l lg:border-t-0">
            {(["demo", "live"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setMode(item)}
                aria-pressed={mode === item}
                className={`rounded-full px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a24f24] ${
                  mode === item ? "bg-[#e8dfd2] text-[#25231f]" : "text-[#625e56]"
                }`}
              >
                {item === "demo" ? "Guided demo" : "Live GPT-5.6"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-[0.82fr_1.18fr]">
          <aside className="border-b border-[#25231f]/12 bg-[#eee7dc] p-6 sm:p-8 lg:border-b-0 lg:border-r lg:p-10">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#a24f24]">
              {activity.eyebrow}
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
              {activity.title}
            </h2>
            <p className="mt-5 max-w-[48ch] text-[15px] leading-7 text-[#5e5951]">
              {activity.prompt}
            </p>

            <div className="mt-10 border-t border-[#25231f]/14 pt-6">
              <div className="flex items-center gap-2">
                <ShieldCheck size={17} weight="regular" aria-hidden="true" />
                <h3 id="rubric-title" className="text-sm font-medium">
                  Visible rubric
                </h3>
              </div>
              <ul aria-labelledby="rubric-title" className="mt-4 divide-y divide-[#25231f]/10">
                {activity.rubric.map((criterion) => (
                  <li key={criterion.id} className="flex gap-3 py-3 text-sm leading-5 text-[#625e56]">
                    <Circle size={14} className="mt-0.5 shrink-0 text-[#a24f24]" aria-hidden="true" />
                    {criterion.label}
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <div className="p-6 sm:p-8 lg:p-10 xl:p-12">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#625e56]">
                  Step 01 · Explain
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-[-0.025em]">
                  Show the reasoning you want to inspect
                </h2>
              </div>
              <span className="hidden rounded-full border border-[#25231f]/12 px-3 py-1.5 text-[11px] text-[#777168] sm:inline-flex">
                Answer withheld
              </span>
            </div>

            <div className="mt-7">
              <label htmlFor="learner-response" className="text-sm font-medium">
                Your explanation
              </label>
              <p id="response-help" className="mt-1 text-xs leading-5 text-[#625e56]">
                Use 2–5 sentences. The sample is intentionally flawed.
              </p>
              <textarea
                id="learner-response"
                aria-describedby="response-help"
                value={response}
                onChange={(event) => setResponse(event.target.value)}
                className="mt-3 min-h-36 w-full resize-y rounded-2xl border border-[#25231f]/16 bg-white/65 p-4 text-[15px] leading-7 text-[#393631] outline-none transition placeholder:text-[#6f685f] focus:border-[#a24f24] focus:ring-2 focus:ring-[#a24f24]/15"
              />
              <div className="mt-2 flex justify-between gap-4 text-[11px] text-[#625e56]">
                <span>No names or personal details</span>
                <span className="font-mono">{response.length} / 3000</span>
              </div>
            </div>

            <div className="no-print mt-7 flex flex-col gap-4 border-t border-[#25231f]/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <label className="inline-flex cursor-pointer items-center gap-3 text-xs text-[#625e56]">
                <input
                  type="checkbox"
                  checked={forceFallback}
                  onChange={(event) => setForceFallback(event.target.checked)}
                  className="size-4 accent-[#a24f24]"
                />
                Demonstrate Sol fallback
              </label>
              <button type="button" onClick={analyze} disabled={loadingTask !== null} className={buttonClass}>
                {loadingTask === "analysis" ? "Locating the hinge…" : "Find the hinge"}
                {loadingTask !== "analysis" ? <ArrowRight size={16} aria-hidden="true" /> : null}
              </button>
            </div>

            {loadingTask === "analysis" ? <AnalysisSkeleton /> : null}

            {error ? (
              <div role="alert" className="stage-enter mt-7 rounded-2xl border border-[#a24f24]/30 bg-[#f7e9df] p-4 text-sm text-[#6d351b]">
                <div className="flex gap-3">
                  <WarningCircle size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <div>
                    <p>{error}</p>
                    <button
                      type="button"
                      onClick={errorAction === "analysis" ? analyze : createReceipt}
                      className="mt-3 inline-flex items-center gap-2 font-medium underline decoration-[#a24f24]/40 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a24f24]"
                    >
                      <ArrowCounterClockwise size={15} aria-hidden="true" />
                      Try again
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {analysis ? (
              <div className="stage-enter mt-10 border-t border-[#25231f]/14 pt-9">
                <p role="status" className="inline-flex items-center gap-2 text-xs font-medium text-[#386044]">
                  <Check size={15} weight="bold" aria-hidden="true" />
                  Repair crew complete
                </p>
                <TraceView analysis={analysis} />

                <div className="mt-8 grid gap-7 xl:grid-cols-[0.8fr_1.2fr]">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#625e56]">
                      Earliest unsupported inference
                    </p>
                    <blockquote className="mt-3 border-l-2 border-[#a24f24] pl-4 text-sm leading-6 text-[#5f5a52]">
                      “{analysis.diagnosis.hingeQuote}”
                    </blockquote>
                    <p className="mt-4 text-xs leading-5 text-[#625e56]">
                      {analysis.diagnosis.explanation}
                    </p>
                  </div>
                  <div className="rounded-[1.75rem] bg-[#25231f] p-6 text-[#f8f4eb] sm:p-7">
                    <div className="flex items-center gap-2 text-[#d8a37d]">
                      <Sparkle size={17} weight="regular" aria-hidden="true" />
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em]">Smallest useful question</p>
                    </div>
                    <h2 id="question-title" className="mt-5 text-2xl font-medium leading-tight tracking-[-0.035em]">
                      One question before you revise
                    </h2>
                    <p className="mt-4 text-lg leading-7 text-[#f8f4eb]">
                      {analysis.diagnosis.socraticQuestion}
                    </p>
                    <p className="mt-5 text-xs leading-5 text-[#c8c0b5]">
                      {analysis.diagnosis.whyThisQuestion}
                    </p>
                  </div>
                </div>

                <div className="mt-9">
                  <div className="flex items-center gap-2">
                    <GitDiff size={18} aria-hidden="true" />
                    <label htmlFor="revision" className="text-sm font-medium">
                      Revised explanation
                    </label>
                  </div>
                  <p id="revision-help" className="mt-1 text-xs leading-5 text-[#625e56]">
                    Make the change yourself. ReasonPatch will compare evidence, not write the answer.
                  </p>
                  <textarea
                    id="revision"
                    aria-describedby="revision-help"
                    value={revision}
                    onChange={(event) => setRevision(event.target.value)}
                    placeholder="Revise the hinge in your own words…"
                    className="mt-3 min-h-36 w-full resize-y rounded-2xl border border-[#25231f]/16 bg-white/65 p-4 text-[15px] leading-7 outline-none transition focus:border-[#a24f24] focus:ring-2 focus:ring-[#a24f24]/15"
                  />
                  <div className="no-print mt-5 flex justify-end">
                    <button
                      type="button"
                      onClick={createReceipt}
                      disabled={loadingTask !== null || revision.trim().length < 36}
                      className={buttonClass}
                    >
                      {loadingTask === "receipt" ? "Comparing the revision…" : "Create repair receipt"}
                      {loadingTask !== "receipt" ? <ArrowRight size={16} aria-hidden="true" /> : null}
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {receipt ? <ReceiptView receipt={receipt} /> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function AnalysisSkeleton() {
  return (
    <div aria-live="polite" aria-label="Analysis in progress" className="mt-8 border-t border-[#25231f]/10 pt-8">
      <div className="flex items-center gap-3 text-xs text-[#777168]">
        <Lightning size={16} className="text-[#a24f24]" aria-hidden="true" />
        Sol is locating the hinge while three Luna probes inspect it.
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {["Counterexample", "Assumption", "Rubric"].map((label, index) => (
          <div key={label} className="rounded-2xl border border-[#25231f]/10 p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#625e56]">{label}</p>
            <div className={`skeleton-line mt-4 h-2 rounded-full ${index === 1 ? "w-4/5" : "w-full"}`} />
            <div className="skeleton-line mt-2 h-2 w-3/5 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

function TraceView({ analysis }: Readonly<{ analysis: AnalysisResult }>) {
  return (
    <div aria-label="Repair crew trace" className="mt-5 grid gap-px overflow-hidden rounded-2xl border border-[#25231f]/10 bg-[#25231f]/10 sm:grid-cols-3">
      {analysis.trace.probes.map((probe) => (
        <div key={probe.role} className="bg-[#fbf8f1] p-4">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#625e56]">{probe.role}</span>
            <span className={`size-1.5 rounded-full ${probe.status === "fallback" ? "bg-[#a24f24]" : "bg-[#477453]"}`} />
          </div>
          <p className="mt-2 text-xs font-medium">
            {probe.status === "fallback" ? "Sol takeover" : "Luna complete"}
          </p>
          <p className="mt-1 font-mono text-[9px] text-[#625e56]">{probe.latencyMs} ms · {probe.model}</p>
        </div>
      ))}
      {analysis.trace.degraded ? <p className="sr-only">Fallback disclosed</p> : null}
    </div>
  );
}

function ReceiptView({ receipt }: Readonly<{ receipt: Receipt }>) {
  return (
    <section aria-labelledby="receipt-title" className="print-receipt stage-enter mt-10 rounded-[2rem] border border-[#25231f]/16 bg-white p-6 sm:p-8">
      <div className="flex flex-col gap-5 border-b border-[#25231f]/10 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#a24f24]">AI-generated challenge, not a grade</p>
          <h2 id="receipt-title" className="mt-2 text-3xl font-semibold tracking-[-0.045em]">Repair receipt</h2>
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

      <p className="mt-6 max-w-[65ch] text-sm leading-6 text-[#514d46]">{receipt.summary}</p>

      <div className="mt-7 divide-y divide-[#25231f]/10 border-y border-[#25231f]/10">
        {receipt.changes.map((change) => (
          <div key={change.label} className="grid gap-3 py-5 sm:grid-cols-[0.38fr_1fr]">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#625e56]">{change.label}</p>
            <div className="text-sm leading-6">
              {change.before ? <p className="text-[#625e56] line-through decoration-[#a24f24]/55">{change.before}</p> : null}
              <p className="mt-1 text-[#34312d]">{change.after}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-7">
        <h3 className="text-sm font-medium">Rubric evidence after revision</h3>
        <ul className="mt-3 divide-y divide-[#25231f]/10">
          {receipt.rubric.map((criterion) => (
            <li key={criterion.id} className="grid gap-2 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p className="text-sm">{criterion.label}</p>
                <p className="mt-1 text-xs leading-5 text-[#625e56]">“{criterion.evidence}”</p>
              </div>
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#e5eee7] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.1em] text-[#386044]">
                <Check size={12} weight="bold" aria-hidden="true" />
                {criterion.after}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {receipt.remainingCaveat ? (
        <div className="mt-6 flex gap-3 rounded-2xl bg-[#f0ebe2] p-4 text-xs leading-5 text-[#625e56]">
          <ShieldCheck size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
          <p>{receipt.remainingCaveat}</p>
        </div>
      ) : null}
    </section>
  );
}
