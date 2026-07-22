"use client";

import { ArrowRight, LockKey, Sparkle, WarningCircle } from "@phosphor-icons/react";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";

import type { CoachDiagnosis, DomainId } from "@/features/coach/contracts";
import {
  createInitialSession,
  reduceCoachSession,
} from "@/features/coach/session-reducer";
import { getScenario, listScenarios } from "@/features/coach/scenarios";

import { DomainPicker } from "./domain-picker";
import { HintLadder } from "./hint-ladder";
import {
  ReviewReceiptPanel,
  RevisionPanel,
  TransferPanel,
  type ReviewArtifact,
  type TransferArtifact,
} from "./review-transfer-panels";

type DiagnosisEnvelope = Readonly<{
  success: boolean;
  data: Readonly<{
    diagnosis: CoachDiagnosis;
    trace?: unknown;
    provenance?: unknown;
  }> | null;
  error: Readonly<{ code: string; message: string }> | null;
}>;

type ResultEnvelope<T> = Readonly<{
  success: boolean;
  data: T | null;
  error: Readonly<{ code: string; message: string }> | null;
}>;

const primaryButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#3557c4] px-5 text-sm font-semibold text-white transition hover:bg-[#2947a8] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#3557c4] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#666159] disabled:text-white disabled:hover:bg-[#666159]";

const fieldClass =
  "mt-2 w-full rounded-[14px] border border-[#d8d1c6] bg-white px-4 py-3 text-[15px] leading-6 text-[#20201d] outline-none transition placeholder:text-[#8b857d] focus:border-[#3557c4] focus:ring-3 focus:ring-[#3557c4]/20";

const scenarioForDomain = (domain: DomainId) =>
  listScenarios().find((scenario) => scenario.domain === domain) ??
  getScenario("logic-negation-introduction");

