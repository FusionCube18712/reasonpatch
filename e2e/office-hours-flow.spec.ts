import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

type GuidedJourney = Readonly<{
  domain: string;
  exampleButton: string;
  issue: string;
  revision: string;
  transferPrompt: string;
  transferResponse: string;
}>;

const guidedJourneys: ReadonlyArray<GuidedJourney> = [
  {
    domain: "Formal logic",
    exampleButton: "Try the formal logic example",
    issue: "Negation introduction closes before a contradiction is derived",
    revision: `1. ¬p          Premise
2. | p ∧ q     Assumption
3. | p         ∧E 2
4. | ⊥         ¬E 1, 3
5. ¬(p ∧ q)    ¬I 2–4`,
    transferPrompt:
      "From ¬r, explain how to prove ¬(r ∧ s). Describe what must happen inside the temporary assumption before it can be discharged.",
    transferResponse:
      "Assume r ∧ s. Extract r; together with ¬r this derives a contradiction ⊥. Discharge the assumption by negation introduction (¬I).",
  },
  {
    domain: "Algebra",
    exampleButton: "Try the algebra example",
    issue: "The negative square branch disappears",
    revision:
      "x² - 9 = 0, so (x - 3)(x + 3) = 0. By the zero-product property, x = 3 or x = -3; both values square to 9.",
    transferPrompt:
      "Solve y² = 16 in words. Name every real solution and explain why both branches must be considered.",
    transferResponse:
      "y = 4 and y = -4. Both values square to 16, so both square branches must be considered.",
  },
  {
    domain: "Python",
    exampleButton: "Try the python example",
    issue: "Empty input reaches division by zero",
    revision: `def average(nums):
    if not nums:
        raise ValueError("average requires at least one value")
    return sum(nums) / len(nums)`,
    transferPrompt:
      "A function returns max(values) - min(values). What must it do before calling max and min, why, and what explicit empty-input policy should it use?",
    transferResponse:
      "Check whether values are empty before calling max or min. If there are no values, raise a ValueError as an explicit policy.",
  },
  {
    domain: "Causal reasoning",
    exampleButton: "Try the causal reasoning example",
    issue: "An observed association is upgraded to definite causation",
    revision:
      "This observational association does not establish causation. Students who choose flashcards may study longer or be more motivated. A randomized controlled study or a comparison that controls for prior achievement would provide stronger causal evidence.",
    transferPrompt:
      "Neighborhoods with more firefighters often have more fire damage. Why does that not show firefighters cause the damage, and what severity-aware comparison would be stronger?",
    transferResponse:
      "The association does not show that firefighters cause damage. Fire severity drives both the number of firefighters and the damage. A comparison controlling for severity would be stronger.",
  },
] as const;

const expectWcagAAndAA = async (page: Page) => {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();

  expect(results.violations).toEqual([]);
};

const loadGuidedExample = async (page: Page, journey: GuidedJourney) => {
  await page.getByText(journey.domain, { exact: true }).click();
  await expect(
    page.getByRole("radio", { name: new RegExp(journey.domain, "i") }),
  ).toBeChecked();
  await page.getByRole("button", { name: journey.exampleButton }).click();
  await expect(page.getByLabel("Problem or assignment")).toHaveAttribute(
    "readonly",
    "",
  );
  await expect(page.getByLabel("Guided starting attempt")).toHaveAttribute(
    "readonly",
    "",
  );
};

const completeGuidedJourney = async (
  page: Page,
  journey: GuidedJourney,
) => {
  await loadGuidedExample(page, journey);

  const diagnosisResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/coach/diagnose") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Find the first break" }).click();
  expect((await diagnosisResponse).status()).toBe(200);

  await expect(
    page.getByRole("heading", { name: "What already works" }),
  ).toBeVisible();
  await expect(page.getByText(journey.issue, { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "Question to answer before you revise",
    }),
  ).toBeFocused();

  await page.getByRole("button", { name: "Give me a nudge" }).click();
  await expect(page.getByRole("list", { name: "Revealed hints" })).toContainText(
    "Location",
  );
  const provenance = page.getByText("How this was checked").locator("..");
  await expect(provenance).toContainText(/modelCalls/iu);
  await expect(provenance.locator("pre")).not.toBeVisible();

  await page.getByRole("button", { name: "Revise this attempt" }).click();
  await expect(page.getByLabel("Edit the guided draft")).not.toHaveValue("");
  await page.getByLabel("Edit the guided draft").fill(journey.revision);

  const reviewResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/coach/review") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Check my revision" }).click();
  expect((await reviewResponse).status()).toBe(200);

  const receipt = page.getByRole("region", { name: "Revision evidence" });
  await expect(receipt).toContainText(
    "Evidence was observed for every guided-scenario criterion.",
  );
  await expect(receipt.getByText("More learner evidence is needed.")).toHaveCount(0);

  await page.getByRole("button", { name: "Try a fresh case" }).click();
  await expect(
    page.getByRole("region", { name: "Fresh transfer case" }),
  ).toContainText(journey.transferPrompt);
  await expect(
    page.getByRole("heading", {
      name: "Question to answer before you revise",
    }),
  ).not.toBeVisible();
  await expect(page.getByText(journey.issue, { exact: true })).not.toBeVisible();
  await expect(
    page.getByRole("region", { name: "Revision evidence" }),
  ).not.toBeVisible();
  await expect(page.getByText("Isolation boundary active")).toBeVisible();

  await page
    .getByLabel("Your response to the fresh case")
    .fill(journey.transferResponse);
  const transferResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/coach/transfer") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Check this fresh case" }).click();
  expect((await transferResponse).status()).toBe(200);

  const transferResult = page.getByRole("status", {
    name: "Fresh-case evidence result",
  });
  await expect(transferResult).toContainText(
    "Evidence was observed in the fresh, isolated case.",
  );
  await expect(transferResult).toContainText(
    "Formative evidence here supports no broader learning conclusion.",
  );
};

