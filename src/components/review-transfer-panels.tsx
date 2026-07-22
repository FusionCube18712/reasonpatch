import { ArrowRight, CheckCircle, WarningCircle } from "@phosphor-icons/react";
import { useEffect, useRef } from "react";

import type { PublicScenario } from "@/features/coach/scenarios";

export type EvidenceCriterion = Readonly<{
  id: string;
  label: string;
  state: string;
  evidence: string | null;
}>;

export type ReviewArtifact = Readonly<{
  status: string;
  summary: string;
  criteria?: ReadonlyArray<EvidenceCriterion>;
  remainingCaveat?: string | null;
  receipt?: Readonly<{
    criteria: ReadonlyArray<EvidenceCriterion>;
    caveat: string;
  }>;
}>;

export type TransferArtifact = Readonly<{
  status: string;
  summary: string;
  criteria: ReadonlyArray<EvidenceCriterion>;
}>;

const primaryButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#3557c4] px-5 text-sm font-semibold text-white transition hover:bg-[#2947a8] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#3557c4] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#666159] disabled:text-white disabled:hover:bg-[#666159]";

const fieldClass =
  "mt-3 w-full rounded-[14px] border border-[#a89f93] bg-white px-4 py-3 text-[15px] leading-6 text-[#20201d] outline-none transition focus:border-[#3557c4] focus:ring-3 focus:ring-[#3557c4]/20 disabled:cursor-not-allowed disabled:bg-[#eeeae2]";

const CriterionState = ({
  criterion,
}: Readonly<{ criterion: EvidenceCriterion }>) => {
  const observed = criterion.state === "met";
  const stateLabel = observed
    ? "Evidence observed"
    : criterion.state === "emerging"
      ? "Evidence emerging"
      : "Needs more evidence";

  return (
    <div className="flex items-start gap-2">
      {observed ? (
        <CheckCircle
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-[#426c50]"
          size={17}
          weight="fill"
        />
      ) : (
        <WarningCircle
          aria-hidden="true"
          className="mt-0.5 shrink-0 text-[#98443b]"
          size={17}
          weight="fill"
        />
      )}
      <div>
        <p className="text-sm font-semibold text-[#20201d]">
          {criterion.label}
        </p>
        <p
          className={`mt-1 text-xs font-semibold ${observed ? "text-[#426c50]" : "text-[#7b3d36]"}`}
        >
          {stateLabel}
        </p>
        {criterion.evidence ? (
          <pre
            aria-label={`Evidence for ${criterion.label}`}
            className="mt-2 whitespace-pre-wrap font-mono text-xs leading-5 text-[#69645d]"
          >
            {criterion.evidence}
          </pre>
        ) : null}
      </div>
    </div>
  );
};

export function RevisionPanel({
  revision,
  criteria,
  isGuided,
  isChecking,
  onChange,
  onCheck,
}: Readonly<{
  revision: string;
  criteria: ReadonlyArray<Readonly<{ id: string; label: string }>>;
  isGuided: boolean;
  isChecking: boolean;
  onChange: (value: string) => void;
  onCheck: () => void;
}>) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);

  return (
    <section role="region" aria-label="Learner revision">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-[#3557c4]">
        {isGuided ? "Learner-edited guided fixture" : "Student-authored revision"}
      </p>
      <h2
        ref={heading}
        tabIndex={-1}
        className="mt-3 text-xl font-semibold tracking-[-0.025em] text-[#20201d] outline-none"
      >
        Revise the consequential step
      </h2>
      <label
        htmlFor="coach-revision"
        className="mt-3 block text-sm font-semibold text-[#20201d]"
      >
        {isGuided ? "Edit the guided draft" : "Edit your own draft"}
      </label>
      <textarea
        id="coach-revision"
        value={revision}
        disabled={isChecking}
        onChange={(event) => onChange(event.target.value)}
        className={`${fieldClass} min-h-72 font-mono`}
      />
      <p className="mt-2 text-xs leading-5 text-[#69645d]">
        {isGuided
          ? "We copied the guided fixture so you can edit the broken step yourself."
          : "We copied your original so you can change only the broken step. Every edit remains yours."}
      </p>
      <div className="mt-5 rounded-[14px] border border-[#b8afa3] bg-[#f7f4ed] p-4">
        <h3 className="text-sm font-semibold text-[#20201d]">
          What this check looks for
        </h3>
        <ul className="mt-3 grid gap-2 text-sm leading-6 text-[#4e4a44]">
          {criteria.map((criterion) => (
            <li key={criterion.id} className="flex gap-2">
              <span aria-hidden="true" className="text-[#3557c4]">
                •
              </span>
              {criterion.label}
            </li>
          ))}
        </ul>
      </div>
      <button
        type="button"
        disabled={isChecking || revision.trim().length < 12}
        onClick={onCheck}
        className={`${primaryButton} mt-5`}
      >
        {isChecking ? "Checking your revision…" : "Check my revision"}
        {!isChecking ? <ArrowRight aria-hidden="true" size={16} /> : null}
      </button>
    </section>
  );
}

