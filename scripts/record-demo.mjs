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

const segments = [
  {
    text: "Most AI tutors race to the correct answer. That can erase the reasoning step an educator actually needs to see.",
    action: async (page) => page.evaluate(() => window.scrollTo({ top: 0 })),
  },
  {
    text: "ReasonPatch takes the opposite approach: repair the step, while keeping the thinking with the learner.",
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
    action: async (page) => {
      await gotoExpected(
        page,
        "https://github.com/FusionCube18712/reasonpatch/blob/main/src/features/repair/orchestrator.ts#L100-L190",
        "gpt-5.6-luna",
      );
    },
  },
  {
    text: "I built ReasonPatch with Codex through test-first checkpoints and independent planning, architecture, code, security, and judge reviews.",
    action: async (page) => {
      await gotoExpected(
        page,
        "https://github.com/FusionCube18712/reasonpatch#codex-collaboration",
        "Codex collaboration",
      );
    },
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
