import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";

const projectRoot = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const outputDirectory = resolve(projectRoot, "artifacts/demo-video");
const audioDirectory = resolve(outputDirectory, "audio");
mkdirSync(audioDirectory, { recursive: true });

if (process.platform !== "darwin") {
  throw new Error("Demo narration currently requires macOS and its built-in `say` command.");
}

for (const [command, args] of [
  ["ffmpeg", ["-version"]],
  ["ffprobe", ["-version"]],
]) {
  try {
    execFileSync(command, args, { stdio: "ignore" });
  } catch {
    throw new Error(`Missing required command: ${command}`);
  }
}

const gotoExpected = async (page, url, expectedText) => {
  const response = await page.goto(url, { waitUntil: "domcontentloaded" });
  if (!response?.ok()) {
    throw new Error(`Demo navigation failed (${response?.status() ?? "no response"}): ${url}`);
  }
  await page.getByText(expectedText, { exact: false }).first().waitFor({ timeout: 15_000 });
};

const revision =
  "Participants averaged eight points higher, but students chose whether to participate, so the difference alone does not establish causation. We need comparable baseline scores and a randomized controlled comparison.";

const transferResponse =
  "The recovery difference does not establish causation because patients chose whether to join. Random assignment or a controlled comparison would be stronger.";

const orchestratorSource = readFileSync(
  resolve(projectRoot, "src/features/repair/orchestrator.ts"),
  "utf8",
);
const requireSourceLine = (source, fragment) => {
  const line = source
    .split("\n")
    .find((candidate) => candidate.includes(fragment));
  if (!line) throw new Error(`Demo source proof is missing: ${fragment}`);
  return line.trim();
};

const sourceExcerpt = [
  "// Sol planning + strict schema + exact evidence",
  requireSourceLine(orchestratorSource, "const rawPlan = await gateway.generate"),
  requireSourceLine(orchestratorSource, 'model: "gpt-5.6-sol"'),
  requireSourceLine(orchestratorSource, 'task: "plan"'),
  requireSourceLine(orchestratorSource, "schema: AnalysisPlanSchema"),
  requireSourceLine(orchestratorSource, "assertEvidenceOccursIn("),
  "",
  "// Three bounded Luna roles execute concurrently",
  requireSourceLine(orchestratorSource, "const probeRuns = await Promise.all"),
  requireSourceLine(orchestratorSource, "plan.jobs.map"),
  requireSourceLine(
    orchestratorSource,
    'generateProbe(role, "gpt-5.6-luna", input)',
  ),
  "",
  "// A failed Luna role alone reruns on Sol",
  requireSourceLine(orchestratorSource, "const reason = classifyFailure(error)"),
  requireSourceLine(
    orchestratorSource,
    'generateProbe(role, "gpt-5.6-sol", input)',
  ),
  "",
  "// Sol synthesizes the final question",
  requireSourceLine(
    orchestratorSource,
    "const rawSynthesis = await gateway.generate",
  ),
  requireSourceLine(orchestratorSource, 'task: "synthesize"'),
  requireSourceLine(orchestratorSource, "schema: SynthesisOutputSchema"),
].join("\n");

