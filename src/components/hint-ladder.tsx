import type { CoachDiagnosis } from "@/features/coach/contracts";

export function HintLadder({
  hints,
  revealed,
  onReveal,
}: Readonly<{
  hints: CoachDiagnosis["hints"];
  revealed: number;
  onReveal: () => void;
}>) {
  const visibleHints = hints.slice(0, revealed);
  const labels = ["Location", "Concept", "Strategy", "Analogy"] as const;
  const buttonLabel =
    revealed === 0
      ? "Give me a nudge"
      : revealed === 1
        ? "One more hint"
        : "Show the final hint";

  return (
    <div className="mt-5 border-t border-[#d8d1c6] pt-5">
      {visibleHints.length > 0 ? (
        <ol className="grid gap-2" aria-label="Revealed hints">
          {visibleHints.map((hint, index) => (
            <li
              key={`${hint.level}-${index}`}
              className="rounded-xl border border-[#d8d1c6] bg-white px-4 py-3 text-sm leading-6 text-[#4e4a44]"
            >
              <span className="mr-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#3557c4]">
                {labels[index]}
              </span>
              {hint.text}
            </li>
          ))}
        </ol>
      ) : null}
      {revealed < hints.length ? (
        <button
          type="button"
          onClick={onReveal}
          className="mt-3 inline-flex min-h-11 items-center rounded-full border border-[#3557c4]/35 bg-white px-4 text-sm font-semibold text-[#2947a8] transition hover:border-[#3557c4] hover:bg-[#e9edfa] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#3557c4] focus-visible:ring-offset-2"
        >
          {buttonLabel}
        </button>
      ) : null}
    </div>
  );
}
