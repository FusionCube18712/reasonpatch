# Demo script — final cut 2:27

The rules require a public YouTube video under three minutes with audio, a clear product demo, and visible Codex/GPT-5.6 usage.

The upload-ready cut can be regenerated on macOS with `ffmpeg` and `ffprobe`:

```bash
npx playwright install chromium
npm run demo:video
```

The command records the deployed app, synthesizes narration, burns captions into the browser recording, and rejects any export at or above three minutes. Output is written to `artifacts/demo-video/reasonpatch-build-week-demo.mp4` and excluded from Git.

## 0:00–0:18 — Problem and product contract

**On screen:** Hero, visible rubric, “Answer withheld,” and the intentionally flawed statistics explanation.

**Narration:** Most AI tutors race to the answer, erasing the reasoning step an educator needs to see. ReasonPatch takes the opposite approach: repair the step while keeping the thinking with the learner.

## 0:18–0:42 — Sol orchestrates Luna honestly

**Action:** Toggle **Demonstrate Sol fallback**, then click **Find the hinge**.

**Narration:** In protected live mode, GPT-5.6 Sol locates the earliest unsupported inference and creates three bounded jobs. Role-separated Luna probes inspect a counterexample, a hidden assumption, and rubric evidence in parallel. The free public path is explicitly a fixture replay; a failed live Luna role alone reruns on Sol and discloses the takeover.

## 0:42–1:16 — Learner repair and signature receipt

**On screen:** Sol's smallest-useful Socratic question.

**Action:** Enter:

> Participants averaged eight points higher, but students chose whether to participate, so the difference alone does not establish causation. We need comparable baseline scores and a randomized controlled comparison.

Then click **Create repair receipt**.

**Narration:** The learner performs the repair in their own words. The printable Repair Receipt compares submitted excerpts, maps only supported evidence, and records honest provenance. It is a challenge—not a grade, mastery label, authorship claim, or proof of learning.

## 1:16–1:48 — Isolated fresh case and educator handoff

**Action:** Click **Begin isolated fresh case**. Show that the prior diagnosis, question, rubric, receipt, and lab labels disappear. Enter:

> The recovery difference does not establish causation because patients chose whether to join. Random assignment or a controlled comparison would be stronger.

Then click **Check transfer evidence**.

**Narration:** One good edit is not transfer evidence. The isolated case creates a separate Transfer Slip using a transparent deterministic scan with no model call and no mastery claim. Educators can download two separate draft artifacts: a blinded, unscored rater packet using anonymous response IDs and a coordinator audit manifest. Both contain submitted text and require coordinator de-identification before sharing.

## 1:48–1:56 — Breadth without losing focus

**Action:** Reopen the demo and select the sampling lab.

**Narration:** The same loop covers correlation and causation, base-rate neglect, and sampling bias without becoming a generic chatbot.

## 1:56–2:12 — GPT-5.6 source and Codex collaboration

**On screen:** Public orchestrator source, followed by the README's Codex collaboration section.

**Narration:** The source shows Sol planning and synthesis, concurrent Luna execution, strict structured outputs, evidence checks, and per-probe fallback. Codex collaboration is documented through test-first checkpoints and independent planning, architecture, code, security, and judge reviews.

## 2:12–2:27 — Close

**On screen:** Return to the ReasonPatch hero.

**Narration:** The result has more than one hundred automated tests, adversarial repair and transfer calibration, desktop and mobile browser coverage, accessible states, and a free public demo.

End on: **ReasonPatch — repair the step, keep the thinking yours.**

## Verified media

- Duration: `146.93 seconds` (`2:27` rounded).
- Video: H.264, 1440 × 900, 25 fps.
- Audio: AAC, synchronized within 0.02 seconds of video; mean volume `-16.1 dB`, peak `-1.2 dB`.
- Burned-in captions: 18 narration segments.
- SHA-256: `4937e7cf6dc9871b310d1aa64eb9fe9ff5ad65f749a4832d3360184261c47e74`.

## Recording checklist

- Keep the final export below 3:00.
- Show the isolated transfer transition and both educator artifacts.
- Show the product, Codex collaboration, and GPT-5.6 Sol/Luna architecture.
- Upload as a public or unlisted-publicly-viewable YouTube video and verify playback with audio in an incognito window.