test.describe("guided office-hours journeys", () => {
  for (const journey of guidedJourneys) {
    test(`${journey.domain} completes diagnosis, revision, receipt, and isolated transfer`, async ({
      page,
    }) => {
      await page.goto("/");
      await completeGuidedJourney(page, journey);
    });
  }
});

test("major office-hours stages have no WCAG A/AA violations", async ({
  page,
}) => {
  const journey = guidedJourneys[1]!;
  await page.goto("/");
  await expectWcagAAndAA(page);

  await loadGuidedExample(page, journey);
  await page.getByRole("button", { name: "Find the first break" }).click();
  await expect(page.getByText(journey.issue, { exact: true })).toBeVisible();
  await expectWcagAAndAA(page);

  await page.getByRole("button", { name: "Revise this attempt" }).click();
  await page.getByLabel("Edit the guided draft").fill(journey.revision);
  await expectWcagAAndAA(page);

  await page.getByRole("button", { name: "Check my revision" }).click();
  await expect(
    page.getByRole("region", { name: "Revision evidence" }),
  ).toBeVisible();
  await expectWcagAAndAA(page);

  await page.getByRole("button", { name: "Try a fresh case" }).click();
  await page
    .getByLabel("Your response to the fresh case")
    .fill(journey.transferResponse);
  await page.getByRole("button", { name: "Check this fresh case" }).click();
  await expect(
    page.getByRole("status", { name: "Fresh-case evidence result" }),
  ).toBeVisible();
  await expectWcagAAndAA(page);
});

test("mobile workspace avoids horizontal overflow through the full journey", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");

  const expectNoHorizontalOverflow = async () => {
    expect(
      await page.evaluate(
        () =>
          document.documentElement.scrollWidth <=
          document.documentElement.clientWidth,
      ),
    ).toBe(true);
  };

  await expectNoHorizontalOverflow();
  await completeGuidedJourney(page, guidedJourneys[2]!);
  await expectNoHorizontalOverflow();
});

test("domain selection and the writing workspace are keyboard operable", async ({
  page,
}) => {
  await page.goto("/");
  await page.keyboard.press("Tab");

  const guidedAction = page.getByRole("button", {
    name: "Try the formal logic example",
  });
  await expect(guidedAction).toBeFocused();
  await page.keyboard.press("Tab");

  const logicRadio = page.getByRole("radio", { name: /Formal logic/i });
  await expect(logicRadio).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio", { name: /Algebra/i })).toBeChecked();

  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Problem or assignment")).toBeFocused();
  await page.keyboard.type("Solve a quadratic equation over the reals.");
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Your current attempt")).toBeFocused();
});

test("live-mode-disabled boundary never sends custom learner text", async ({
  page,
}) => {
  const coachRequests: string[] = [];
  const openAiRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/coach/")) coachRequests.push(request.url());
    if (new URL(request.url()).hostname.endsWith("openai.com")) {
      openAiRequests.push(request.url());
    }
  });

  await page.goto("/");
  await expect(
    page.getByText("Custom live coaching is disabled locally."),
  ).toBeVisible();
  await page
    .getByLabel("Problem or assignment")
    .fill("Explain whether this custom argument is logically valid.");
  await page
    .getByLabel("Your current attempt")
    .fill("I think the argument is valid because the conclusion sounds true.");
  await expect(
    page.getByRole("checkbox", {
      name: /send this text to OpenAI for processing/i,
    }),
  ).toHaveCount(0);

  await expect(
    page.getByRole("button", { name: "Find the first break" }),
  ).toBeDisabled();
  expect(coachRequests).toEqual([]);
  expect(openAiRequests).toEqual([]);
  await expect(page.getByLabel(/API key/i)).toHaveCount(0);
  await expect(page.getByLabel(/model/i)).toHaveCount(0);
  await expect(page.getByLabel(/endpoint/i)).toHaveCount(0);
});
