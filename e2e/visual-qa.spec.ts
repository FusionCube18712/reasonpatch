import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const viewports = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1440, height: 1000 },
] as const;

for (const viewport of viewports) {
  test(`visual smoke at ${viewport.name}`, async ({ page }, testInfo) => {
    const consoleErrors: string[] = [];
    const failedResponses: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("response", (response) => {
      if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
    });

    await page.setViewportSize(viewport);
    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        name: "Work through the step that’s stuck.",
      }),
    ).toBeVisible();

    const hasHorizontalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasHorizontalOverflow).toBe(false);
    expect(consoleErrors).toEqual([]);
    expect(failedResponses).toEqual([]);

    await page.screenshot({
      path: testInfo.outputPath(`${viewport.name}-home.png`),
      fullPage: true,
    });
  });
}

test("initial workspace has no serious WCAG A/AA violations", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();

  expect(results.violations).toEqual([]);
});
