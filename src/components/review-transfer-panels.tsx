import { ArrowRight, CheckCircle } from "@phosphor-icons/react";

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
  "mt-3 w-full rounded-[14px] border border-[#d8d1c6] bg-white px-4 py-3 text-[15px] leading-6 text-[#20201d] outline-none transition focus:border-[#3557c4] focus:ring-3 focus:ring-[#3557c4]/20";

export function RevisionPanel({
  revision,
  isChecking,
  onChange,
  onCheck,
}: Readonly<{
  revision: string;
  isChecking: boolean;
  onChange: (value: string) => void;
  onCheck: () => void;
}>) {
  return (
    <div>
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-[#3557c4]">
        Student-authored revision
      </p>
      <label
        htmlFor="coach-revision"
        className="mt-3 block text-sm font-semibold text-[#20201d]"
      >
        Edit your own draft
      </label>
      <textarea
        id="coach-revision"
        value={revision}
        onChange={(event) => onChange(event.target.value)}
        className={`${fieldClass} min-h-72 font-mono`}
      />
      <p className="mt-2 text-xs leading-5 text-[#69645d]">
        We copied your original so you can change only the broken step. Every
        edit remains yours.
      </p>
      <button
        type="button"
        disabled={isChecking || revision.trim().length < 12}
        onClick={onCheck}
        className={`${primaryButton} mt-5`}
      >
        {isChecking ? "Checking your revision…" : "Check my revision"}
        {!isChecking ? <ArrowRight aria-hidden="true" size={16} /> : null}
      </button>
    </div>
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
      <h2 className="mt-3 text-xl font-semibold tracking-[-0.025em] text-[#20201d]">
        Your revision, checked against visible criteria
      </h2>
      <p className="mt-3 text-sm leading-6 text-[#4e4a44]">{review.summary}</p>
      <ul className="mt-5 grid gap-3">
        {criteria.map((criterion) => (
          <li
            key={criterion.id}
            className="rounded-[14px] border border-[#d8d1c6] bg-white p-4"
          >
            <div className="flex items-start gap-2">
              <CheckCircle
                aria-hidden="true"
                className="mt-0.5 shrink-0 text-[#426c50]"
                size={17}
                weight="fill"
              />
              <div>
                <p className="text-sm font-semibold text-[#20201d]">
                  {criterion.label}
                </p>
                {criterion.evidence ? (
                  <pre
                    aria-label={`Evidence for ${criterion.label}`}
                    className="mt-2 whitespace-pre-wrap font-mono text-xs leading-5 text-[#69645d]"
                  >
                    {criterion.evidence}
                  </pre>
                ) : (
                  <p className="mt-2 text-xs text-[#7b3d36]">
                    More learner evidence is needed.
                  </p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs leading-5 text-[#69645d]">{caveat}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onReviseAgain}
          className="min-h-11 rounded-full border border-[#3557c4]/35 bg-white px-4 text-sm font-semibold text-[#2947a8] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#3557c4]"
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
}: Readonly<{
  scenario: PublicScenario;
  response: string;
  evaluation: TransferArtifact | null;
  isChecking: boolean;
  onChange: (value: string) => void;
  onCheck: () => void;
}>) {
  return (
    <section role="region" aria-label="Fresh transfer case">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-[#3557c4]">
        Fresh context · prior coaching hidden
      </p>
      <h2 className="mt-3 text-xl font-semibold tracking-[-0.025em] text-[#20201d]">
        Apply the same idea somewhere new
      </h2>
      <p className="mt-4 rounded-[14px] border border-[#bdc8ef] bg-[#e9edfa] p-4 text-sm leading-6 text-[#243b87]">
        {scenario.transferPrompt}
      </p>
      <label
        htmlFor="coach-transfer"
        className="mt-5 block text-sm font-semibold text-[#20201d]"
      >
        Your response to the fresh case
      </label>
      <textarea
        id="coach-transfer"
        value={response}
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
          className="mt-6 rounded-[14px] border border-[#b9d1bf] bg-[#edf5ef] p-4"
        >
          <p className="text-sm font-semibold text-[#31563b]">
            {evaluation.summary}
          </p>
          <p className="mt-2 text-xs leading-5 text-[#4e6854]">
            This checks only the guided scenario criteria. Formative evidence
            here supports no broader learning conclusion.
          </p>
        </div>
      ) : null}
    </section>
  );
}
