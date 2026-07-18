import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("learner repairs the causal inference hinge and receives a receipt", async ({
  page,
}, testInfo) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "Causation or coincidence?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Find the hinge" }).click();
  await expect(page.getByText("Repair crew complete")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "One question before you revise" }),
  ).toBeVisible();

  await page.getByLabel("Revised explanation").fill(
    "Participants averaged eight points higher, but because students chose whether to participate, the difference alone does not establish causation. We need comparable baseline scores and random assignment or a well-controlled comparison.",
  );
  await page.getByRole("button", { name: "Create repair receipt" }).click();

  await expect(page.getByRole("heading", { name: "Repair receipt" })).toBeVisible();
  await expect(page.getByText("Association is not causation")).toBeVisible();
  await expect(page.getByText("AI-generated challenge, not a grade")).toBeVisible();
  const accessibility = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(accessibility.violations).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath("repair-receipt.png"), fullPage: true });
});

test("forced Luna unavailability is transparently handled by Sol", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Demonstrate Sol fallback").check();
  await page.getByRole("button", { name: "Find the hinge" }).click();

  await expect(
    page.getByText("Recorded Sol fallback", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText("Fallback disclosed", { exact: true })).toBeVisible();
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
    await expect(page.getByRole("heading", { name: lab.heading })).toBeVisible();
    await page.getByRole("button", { name: "Find the hinge" }).click();
    await page.getByLabel("Revised explanation").fill(lab.revision);
    await page.getByRole("button", { name: "Create repair receipt" }).click();
    await expect(page.getByText(/addresses 3 of 3 visible rubric criteria/)).toBeVisible();
  }
});
