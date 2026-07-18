# Build Week submission kit

## Core fields

**Project:** ReasonPatch

**Track:** Education

**Tagline:** Repair the step. Keep the thinking yours.

**One sentence:** ReasonPatch finds the earliest unsupported inference in a statistics explanation, asks one Socratic question, and creates an evidence-bound receipt from the learner's own revision.

## Short description

AI tutors are good at producing answers, but answer-first help can hide the reasoning step an instructor needs to inspect. ReasonPatch takes the opposite approach: GPT-5.6 Sol locates the learner's reasoning hinge, three parallel GPT-5.6 Luna probes test it from distinct educational roles, and Sol asks one smallest-useful question without writing the answer. After the learner revises, ReasonPatch produces a printable Repair Receipt showing before/after changes and rubric evidence that is verified against the learner's actual text.

## What makes it different

- **Answer withholding is the feature.** The learner performs the repair.
- **The hinge, not the whole essay.** Feedback targets the earliest unsupported inference.
- **Role-separated execution.** Counterexample, assumption, and rubric probes cannot silently collapse into fake consensus.
- **Auditable evidence.** Quotes must occur in learner text; role and provenance are server-verified.
- **Truthful reliability.** Guided mode says it is a fixture replay; live Luna failures disclose per-probe Sol fallback.
- **No inflated educational claim.** Receipts are challenges, not grades, mastery labels, or proof of learning.

## How it was built

ReasonPatch uses Next.js 16, React 19, TypeScript, Tailwind CSS, Zod, the OpenAI JavaScript SDK, Responses Structured Outputs, Vitest, Playwright, and axe-core. Sol plans and synthesizes; three Luna calls run concurrently; failed Luna roles reroute individually to Sol. All model output passes strict schemas plus evidence and provenance checks. Model storage is disabled.

Codex was the end-to-end engineering environment: product planning, official documentation research, TDD, implementation, browser QA, accessibility, security review, adversarial judge review, and submission packaging. Dated Git commits preserve RED and GREEN checkpoints.

## Accomplishments

- a polished, responsive Explain → Repair → Receipt journey;
- three focused intro-statistics labs;
- transparent Sol/Luna trace and fallback behavior;
- evidence-bound printable receipt;
- 12-case calibration against complete, partial, irrelevant, and injection-like revisions;
- 80-plus automated tests, strong coverage, desktop/mobile browser checks, and clean production audit.

## Challenges and lessons

The hardest product decision was refusing the easy “AI tutor” shape. The strongest artifact was not another answer, but a receipt that makes revision evidence inspectable. Independent review also caught important integrity problems: early fixtures overstated evidence and client code accidentally bundled instructor intent. Both were redesigned and regression-tested.

## Potential impact

ReasonPatch could help instructors preserve student agency while making formative reasoning changes easier to review. The immediate wedge is introductory statistics, where a small set of recurring inference mistakes appears across large courses. The prototype does not claim measured learning gains; the next step is an educator-rated pilot comparing revision quality and delayed transfer against answer-first tutoring.

## Judging-criteria map

| Criterion | Evidence |
|---|---|
| Technological implementation | Sol/Luna orchestration, concurrent probes, per-role fallback, Structured Outputs, evidence/provenance verification, safe boundaries, tests |
| Design | focused three-step workflow, visible rubric, answer withholding, responsive/a11y-tested interface, printable signature artifact |
| Potential impact | recurring high-enrollment statistics misconceptions, instructor-reviewable artifact, honest pilot plan |
| Quality of idea | reasoning repair rather than answer generation; earliest-hinge targeting; evidence-bound receipt |

## Final submission checklist

- [ ] Deploy a free public guided demo and verify it in an incognito window.
- [ ] Keep public live mode disabled unless protected by a signed access gate and distributed budget controls.
- [ ] Create a public source repository and verify README rendering.
- [ ] Record the audio demo using `docs/DEMO_SCRIPT.md`; keep it under three minutes.
- [ ] Upload to YouTube and verify public/incognito playback.
- [ ] Run `npm run check`, `npm run test:e2e`, and `npm audit --omit=dev` from a clean install.
- [ ] Run `/feedback` in Codex and paste the session ID below.
- [ ] Submit before **July 21, 2026 at 5:00 PM Pacific Time**.

## URLs and IDs to fill in

- Public demo: `https://reasonpatch.vercel.app`
- Public repository: `https://github.com/FusionCube18712/reasonpatch`
- YouTube demo: `TODO`
- Codex `/feedback` session ID: `TODO`
