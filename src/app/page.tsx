import { OfficeHoursStudio } from "@/components/office-hours-studio";

export default function Page() {
  return (
    <main className="min-h-[100dvh] bg-[#f3f0e8] text-[#20201d]">
      <header className="border-b border-[#d8d1c6] px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-16 max-w-[1320px] items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="grid size-8 place-items-center rounded-full bg-[#3557c4] text-sm font-semibold text-white"
            >
              R
            </span>
            <span className="text-sm font-semibold tracking-[-0.02em]">
              ReasonPatch
            </span>
          </div>
          <span className="text-right font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#69645d]">
            AI office hours · Education track
          </span>
        </div>
      </header>

      <OfficeHoursStudio
        liveModeAvailable={
          process.env.NEXT_PUBLIC_REASONPATCH_LIVE_MODE === "true"
        }
      />

      <footer className="px-4 pb-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-3 border-t border-[#d8d1c6] pt-5 text-xs leading-5 text-[#69645d] sm:flex-row sm:items-center sm:justify-between">
          <span>Orchestrated by GPT-5.6 Sol with parallel Luna probes.</span>
          <span>Formative evidence, not a grade or proof of learning.</span>
        </div>
      </footer>
    </main>
  );
}
