import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("learner repairs the causal inference hinge and receives a receipt", async ({
  page,
}, testInfo) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Causation or coincidence?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Find the hinge" }).click();
  await expect(page.getByText("Repair crew complete")).toBeVisible();
  const questionHeading = page.getByRole("heading", {
    name: "One question before you revise",
  });
  await expect(questionHeading).toBeVisible();
  await expect(questionHeading).toBeInViewport();

  await page
    .getByLabel("Revised explanation")
    .fill(
      "Participants averaged eight points higher, but because students chose whether to participate, the difference alone does not establish causation. We need comparable baseline scores and random assignment or a well-controlled comparison.",
    );
  await page.getByRole("button", { name: "Create repair receipt" }).click();

  const receiptHeading = page.getByRole("heading", { name: "Repair receipt" });
  await expect(receiptHeading).toBeVisible();
  await expect(receiptHeading).toBeInViewport();
  await expect(page.getByText("Association is not causation")).toBeVisible();
  await expect(
    page.getByText("AI-generated challenge, not a grade"),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Try the reasoning on a fresh case" }),
  ).not.toBeVisible();
  await page.getByRole("button", { name: "Begin isolated fresh case" }).click();
  await expect(
    page.getByRole("heading", { name: "Try the reasoning on a fresh case" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Try the reasoning on a fresh case" }),
  ).toBeInViewport();
  await expect(
    page.getByRole("heading", { name: "Repair receipt" }),
  ).not.toBeVisible();
  await expect(page.getByText("Visible rubric")).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: /Causation or coincidence/ }),
  ).not.toBeVisible();
  await expect(
    page.getByText(
      /prior diagnosis, question, rubric, and receipt are hidden/i,
    ),
  ).toBeVisible();
  await page
    .getByLabel("Fresh-case explanation")
    .fill(
      "The recovery difference does not establish causation because patients chose whether to join. Random assignment or a controlled comparison would be stronger.",
    );
  await page.getByRole("button", { name: "Check transfer evidence" }).click();
  const transferHeading = page.getByRole("heading", { name: "Transfer slip" });
  await expect(transferHeading).toBeVisible();
  await expect(transferHeading).toBeInViewport();
  await expect(
    page.getByText(
      "Observed evidence in a new context — not proof of learning or mastery.",
    ),
  ).toBeVisible();
  const blindedDownloadEvent = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download blinded rater packet" })
    .click();
  const blindedDownload = await blindedDownloadEvent;
  expect(blindedDownload.suggestedFilename()).toBe(
    "reasonpatch-correlation-causation-blinded-rater-packet.txt",
  );
  const blindedPath = await blindedDownload.path();
  expect(blindedPath).not.toBeNull();
  const blindedPacket = await readFile(blindedPath!, "utf8");
  expect(blindedPacket).toContain("BLINDED REASONING REVIEW PACKET");
  expect(blindedPacket).not.toMatch(
    /ReasonPatch|provenance|demo-fixture|\[(?:MET|MISSING)\]|original response|submitted revision|fresh-case response/iu,
  );

  const auditDownloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download audit manifest" }).click();
  const auditDownload = await auditDownloadEvent;
  expect(auditDownload.suggestedFilename()).toBe(
    "reasonpatch-correlation-causation-audit-manifest.txt",
  );
  const auditPath = await auditDownload.path();
  expect(auditPath).not.toBeNull();
  const auditManifest = await readFile(auditPath!, "utf8");
  expect(auditManifest).toContain("REASONPATCH COORDINATOR AUDIT MANIFEST");
  expect(auditManifest).toContain("BEGIN RESPONSE A LEARNER TEXT");
  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  expect(accessibility.violations).toEqual([]);
  await page.screenshot({
    path: testInfo.outputPath("repair-receipt.png"),
    fullPage: true,
  });
});

test("forced Luna unavailability is transparently handled by Sol", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByLabel("Demonstrate Sol fallback").check();
  await page.getByRole("button", { name: "Find the hinge" }).click();

  await expect(
    page.getByText("Recorded Sol fallback", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("Fallback disclosed", { exact: true }),
  ).toBeVisible();
});

test("every curated statistics lab produces evidence-bound receipt states", async ({
  page,
}) => {
  await page.goto("/");

  const labs = [
    {
      button: /Accurate test, wrong conclusion/,
      heading: "Accurate test, wrong conclusion",
      revision:
        "The base rate is rare: 1 in 1,000. In 100,000 people, compare true positives and false positives among positive results.",
    },
    {
      button: /Who answered the survey/,
      heading: "Who answered the survey?",
      revision:
        "The campus population includes all students. A voluntary poll lets students choose to answer, creating bias; a representative random sample would be stronger.",
    },
  ];

  for (const lab of labs) {
    await page.getByRole("button", { name: lab.button }).click();
    await expect(
      page.getByRole("heading", { name: lab.heading }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Find the hinge" }).click();
    await page.getByLabel("Revised explanation").fill(lab.revision);
    await page.getByRole("button", { name: "Create repair receipt" }).click();
    await expect(
      page.getByText(/addresses 3 of 3 visible rubric criteria/),
    ).toBeVisible();
  }
});