const escapeHtml = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const showTechnicalProofSlide = async (
  page,
  { eyebrow, title, statement, rail, proof, metrics },
) => {
  const proofMarkup = proof
    ? `<pre aria-label="Local source excerpt"><code>${escapeHtml(proof)}</code></pre>`
    : `<div class="trace" aria-label="Codex build trace">${rail
        .slice(1)
        .map(
          (item, index) =>
            `<div class="trace-card"><span>0${index + 1}</span><strong>${escapeHtml(item.title)}</strong><p>${escapeHtml(item.detail)}</p></div>`,
        )
        .join("")}</div>`;
  const bodyMarkup = proof
    ? `<aside class="rail"><div><span class="source-label">Execution contract</span><div class="flow">${escapeHtml(rail[0].detail)}</div></div><ul>${rail
        .slice(1)
        .map((item) => `<li><strong>${escapeHtml(item.title)}</strong> · ${escapeHtml(item.detail)}</li>`)
        .join("")}</ul></aside>${proofMarkup}`
    : proofMarkup;

  await page.setContent(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; min-height: 100vh; overflow: hidden; background: #f5f1e8; color: #25231f; font-family: Arial, sans-serif; }
      main { min-height: 900px; padding: 34px 48px 96px; display: grid; grid-template-rows: auto auto 1fr auto; gap: 28px; }
      header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 20px; border-bottom: 1px solid rgba(37,35,31,.16); }
      .brand { display: flex; align-items: center; gap: 12px; font-weight: 700; }
      .mark { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; background: #25231f; color: #f5f1e8; }
      .eyebrow, .source-label { color: #a24f24; font: 700 12px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .18em; text-transform: uppercase; }
      .intro { display: grid; grid-template-columns: .9fr 1.1fr; gap: 72px; align-items: end; }
      h1 { margin: 0; max-width: 10ch; font-size: 62px; line-height: .96; letter-spacing: -.055em; }
      .statement { margin: 0; max-width: 59ch; color: #625e56; font-size: 22px; line-height: 1.45; }
      .proof { min-height: 0; display: grid; grid-template-columns: 1fr 1.55fr; gap: 24px; }
      .rail { padding: 28px; border: 1px solid rgba(37,35,31,.14); border-radius: 28px; background: #ede6da; display: flex; flex-direction: column; justify-content: space-between; }
      .flow { font-size: 34px; font-weight: 700; letter-spacing: -.04em; }
      .rail ul { margin: 20px 0 0; padding: 0; list-style: none; }
      .rail li { padding: 13px 0; border-top: 1px solid rgba(37,35,31,.13); color: #57534c; font-size: 16px; }
      pre { margin: 0; height: 472px; overflow: hidden; border: 1px solid rgba(37,35,31,.14); border-radius: 28px; background: #25231f; color: #f7f2e8; padding: 26px 30px; box-shadow: 0 26px 60px rgba(37,35,31,.12); }
      code { white-space: pre-wrap; font: 500 12.5px/1.42 ui-monospace, SFMono-Regular, Menlo, monospace; }
      .trace { grid-column: 1 / -1; display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
      .trace-card { min-height: 340px; padding: 28px; border: 1px solid rgba(37,35,31,.14); border-radius: 26px; background: #ede6da; }
      .trace-card span { color: #a24f24; font: 700 12px/1 ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .16em; }
      .trace-card strong { display: block; margin-top: 58px; font-size: 27px; letter-spacing: -.03em; }
      .trace-card p { margin: 12px 0 0; color: #625e56; font-size: 16px; line-height: 1.45; }
      footer { display: flex; align-items: center; justify-content: space-between; padding-top: 18px; border-top: 1px solid rgba(37,35,31,.14); color: #625e56; font: 600 13px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; }
      .metrics { display: flex; gap: 24px; }
      .metrics strong { color: #25231f; }
    </style>
  </head>
  <body>
    <main>
      <header><div class="brand"><span class="mark">R</span>ReasonPatch</div><span class="eyebrow">${escapeHtml(eyebrow)}</span></header>
      <section class="intro"><h1>${escapeHtml(title)}</h1><p class="statement">${escapeHtml(statement)}</p></section>
      <section class="proof">${bodyMarkup}</section>
      <footer><span>${escapeHtml(metrics.label)}</span><div class="metrics">${metrics.items
        .map((item) => `<span><strong>${escapeHtml(item.value)}</strong> ${escapeHtml(item.label)}</span>`)
        .join("")}</div></footer>
    </main>
  </body>
</html>`);
};

const segments = [
  {
    text: "AI tutors can ask Socratic questions, but an educator still needs to see what the learner actually repaired.",
    action: async (page) => page.evaluate(() => window.scrollTo({ top: 0 })),
  },
  {
    text: "ReasonPatch turns that gap into the product surface: repair the step, while keeping the thinking with the learner.",
    action: async (page) =>
      page.getByRole("region", { name: "Reasoning repair workspace" }).scrollIntoViewIfNeeded(),
  },
  {
    text: "The replacement answer is withheld. The learner starts from a visible rubric and an intentionally flawed statistics explanation.",
    action: async () => undefined,
  },
  {
    text: "In protected live mode, GPT five point six Sol locates the earliest unsupported inference and creates three bounded jobs.",
    action: async (page) => {
      await page.getByRole("button", { name: "Find the hinge" }).click();
      await page.getByText("Repair crew complete").waitFor();
      await page.getByLabel("Repair crew trace").scrollIntoViewIfNeeded();
    },
  },
  {
    text: "Three role-separated Luna probes inspect a counterexample, a hidden assumption, and rubric evidence in parallel. Sol then reconciles them.",
    action: async () => undefined,
  },
  {
    text: "The free public path is explicitly labeled as a fixture replay. If Luna fails in live mode, only that probe reruns on Sol, and the takeover is disclosed.",
    action: async (page) => {
      const fallback = page.getByRole("checkbox", { name: "Demonstrate Sol fallback" });
      await fallback.scrollIntoViewIfNeeded();
      await fallback.check();
      await page.getByRole("button", { name: "Find the hinge" }).click();
      await page.getByText("Recorded Sol fallback").first().waitFor();
      await page.getByLabel("Repair crew trace").scrollIntoViewIfNeeded();
    },
  },
  {
    text: "Sol asks one smallest useful Socratic question instead of writing the response. Here, it tests whether self-selection could explain the score gap.",
    action: async (page) =>
      page.getByRole("heading", { name: "One question before you revise" }).scrollIntoViewIfNeeded(),
  },
  {
    text: "The learner performs the repair in their own words: qualify the causal claim, name selection, and request stronger comparison evidence.",
    action: async (page) => {
      const revisionInput = page.getByLabel("Revised explanation");
      await revisionInput.scrollIntoViewIfNeeded();
      await revisionInput.fill(revision);
    },
  },
  {
    text: "ReasonPatch then creates its signature artifact: a printable Repair Receipt bound to the learner's actual text.",
    action: async (page) => {
      await page.getByRole("button", { name: "Create repair receipt" }).click();
      await page.getByRole("heading", { name: "Repair receipt" }).waitFor();
      await page.getByRole("heading", { name: "Repair receipt" }).scrollIntoViewIfNeeded();
    },
  },
  {
    text: "The receipt compares submitted before and after excerpts, maps only supported rubric evidence, and records honest demo or live provenance.",
    action: async (page) =>
      page.getByText("Rubric evidence after revision").scrollIntoViewIfNeeded(),
  },
  {
    text: "It is an AI-generated challenge, not a grade, mastery label, authorship claim, or proof of learning.",
    action: async () => undefined,
  },
  {
    text: "One good edit is not evidence of transfer. ReasonPatch opens an isolated fresh case with the diagnosis, question, rubric, and receipt removed from view.",
    action: async (page) => {
      await page.getByRole("button", { name: "Begin isolated fresh case" }).click();
      await page.getByRole("heading", { name: "Try the reasoning on a fresh case" }).waitFor();
      const transferInput = page.getByLabel("Fresh-case explanation");
      await transferInput.scrollIntoViewIfNeeded();
      await transferInput.fill(transferResponse);
    },
  },
  {
    text: "A separate Transfer Slip records only supported excerpts from that new response. The public path uses a transparent rubric scan, makes no model call, and never labels the result as mastery.",
    action: async (page) => {
      await page.getByRole("button", { name: "Check transfer evidence" }).click();
      await page.getByRole("heading", { name: "Transfer slip" }).waitFor();
      await page.getByRole("heading", { name: "Transfer slip" }).scrollIntoViewIfNeeded();
    },
  },
  {
    text: "Educators get two local artifacts: a blinded, unscored rater packet using anonymous response IDs, and a separate audit manifest. Both contain submitted text and require coordinator de-identification before sharing.",
    action: async (page) =>
      page.getByRole("button", { name: "Download blinded rater packet" }).scrollIntoViewIfNeeded(),
  },
  {
    text: "The same focused repair loop covers correlation and causation, base-rate neglect, and sampling bias without becoming a generic chatbot.",
    action: async (page) => {
      await gotoExpected(page, "https://reasonpatch.vercel.app", "Repair the step.");
      const samplingLab = page.getByRole("button", { name: /Who answered the survey/ });
      await samplingLab.scrollIntoViewIfNeeded();
      await samplingLab.click();
    },
  },
  {
    text: "Under the hood, the source shows Sol planning and synthesis, concurrent Luna execution, strict structured outputs, evidence checks, and per-probe fallback.",
    action: async (page) =>
      showTechnicalProofSlide(page, {
        eyebrow: "Technical implementation · local source snapshot",
        title: "Sol → Luna ×3 → Sol",
        statement:
          "One orchestrator plans the hinge, three bounded executor roles run concurrently, and every output must survive schema, evidence, and provenance checks.",
        rail: [
          { title: "Orchestration", detail: "Sol → Luna ×3 → Sol" },
          { title: "Plan", detail: "gpt-5.6-sol" },
          { title: "Execute", detail: "Promise.all · three Luna roles" },
          { title: "Recover", detail: "failed role only → Sol" },
          { title: "Verify", detail: "strict schema + exact evidence" },
        ],
        proof: sourceExcerpt,
        metrics: {
          label: "src/features/repair/orchestrator.ts · repository HEAD",
          items: [
            { value: "3", label: "parallel probes" },
            { value: "1", label: "bounded fallback per role" },
          ],
        },
      }),
  },
  {
    text: "I built ReasonPatch with Codex through test-first checkpoints and independent planning, architecture, code, security, and judge reviews.",
    action: async (page) =>
      showTechnicalProofSlide(page, {
        eyebrow: "Codex collaboration · verifiable build process",
        title: "Codex build trace",
        statement:
          "The project moved through RED → GREEN → adversarial review. Its 125 automated tests and independent agents challenged architecture, security, UX, evidence claims, and judge readiness.",
        rail: [
          { title: "Workflow", detail: "RED → GREEN → adversarial review" },
          { title: "Plan", detail: "product + architecture decisions" },
          { title: "Test first", detail: "failing gates before implementation" },
          { title: "Review", detail: "code + security + judge critique" },
          { title: "Verify", detail: "browser + accessibility + build" },
        ],
        proof: null,
        metrics: {
          label: "Primary Codex session · 019f71f8-76e3-7462-b8a5-7d571dbe5466",
          items: [
            { value: "125", label: "automated tests" },
            { value: "29", label: "calibration cases" },
            { value: "16", label: "browser checks" },
            { value: "0", label: "production vulnerabilities" },
          ],
        },
      }),
  },
  {
    text: "The result has more than one hundred automated tests, adversarial repair and transfer calibration, desktop and mobile browser coverage, accessible states, and a free public demo. ReasonPatch: repair the step, keep the thinking yours.",
    action: async (page) => {
      await gotoExpected(page, "https://reasonpatch.vercel.app", "Repair the step.");
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    },
  },
];

const durationOf = (path) =>
  Number(
    execFileSync(
      "ffprobe",
      [
        "-v",
        "error",
        "-show_entries",
        "format=duration",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        path,
      ],
      { encoding: "utf8" },
    ).trim(),
  );

const formatTimestamp = (seconds) => {
  const milliseconds = Math.round(seconds * 1_000);
  const hours = Math.floor(milliseconds / 3_600_000);
  const minutes = Math.floor((milliseconds % 3_600_000) / 60_000);
  const wholeSeconds = Math.floor((milliseconds % 60_000) / 1_000);
  const remainder = milliseconds % 1_000;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(wholeSeconds).padStart(2, "0")},${String(remainder).padStart(3, "0")}`;
};

const showCaption = async (page, text) => {
  await page.evaluate((captionText) => {
    const existing = document.querySelector("#reasonpatch-video-caption");
    const caption = existing ?? document.createElement("div");
    caption.id = "reasonpatch-video-caption";
    caption.textContent = captionText;
    Object.assign(caption.style, {
      position: "fixed",
      zIndex: "2147483647",
      left: "50%",
      bottom: "24px",
      transform: "translateX(-50%)",
      width: "min(1120px, calc(100vw - 64px))",
      padding: "12px 18px",
      borderRadius: "14px",
      background: "rgba(24, 24, 24, 0.9)",
      color: "white",
      font: "600 20px/1.35 Arial, sans-serif",
      textAlign: "center",
      boxShadow: "0 8px 30px rgba(0,0,0,0.24)",
      pointerEvents: "none",
    });
    if (!existing) document.body.append(caption);
  }, text);
};

const audioSegments = segments.map((segment, index) => {
  const path = resolve(audioDirectory, `${String(index + 1).padStart(2, "0")}.aiff`);
  execFileSync("say", ["-v", "Samantha", "-r", "180", "-o", path, segment.text]);
  return { ...segment, path, duration: durationOf(path) };
});

writeFileSync(
  resolve(outputDirectory, "audio-concat.txt"),
  audioSegments.map(({ path }) => `file '${path.replaceAll("'", "'\\''")}'`).join("\n"),
);
execFileSync(
  "ffmpeg",
  [
    "-y",
    "-f",
    "concat",
    "-safe",
    "0",
    "-i",
    resolve(outputDirectory, "audio-concat.txt"),
    "-c:a",
    "pcm_s16le",
    resolve(outputDirectory, "narration.wav"),
  ],
  { stdio: "ignore" },
);

const browser = await chromium.launch({ headless: true });
let context;
let leadInSeconds;
let rawVideoPath;

try {
  context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: {
      dir: resolve(outputDirectory, "raw"),
      size: { width: 1440, height: 900 },
    },
  });
  const page = await context.newPage();
  const recordingStartedAt = Date.now();
  await gotoExpected(page, "https://reasonpatch.vercel.app", "Repair the step.");
  leadInSeconds = (Date.now() - recordingStartedAt) / 1_000 + 0.5;
  await page.waitForTimeout(500);

  for (const [index, segment] of audioSegments.entries()) {
    const segmentStartedAt = Date.now();
    await showCaption(page, segment.text);
    await segment.action(page);
    await showCaption(page, segment.text);
    const actionDuration = Date.now() - segmentStartedAt;
    const segmentDuration = Math.ceil(segment.duration * 1_000);
    if (actionDuration > segmentDuration) {
      throw new Error(
        `Scene ${index + 1} exceeded its narration budget (${actionDuration}ms > ${segmentDuration}ms).`,
      );
    }
    const remainingDuration = segmentDuration - actionDuration;
    await page.waitForTimeout(remainingDuration);
  }
  await page.waitForTimeout(1_000);

  const recordedVideo = page.video();
  await context.close();
  context = undefined;
  rawVideoPath = await recordedVideo.path();
} finally {
  await context?.close().catch(() => undefined);
  await browser.close();
}

if (leadInSeconds === undefined || rawVideoPath === undefined) {
  throw new Error("The browser recording did not finish.");
}

let subtitleCursor = leadInSeconds;
const subtitles = audioSegments.map((segment, index) => {
  const start = subtitleCursor;
  const end = start + segment.duration;
  subtitleCursor = end;
  return `${index + 1}\n${formatTimestamp(start)} --> ${formatTimestamp(end)}\n${segment.text}\n`;
});
const subtitlesPath = resolve(outputDirectory, "captions.srt");
writeFileSync(subtitlesPath, subtitles.join("\n"));

const outputPath = resolve(outputDirectory, "reasonpatch-build-week-demo.mp4");
execFileSync(
  "ffmpeg",
  [
    "-y",
    "-i",
    rawVideoPath,
    "-i",
    resolve(outputDirectory, "narration.wav"),
    "-filter_complex",
    `[1:a]adelay=${Math.round(leadInSeconds * 1_000)}:all=1,apad=pad_dur=1[a]`,
    "-map",
    "0:v",
    "-map",
    "[a]",
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    "20",
    "-c:a",
    "aac",
    "-b:a",
    "192k",
    "-movflags",
    "+faststart",
    "-shortest",
    outputPath,
  ],
  { stdio: "inherit" },
);

const duration = durationOf(outputPath);
const rawDuration = durationOf(rawVideoPath);
if (Math.abs(rawDuration - duration) > 0.25) {
  throw new Error(
    `Encoded duration drifted from the recording (${duration.toFixed(2)}s vs ${rawDuration.toFixed(2)}s).`,
  );
}
if (duration >= 180) {
  throw new Error(`Demo is ${duration.toFixed(1)} seconds; it must remain under three minutes.`);
}

const narration = audioSegments.map(({ text }) => text).join("\n\n");
writeFileSync(resolve(outputDirectory, "narration.txt"), narration);
writeFileSync(
  resolve(outputDirectory, "README.txt"),
  `ReasonPatch Build Week demo\nDuration: ${duration.toFixed(1)} seconds\nUpload: ${outputPath}\n`,
);

process.stdout.write(
  `${outputPath}\n${duration.toFixed(1)} seconds\n${readFileSync(resolve(outputDirectory, "README.txt"), "utf8")}`,
);
