# Demo script — final cut 1:52

The rules require a public YouTube video under three minutes with audio, a clear product demo, and visible Codex/GPT-5.6 usage.

The upload-ready cut can be regenerated on macOS with `ffmpeg` and `ffprobe`:

```bash
npx playwright install chromium
npm run demo:video
```

The command records the deployed app, synthesizes narration, burns captions into the browser recording, and rejects any export at or above three minutes. Output is written to `artifacts/demo-video/reasonpatch-build-week-demo.mp4` and excluded from Git.

## 0:00–0:19 — Problem and product contract

**On screen:** Hero and the flawed tutoring explanation.

**Say:** “Most AI tutors race to the correct answer. That can erase the reasoning step an educator actually needs to see. ReasonPatch repairs the step while keeping the thinking with the learner.”

**On screen:** Visible rubric and “Answer withheld.”

**Say:** “This is a focused intro-statistics lab. The rubric is visible, the replacement answer is withheld, and the sample makes one causal-inference mistake.”

## 0:19–0:34 — Sol orchestrates Luna

**Action:** Click **Find the hinge**.

**Say:** “GPT-5.6 Sol locates the earliest unsupported inference and creates three bounded jobs. GPT-5.6 Luna inspects a counterexample, a hidden assumption, and rubric evidence in parallel. Sol reconciles them into one smallest-useful Socratic question.”

## 0:34–0:50 — Truthful fallback and Socratic question

**On screen:** Point to the explicitly labeled fixture provenance. Toggle **Demonstrate Sol fallback**, run again, and point to recorded fallback disclosure.

**Say:** “The public guided path is an honest fixture replay for reliability. In live mode, any Luna quota, timeout, wrong-role, or invalid-evidence failure reruns only that job on Sol and discloses the takeover.”

## 0:50–0:58 — Learner performs the repair

**Action:** Enter:

> Participants averaged eight points higher, but students chose whether to participate, so the difference alone does not establish causation. We need comparable baseline scores and a randomized controlled comparison.

**Say:** “ReasonPatch asks rather than answers. The learner has to name self-selection, qualify the causal claim, and request stronger evidence in their own words.”

## 0:58–1:17 — Signature artifact

**Action:** Click **Create repair receipt**.

**Say:** “The Repair Receipt compares before and after, maps only text-backed rubric evidence, records provenance, and stays printable. It is an AI-generated challenge—not a grade or a mastery claim.”

## 1:17–1:24 — Breadth without losing focus

**Action:** Quickly click the base-rate and sampling labs.

**Say:** “The same repair loop covers three high-frequency introductory-statistics misconceptions without turning into a generic chatbot.”

## 1:24–1:41 — GPT-5.6 source and Codex collaboration

**On screen:** The public orchestrator source, followed by the README's Codex collaboration section.

**Say:** “Under the hood, the source shows Sol planning and synthesis, concurrent Luna execution, strict structured outputs, evidence checks, and per-probe fallback. I built ReasonPatch with Codex through test-first checkpoints and independent planning, architecture, code, security, and judge reviews.”

## 1:41–1:52 — Close

**On screen:** Return to the ReasonPatch hero.

**Say:** “The result has ninety-one tests, desktop and mobile browser coverage, accessible states, and a free public demo.”

End on the hero line: **Repair the step. Keep the thinking yours.**

## Recording checklist

- Record at 1440 × 900 or 1920 × 1080.
- Zoom browser to 100%; hide bookmarks and personal tabs.
- Use a clear microphone and burned-in captions.
- Keep the final export below 3:00; the generated cut is approximately 1:52.
- Show the product, Codex collaboration, and GPT-5.6 Sol/Luna architecture.
- Upload as a public or unlisted-publicly-viewable YouTube video and verify in an incognito window.