export function ReviewReceiptPanel({
  review,
  isGuided,
  onReviseAgain,
  onTransfer,
}: Readonly<{
  review: ReviewArtifact;
  isGuided: boolean;
  onReviseAgain: () => void;
  onTransfer: () => void;
}>) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);
  const criteria = review.receipt?.criteria ?? review.criteria ?? [];
  const caveat =
    review.receipt?.caveat ??
    review.remainingCaveat ??
    "Independent verification is still required.";

  return (
    <section role="region" aria-label="Revision evidence">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-[#426c50]">
        {isGuided ? "Guided scenario evidence receipt" : "Revision evidence"}
      </p>
      <h2
        ref={heading}
        tabIndex={-1}
        className="mt-3 text-xl font-semibold tracking-[-0.025em] text-[#20201d] outline-none"
      >
        Your revision, checked against visible criteria
      </h2>
      <p className="mt-3 text-sm leading-6 text-[#4e4a44]">{review.summary}</p>
      <ul className="mt-5 grid gap-3">
        {criteria.map((criterion) => (
          <li
            key={criterion.id}
            className="rounded-[14px] border border-[#b8afa3] bg-white p-4"
          >
            <CriterionState criterion={criterion} />
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs leading-5 text-[#69645d]">{caveat}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onReviseAgain}
          className="min-h-11 rounded-full border border-[#3557c4] bg-white px-4 text-sm font-semibold text-[#2947a8] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#3557c4]"
        >
          Revise again
        </button>
        {isGuided && review.status === "evidence-observed" ? (
          <button type="button" onClick={onTransfer} className={primaryButton}>
            Try a fresh case <ArrowRight aria-hidden="true" size={16} />
          </button>
        ) : null}
      </div>
    </section>
  );
}

export function TransferPanel({
  scenario,
  response,
  evaluation,
  isChecking,
  onChange,
  onCheck,
  onReset,
}: Readonly<{
  scenario: PublicScenario;
  response: string;
  evaluation: TransferArtifact | null;
  isChecking: boolean;
  onChange: (value: string) => void;
  onCheck: () => void;
  onReset: () => void;
}>) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);
  const visibleCriteria = scenario.transferCriteria.map((criterion) => {
    const result = evaluation?.criteria.find(({ id }) => id === criterion.id);
    return {
      ...criterion,
      state: result?.state ?? "pending",
      evidence: result?.evidence ?? null,
    };
  });

  return (
    <section role="region" aria-label="Fresh transfer case">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-[#3557c4]">
        Fresh context · prior coaching hidden
      </p>
      <h2
        ref={heading}
        tabIndex={-1}
        className="mt-3 text-xl font-semibold tracking-[-0.025em] text-[#20201d] outline-none"
      >
        Apply the same idea somewhere new
      </h2>
      <p className="mt-4 rounded-[14px] border border-[#9eaddf] bg-[#e9edfa] p-4 text-sm leading-6 text-[#243b87]">
        {scenario.transferPrompt}
      </p>
      <div className="mt-4 rounded-[14px] border border-[#b8afa3] bg-white p-4">
        <h3 className="text-sm font-semibold text-[#20201d]">
          What this fresh check looks for
        </h3>
        <ul className="mt-3 grid gap-2">
          {visibleCriteria.map((criterion) => (
            <li key={criterion.id} className="text-sm leading-6 text-[#4e4a44]">
              {criterion.state === "pending" ? (
                <span>{criterion.label}</span>
              ) : (
                <CriterionState criterion={criterion} />
              )}
            </li>
          ))}
        </ul>
      </div>
      <label
        htmlFor="coach-transfer"
        className="mt-5 block text-sm font-semibold text-[#20201d]"
      >
        Your response to the fresh case
      </label>
      <textarea
        id="coach-transfer"
        value={response}
        disabled={isChecking}
        onChange={(event) => onChange(event.target.value)}
        className={`${fieldClass} min-h-48`}
      />
      <button
        type="button"
        disabled={isChecking || response.trim().length < 12}
        onClick={onCheck}
        className={`${primaryButton} mt-5`}
      >
        {isChecking ? "Checking the fresh case…" : "Check this fresh case"}
      </button>

      {evaluation ? (
        <div
          role="status"
          aria-label="Fresh-case evidence result"
          className={`mt-6 rounded-[14px] border p-4 ${evaluation.status === "evidence-observed" ? "border-[#9fc2a7] bg-[#edf5ef]" : "border-[#d8b9b4] bg-[#f8e8e5]"}`}
        >
          <p className="text-sm font-semibold text-[#31563b]">
            {evaluation.summary}
          </p>
          <p className="mt-2 text-xs leading-5 text-[#4e6854]">
            This checks only the guided scenario criteria. Formative evidence
            here supports no broader learning conclusion.
          </p>
          <button
            type="button"
            onClick={onReset}
            className="mt-4 min-h-11 rounded-full border border-[#426c50] bg-white px-4 text-sm font-semibold text-[#31563b] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#426c50]"
          >
            Start another problem
          </button>
        </div>
      ) : null}
    </section>
  );
}
