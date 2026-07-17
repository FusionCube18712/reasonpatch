import { RepairStudio } from "@/components/repair-studio";

const journey = ["01 Explain", "02 Repair", "03 Receipt"] as const;

export default function Page() {
  return (
    <main className="min-h-[100dvh] bg-[#f5f1e8] text-[#25231f]">
      <header className="border-b border-[#25231f]/12 px-4 sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="grid size-8 place-items-center rounded-full bg-[#25231f] text-sm font-semibold text-[#f5f1e8]">
              R
            </span>
            <span className="text-sm font-semibold tracking-[-0.02em]">ReasonPatch</span>
          </div>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-[#6b675f] sm:block">
            Education · Build Week 2026
          </span>
        </div>
      </header>

      <section className="px-4 pb-10 pt-12 sm:px-6 lg:px-10 lg:pb-16 lg:pt-20">
        <div className="mx-auto grid max-w-[1400px] gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16">
          <div>
            <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.2em] text-[#a24f24]">
              Reasoning repair, not answer generation
            </p>
            <h1 className="max-w-[12ch] text-4xl font-semibold leading-[0.98] tracking-[-0.055em] sm:text-5xl lg:text-6xl">
              Repair the step. Keep the thinking yours.
            </h1>
          </div>
          <div className="flex flex-col justify-end gap-8 lg:pl-[8vw]">
            <p className="max-w-[62ch] text-base leading-7 text-[#625e56] sm:text-lg">
              ReasonPatch finds the earliest unsupported inference, asks one small question,
              and records what changed. It never writes the learner&apos;s replacement answer.
            </p>
            <ol aria-label="Learning journey" className="grid border-y border-[#25231f]/14 sm:grid-cols-3">
              {journey.map((step, index) => (
                <li
                  key={step}
                  className={`py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-[#57534c] ${index > 0 ? "border-t border-[#25231f]/14 sm:border-l sm:border-t-0 sm:pl-5" : ""}`}
                >
                  {step}
                </li>
              ))}
            </ol>
            <p className="max-w-[66ch] text-xs leading-5 text-[#625e56]">
              No accounts. No student identifiers. Learner text is used only for the requested
              analysis, and the resulting challenge never becomes a grade.
            </p>
          </div>
        </div>
      </section>

      <RepairStudio />

      <footer className="px-4 pb-8 pt-14 sm:px-6 lg:px-10">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-2 border-t border-[#25231f]/12 pt-5 text-xs text-[#625e56] sm:flex-row sm:items-center sm:justify-between">
          <span>Built with Codex and GPT-5.6 Sol + Luna</span>
          <span>AI-generated challenges are not grades or verdicts.</span>
        </div>
      </footer>
    </main>
  );
}
