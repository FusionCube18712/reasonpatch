# Build Week submission kit

## Core fields

**Project:** ReasonPatch

**Track:** Education

**Tagline:** Repair the step. Keep the thinking yours.

**One sentence:** ReasonPatch finds the earliest unsupported inference in a statistics explanation, asks one Socratic question, creates an evidence-bound receipt, and checks the same reasoning on a fresh case without supplying the answer.

## Short description

AI tutors are good at producing answers, but answer-first help can hide the reasoning step an instructor needs to inspect. ReasonPatch takes the opposite approach: GPT-5.6 Sol locates the learner's reasoning hinge, three parallel GPT-5.6 Luna probes test it from distinct educational roles, and Sol asks one smallest-useful question without writing the answer. After the learner submits a revision, ReasonPatch produces a printable Repair Receipt showing verified before/after evidence. It then presents an immediate fresh-context case in an isolated interface and creates a Transfer Slip from only the evidence in that response. Educators can download two explicitly unvalidated local artifacts: an anonymous, unscored rater packet and a separate coordinator audit manifest.

## What makes it different

- **Answer withholding is the feature.** The learner performs the repair.
- **The hinge, not the whole essay.** Feedback targets the earliest unsupported inference.
- **Role-separated execution.** Counterexample, assumption, and rubric probes cannot silently collapse into fake consensus.
- **Auditable evidence.** Quotes must occur in learner text; role and provenance are server-verified.
- **Truthful reliability.** Guided mode says it is a fixture replay; live Luna failures disclose per-probe Sol fallback.
- **No inflated educational claim.** Receipts are challenges, not grades, mastery labels, or proof of learning.
- **One edit is not called learning.** A fresh-case check asks whether the reasoning appears in a new context, then labels the result as observed text evidence—not a verdict.
- **A concrete evaluation handoff.** A stripped rater packet, separate coordinator manifest, and public pilot protocol define the next study without fabricating users or outcomes.

## How it was built

ReasonPatch uses Next.js 16, React 19, TypeScript, Tailwind CSS, Zod, the OpenAI JavaScript SDK, Responses Structured Outputs, Vitest, Playwright, and axe-core. Sol plans and synthesizes; three Luna calls run concurrently; failed Luna roles reroute individually to Sol. All model output passes strict schemas plus evidence and provenance checks. Model storage is disabled.

Codex was the end-to-end engineering environment: product planning, official documentation research, TDD, implementation, browser QA, accessibility, security review, adversarial judge review, and submission packaging. Dated Git commits preserve RED and GREEN checkpoints.

## Accomplishments

- a polished, responsive Explain → Repair → Receipt journey;
- three focused intro-statistics labs;
- transparent Sol/Luna trace and fallback behavior;
- evidence-bound printable receipt;
- fresh-case Transfer Slip plus separate blinded-review and coordinator-audit artifacts;
- 29-case calibration covering 87 repair and transfer rubric decisions;
- 116 automated tests, strong coverage, desktop/mobile browser checks, and a clean production audit.

## Challenges and lessons

The hardest product decision was refusing the easy “AI tutor” shape. The strongest artifact was not another answer, but a receipt that makes revision evidence inspectable. Then a judge-style review exposed a deeper integrity gap: one successful edit is not evidence that reasoning transfers. The product now asks for an immediate fresh-context explanation isolated as a separate response, while reserving delayed transfer and blinded scoring for the proposed pilot. Independent review also caught early fixtures that overstated evidence and client code that accidentally bundled instructor intent; both were redesigned and regression-tested.

## Potential impact

ReasonPatch could help instructors preserve student agency while making formative reasoning changes easier to review. The immediate wedge is introductory statistics, where conceptual errors can persist after instruction: a [1,470-student, 33-institution assessment](https://iase-pub.org/ojs/SERJ/article/view/483) documented continuing problems with causal interpretation, sampling, and conditional probability. The interaction is informed by meta-analyses of [prompted self-explanation](https://doi.org/10.1007/s10648-018-9434-x) and [problem-solving before instruction](https://doi.org/10.3102/00346543211019105), plus [field guidance](https://www.amstat.org/asa/files/pdfs/gaise/gaisecollege_full.pdf) emphasizing statistical reasoning and active learning. These adjacent findings motivate the design; they do not validate this product.

ReasonPatch makes that boundary visible. It does not call one revision learning. The demo's immediate fresh-context case creates a second observable artifact, but it is not a delayed or blinded learning measure. The downloadable rater packet uses anonymous IDs and removes product, condition, time-point, provenance, and automated-score cues; the separate coordinator manifest retains the private mapping and evidence trail. Both contain submitted text and must be de-identified before approved sharing.

The proposed comparison with answer-first assistance would instead use an isolated delayed case from a held-out server-side prompt pool and a separate rater packet stripped of product, condition, time-point, model, and automated-score cues. The public demo's small prompt pool is client-bundled and therefore not held out. The study has not yet been run; the protocol is [public and falsifiable](PILOT_PROTOCOL.md).

## Judging-criteria map

| Criterion | Evidence |
|---|---|
| Technological implementation | Sol/Luna orchestration, concurrent probes, per-role fallback, Structured Outputs, evidence/provenance verification, safe boundaries, tests |
| Design | focused four-step workflow, visible rubric, answer withholding, responsive/a11y-tested interface, printable signature artifact |
| Potential impact | documented statistics misconceptions, fresh-case evidence, split rater/audit artifacts, and a public protocol for blinded evaluation |
| Quality of idea | reasoning repair rather than answer generation; earliest-hinge targeting; evidence-bound Receipt + Transfer Slip |

## Final submission checklist

- [x] Deploy a free public guided demo and verify it in an incognito window.
- [x] Keep public live mode disabled unless protected by a signed access gate and distributed budget controls.
- [x] Create a public source repository and verify README rendering.
- [x] Regenerate the narrated, captioned demo with the fresh-case Transfer Slip; verified at 145.98 seconds.
- [ ] Upload to YouTube and verify public/incognito playback.
- [x] Run `npm run check`, `npm run test:e2e`, and `npm audit --omit=dev`.
- [ ] Run `/feedback` in Codex and paste the session ID below.
- [ ] Submit before **July 21, 2026 at 5:00 PM Pacific Time**.

## YouTube upload copy

**Title:** ReasonPatch — Repair the Step | OpenAI Build Week Education Demo

**Description:**

> ReasonPatch is a reasoning-repair studio for introductory statistics. GPT-5.6 Sol locates the earliest unsupported inference, three role-separated GPT-5.6 Luna probes test it, and Sol asks one smallest-useful question without writing the learner's answer. The learner creates an evidence-bound Repair Receipt, then applies the reasoning in an isolated fresh case that produces a separate Transfer Slip.
>
> Public demo: https://reasonpatch.vercel.app  
> Public source: https://github.com/FusionCube18712/reasonpatch  
> Track: Education · OpenAI Build Week 2026
>
> The guided public path is an explicitly labeled fixture replay. Transfer evidence is not a grade, mastery claim, or proof of learning.

**Verified upload file:** `artifacts/demo-video/reasonpatch-build-week-demo.mp4` · `145.98s` · SHA-256 `c141dc519359b2e91011dcae93b65c75ad2cf139ded0ccbc1a2dd9045cc68a57`

## URLs and IDs to fill in

- Public demo: `https://reasonpatch.vercel.app`
- Public repository: `https://github.com/FusionCube18712/reasonpatch`
- YouTube demo: `TODO`
- Codex `/feedback` session ID: `TODO`