export function OfficeHoursStudio({
  liveModeAvailable = true,
}: Readonly<{ liveModeAvailable?: boolean }>) {
  const [state, dispatch] = useReducer(
    reduceCoachSession,
    undefined,
    createInitialSession,
  );
  const [liveConsent, setLiveConsent] = useState(false);
  const [constraintsOpen, setConstraintsOpen] = useState(false);
  const [transferChecking, setTransferChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trace, setTrace] = useState<unknown>(null);
  const diagnosisHeading = useRef<HTMLHeadingElement>(null);
  const selectedExample = useMemo(
    () => scenarioForDomain(state.domain),
    [state.domain],
  );
  const isGuided = state.mode === "demo" && state.scenarioId !== null;
  const isLoading = state.status === "diagnosing";
  const isReviewing = state.status === "reviewing";
  const isTransferStage =
    state.status === "transferring" || state.status === "complete";
  const review = state.review as ReviewArtifact | null;
  const transfer = state.transfer as TransferArtifact | null;
  const activeScenario = state.scenarioId
    ? getScenario(state.scenarioId)
    : null;
  const canAnalyze =
    state.assignment.trim().length >= 12 &&
    state.attempt.trim().length >= 8 &&
    (isGuided || (liveModeAvailable && liveConsent));

  useEffect(() => {
    if (state.diagnosis) diagnosisHeading.current?.focus();
  }, [state.diagnosis]);

  const changeDraft = (
    field: "assignment" | "constraints" | "attempt",
    value: string,
  ) => {
    setLiveConsent(false);
    setError(null);
    setTrace(null);
    dispatch({ type: "draft.changed", field, value });
  };

  const changeDomain = (domain: DomainId) => {
    if (
      (state.assignment.trim() || state.attempt.trim()) &&
      !window.confirm("Change domains and clear the current coaching context?")
    ) {
      return;
    }
    setLiveConsent(false);
    setError(null);
    setTrace(null);
    dispatch({ type: "draft.changed", field: "domain", value: domain });
  };

  const loadExample = () => {
    setLiveConsent(false);
    setError(null);
    setTrace(null);
    dispatch({ type: "scenario.loaded", scenarioId: selectedExample.id });
  };

  const analyze = async () => {
    if (!canAnalyze) {
      setError(
        isGuided
          ? "Load the exact guided attempt before asking for coaching."
          : "Add the problem and your attempt, then confirm the live processing notice.",
      );
      return;
    }

    setError(null);
    dispatch({ type: "diagnosis.started" });
    const body = isGuided
      ? {
          source: {
            kind: "guided" as const,
            scenarioId: state.scenarioId,
            attempt: state.attempt,
          },
          mode: "demo" as const,
          coachStyle: "socratic" as const,
          forceLunaFallback: false,
        }
      : {
          source: {
            kind: "custom" as const,
            domain: state.domain,
            assignment: state.assignment,
            attempt: state.attempt,
            constraints: state.constraints,
          },
          mode: "live" as const,
          coachStyle: "socratic" as const,
          forceLunaFallback: false,
        };

    try {
      const response = await fetch("/api/coach/diagnose", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-ReasonPatch-Mode": body.mode,
        },
        body: JSON.stringify(body),
      });
      const envelope = (await response.json()) as DiagnosisEnvelope;
      if (!response.ok || !envelope.success || !envelope.data) {
        throw new Error(
          envelope.error?.message ?? "Coaching is temporarily unavailable.",
        );
      }
      setTrace(envelope.data.trace ?? envelope.data.provenance ?? null);
      dispatch({
        type: "diagnosis.received",
        diagnosis: envelope.data.diagnosis,
      });
    } catch (caught) {
      dispatch({ type: "diagnosis.failed" });
      setError(
        caught instanceof Error
          ? caught.message
          : "Coaching is temporarily unavailable. Your writing was not lost.",
      );
    }
  };

  const startRevision = () => dispatch({ type: "revision.started" });

  const reviewRevision = async () => {
    if (
      state.revision.trim().length < 12 ||
      state.revision.trim() === state.attempt.trim() ||
      !state.diagnosis
    ) {
      setError("Change the broken step in your own words before checking it.");
      return;
    }

    setError(null);
    dispatch({ type: "review.started" });
    const body = isGuided
      ? {
          source: {
            kind: "guided" as const,
            scenarioId: state.scenarioId,
            attempt: state.attempt,
          },
          revision: state.revision,
          mode: "demo" as const,
        }
      : {
          source: {
            kind: "custom" as const,
            domain: state.domain,
            assignment: state.assignment,
            attempt: state.attempt,
            constraints: state.constraints,
          },
          diagnosis: {
            hingeQuote: state.diagnosis.hingeQuote,
            issueTitle: state.diagnosis.issueTitle,
            criteria: state.diagnosis.criteria.map(({ id, label }) => ({
              id,
              label,
            })),
          },
          revision: state.revision,
          mode: "live" as const,
        };

    try {
      const response = await fetch("/api/coach/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-ReasonPatch-Mode": body.mode,
        },
        body: JSON.stringify(body),
      });
      const envelope = (await response.json()) as ResultEnvelope<ReviewArtifact>;
      if (!response.ok || !envelope.success || !envelope.data) {
        throw new Error(
          envelope.error?.message ?? "Revision review is temporarily unavailable.",
        );
      }
      dispatch({ type: "review.received", review: envelope.data });
    } catch (caught) {
      dispatch({ type: "review.failed" });
      setError(
        caught instanceof Error
          ? caught.message
          : "Revision review is temporarily unavailable. Your revision was not lost.",
      );
    }
  };

  const startTransfer = () => {
    setError(null);
    setTrace(null);
    dispatch({ type: "transfer.started" });
  };

  const checkTransfer = async () => {
    if (!state.scenarioId || state.transferResponse.trim().length < 12) {
      setError("Explain the fresh case in your own words before checking it.");
      return;
    }

    setError(null);
    setTransferChecking(true);
    try {
      const response = await fetch("/api/coach/transfer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-ReasonPatch-Mode": "demo",
        },
        body: JSON.stringify({
          scenarioId: state.scenarioId,
          response: state.transferResponse,
          mode: "demo",
        }),
      });
      const envelope = (await response.json()) as ResultEnvelope<TransferArtifact>;
      if (!response.ok || !envelope.success || !envelope.data) {
        throw new Error(
          envelope.error?.message ?? "The fresh-case check is temporarily unavailable.",
        );
      }
      dispatch({ type: "transfer.received", transfer: envelope.data });
    } catch (caught) {
      dispatch({ type: "transfer.failed" });
      setError(
        caught instanceof Error
          ? caught.message
          : "The fresh-case check is temporarily unavailable. Your response was not lost.",
      );
    } finally {
      setTransferChecking(false);
    }
  };

  return (
    <section
      id="office-hours-workspace"
      className="mx-auto w-full max-w-[1320px] px-4 pb-16 sm:px-6 lg:px-8"
    >
      <div className="mb-6 flex flex-col gap-5 pt-8 sm:pt-12 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-[#3557c4]">
            AI office hours for your own reasoning
          </p>
          <h1 className="max-w-[18ch] text-3xl font-semibold tracking-[-0.04em] text-[#20201d] sm:text-4xl">
            Work through the step that’s stuck.
          </h1>
          <p className="mt-3 max-w-[66ch] text-[15px] leading-7 text-[#69645d]">
            Paste the problem and your attempt. ReasonPatch will preserve what
            works, point to the first consequential break, and ask one
            question—it won’t complete the work for you.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-[#426c50]">
          <LockKey aria-hidden="true" size={16} weight="bold" />
          Private in this tab
        </div>
      </div>

      <ol
        aria-label="Office-hours progress"
        className="mb-4 grid grid-cols-4 overflow-hidden rounded-xl border border-[#d8d1c6] bg-[#fbf8f1]"
      >
        {["Attempt", "Question", "Revision", "Apply"].map((step, index) => {
          const activeIndex = state.diagnosis
            ? state.status === "transferring" || state.status === "complete"
              ? 3
              : state.status === "revising" ||
                  state.status === "reviewing" ||
                  state.status === "reviewed"
                ? 2
                : 1
            : 0;
          return (
            <li
              key={step}
              aria-current={index === activeIndex ? "step" : undefined}
              className={`min-h-11 border-r border-[#d8d1c6] px-2 py-3 text-center font-mono text-[10px] font-semibold uppercase tracking-[0.12em] last:border-r-0 ${
                index === activeIndex
                  ? "bg-[#e9edfa] text-[#2947a8]"
                  : "text-[#777168]"
              }`}
            >
              {index + 1} {step}
            </li>
          );
        })}
      </ol>

      {state.notice ? (
        <p
          role="status"
          className="mb-4 rounded-xl border border-[#d8d1c6] bg-[#fbf8f1] px-4 py-3 text-sm text-[#69645d]"
        >
          {state.notice}
        </p>
      ) : null}

      {error ? (
        <p
          role="alert"
          className="mb-4 rounded-xl bg-[#f8e8e5] px-4 py-3 text-sm text-[#7b3d36]"
        >
          {error}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-[24px] border border-[#d8d1c6] bg-[#fbf8f1] shadow-[0_24px_70px_rgba(62,55,43,0.08)] lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(390px,.95fr)]">
        <div className="border-b border-[#d8d1c6] p-5 sm:p-7 lg:border-b-0 lg:border-r lg:p-8">
          {isTransferStage && activeScenario ? (
            <TransferPanel
              scenario={activeScenario}
              response={state.transferResponse}
              evaluation={transfer}
              isChecking={transferChecking}
              onChange={(value) =>
                dispatch({ type: "transfer.changed", value })
              }
              onCheck={() => void checkTransfer()}
            />
          ) : state.status === "reviewed" && review ? (
            <ReviewReceiptPanel
              review={review}
              isGuided={isGuided}
              onReviseAgain={() =>
                dispatch({ type: "revision.changed", value: state.revision })
              }
              onTransfer={startTransfer}
            />
          ) : state.status === "revising" || isReviewing ? (
            <RevisionPanel
              revision={state.revision}
              isChecking={isReviewing}
              onChange={(value) =>
                dispatch({ type: "revision.changed", value })
              }
              onCheck={() => void reviewRevision()}
            />
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void analyze();
              }}
              aria-busy={isLoading}
            >
              <DomainPicker value={state.domain} onChange={changeDomain} />

              <div className="mt-6">
                <label
                  htmlFor="coach-assignment"
                  className="text-sm font-semibold text-[#20201d]"
                >
                  Problem or assignment
                </label>
                <p className="mt-1 text-xs leading-5 text-[#69645d]">
                  Include the goal, prompt, or claim you were asked to address.
                </p>
                <textarea
                  id="coach-assignment"
                  value={state.assignment}
                  readOnly={isGuided}
                  onChange={(event) =>
                    changeDraft("assignment", event.target.value)
                  }
                  placeholder="Paste the problem, proof goal, or claim…"
                  className={`${fieldClass} min-h-28`}
                />
              </div>

              <div className="mt-5">
                <label
                  htmlFor="coach-attempt"
                  className="text-sm font-semibold text-[#20201d]"
                >
                  Your current attempt
                </label>
                <p className="mt-1 text-xs leading-5 text-[#69645d]">
                  Show where your reasoning is now—even if it is unfinished.
                </p>
                <textarea
                  id="coach-attempt"
                  value={state.attempt}
                  readOnly={isGuided}
                  onChange={(event) => changeDraft("attempt", event.target.value)}
                  placeholder="Bring the draft, not just the question…"
                  className={`${fieldClass} min-h-56 ${state.domain === "python" || state.domain === "formal-logic" ? "font-mono" : ""}`}
                />
              </div>

              <div className="mt-5 overflow-hidden rounded-[14px] border border-[#d8d1c6] bg-white">
                <button
                  type="button"
                  aria-expanded={constraintsOpen}
                  aria-controls="coach-constraints-panel"
                  onClick={() => setConstraintsOpen((open) => !open)}
                  className="min-h-11 w-full cursor-pointer px-4 py-3 text-left text-sm font-semibold text-[#4e4a44] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-[#3557c4]"
                >
                  Course rules or constraints (optional)
                </button>
                {constraintsOpen ? (
                  <div
                    id="coach-constraints-panel"
                    className="border-t border-[#d8d1c6] p-4"
                  >
                    <label htmlFor="coach-constraints" className="sr-only">
                      Course rules or constraints (optional)
                    </label>
                    <textarea
                      id="coach-constraints"
                      value={state.constraints}
                      readOnly={isGuided}
                      onChange={(event) =>
                        changeDraft("constraints", event.target.value)
                      }
                      className={`${fieldClass} mt-0 min-h-24`}
                    />
                  </div>
                ) : null}
              </div>

              {liveModeAvailable && !isGuided ? (
                <label className="mt-5 flex items-start gap-3 rounded-[14px] border border-[#d8d1c6] bg-white p-4 text-xs leading-5 text-[#69645d]">
                  <input
                    type="checkbox"
                    checked={liveConsent}
                    onChange={(event) => setLiveConsent(event.target.checked)}
                    className="mt-1 size-4 accent-[#3557c4]"
                  />
                  <span>
                    I understand that live mode will send this text to OpenAI
                    for processing with storage disabled. I have removed names,
                    identifiers, assessment keys, and sensitive details.
                  </span>
                </label>
              ) : null}

              {!liveModeAvailable && !isGuided ? (
                <p className="mt-4 flex items-start gap-2 rounded-xl bg-[#f8e8e5] px-4 py-3 text-xs leading-5 text-[#7b3d36]">
                  <WarningCircle aria-hidden="true" className="mt-0.5 shrink-0" />
                  Custom live coaching is disabled locally. Load a guided example
                  to use the credential-free path.
                </p>
              ) : null}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="submit"
                  disabled={!canAnalyze || isLoading}
                  className={primaryButton}
                >
                  <Sparkle aria-hidden="true" size={17} weight="fill" />
                  {isLoading ? "Finding the first break…" : "Find the first break"}
                </button>
                <span className="text-xs leading-5 text-[#69645d]">
                  ReasonPatch will not write or autocomplete a replacement.
                </span>
              </div>
            </form>
          )}
        </div>

        <aside className="min-h-[520px] bg-[#f7f4ed] p-5 sm:p-7 lg:p-8" aria-live="polite">
          {isTransferStage ? (
            <div className="grid min-h-[450px] place-content-center">
              <div className="max-w-sm">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-[#426c50]">
                  Isolation boundary active
                </p>
                <h2 className="mt-3 text-xl font-semibold tracking-[-0.025em] text-[#20201d]">
                  Only the fresh prompt and your new response are checked.
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#69645d]">
                  The original attempt, question, hints, and revision are not
                  sent to this check.
                </p>
              </div>
            </div>
          ) : isLoading ? (
            <div className="space-y-4" aria-label="Analyzing learner work">
              <div className="skeleton-line h-4 w-28 rounded-full" />
              <div className="skeleton-line h-14 rounded-xl" />
              <div className="skeleton-line h-24 rounded-xl" />
              <div className="skeleton-line h-32 rounded-xl" />
            </div>
          ) : state.diagnosis ? (
            <div className="stage-enter">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-[#426c50]">
                One issue at a time
              </p>
              <section className="mt-5">
                <h2 className="text-sm font-semibold text-[#20201d]">
                  What already works
                </h2>
                <ul className="mt-3 grid gap-2">
                  {state.diagnosis.strengths.slice(0, 2).map((strength) => (
                    <li
                      key={strength}
                      className="flex gap-2 text-sm leading-6 text-[#4e4a44]"
                    >
                      <span aria-hidden="true" className="text-[#426c50]">
                        ✓
                      </span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="mt-6 rounded-[14px] border border-[#d8b9b4] bg-[#f8e8e5] p-4">
                <h2 className="text-sm font-semibold text-[#20201d]">
                  First place the reasoning breaks
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#6f3b35]">
                  {state.diagnosis.issueTitle}
                </p>
                <pre
                  aria-label="Quoted hinge from your attempt"
                  className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-lg border-l-4 border-[#98443b] bg-white/70 px-3 py-3 font-mono text-xs leading-5 text-[#20201d]"
                >
                  {state.diagnosis.hingeQuote}
                </pre>
              </section>

              <section className="relative mt-6 overflow-hidden rounded-[16px] border border-[#bdc8ef] bg-[#e9edfa] p-5">
                <span
                  aria-hidden="true"
                  className="absolute inset-x-5 bottom-0 h-1 rounded-t-full bg-[#3557c4]"
                />
                <h2
                  ref={diagnosisHeading}
                  tabIndex={-1}
                  className="text-sm font-semibold text-[#20201d] outline-none"
                >
                  Question to answer before you revise
                </h2>
                <p className="mt-3 text-lg font-medium leading-7 tracking-[-0.015em] text-[#243b87]">
                  {state.diagnosis.socraticQuestion}
                </p>
              </section>

              <HintLadder
                hints={state.diagnosis.hints}
                revealed={state.revealedHints}
                onReveal={() => dispatch({ type: "hint.revealed" })}
              />

              <button
                type="button"
                onClick={startRevision}
                className={`${primaryButton} mt-6 w-full sm:w-auto`}
              >
                Revise this attempt <ArrowRight aria-hidden="true" size={16} />
              </button>

              {trace ? (
                <details className="mt-6 border-t border-[#d8d1c6] pt-4 text-xs text-[#69645d]">
                  <summary className="cursor-pointer font-semibold text-[#4e4a44]">
                    How this was checked
                  </summary>
                  <pre className="mt-3 overflow-x-auto whitespace-pre-wrap font-mono text-[10px] leading-5">
                    {JSON.stringify(trace, null, 2)}
                  </pre>
                </details>
              ) : null}
            </div>
          ) : (
            <div className="grid min-h-[450px] place-content-center">
              <div className="max-w-sm">
                <span
                  aria-hidden="true"
                  className="mb-5 grid size-11 place-items-center rounded-full bg-[#e9edfa] text-xl text-[#3557c4]"
                >
                  ?
                </span>
                <h2 className="text-xl font-semibold tracking-[-0.025em] text-[#20201d]">
                  Bring the draft, not just the question.
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#69645d]">
                  I’ll preserve what already works, locate one blocking step,
                  and ask a focused question.
                </p>
                <button
                  type="button"
                  onClick={loadExample}
                  className="mt-5 min-h-11 rounded-full border border-[#3557c4]/35 bg-white px-4 text-sm font-semibold text-[#2947a8] transition hover:bg-[#e9edfa] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#3557c4]"
                >
                  Try the {selectedExample.shortLabel.toLowerCase()} example
                </button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
