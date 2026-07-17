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

  await expect(page.getByText("Sol takeover", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Fallback disclosed", { exact: true })).toBeVisible();
});
