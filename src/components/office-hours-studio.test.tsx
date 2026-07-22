import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { CoachDiagnosis } from "@/features/coach/contracts";
import { getScenario } from "@/features/coach/scenarios";
import { OfficeHoursStudio } from "./office-hours-studio";

const diagnosis = {
  strengths: [
    "The attempt begins from the provided premise.",
    "The conjunction-elimination step preserves the learner's strategy.",
  ],
  hingeQuote: "4. ¬(p ∧ q)    ¬I 1, 3",
  issueTitle: "The contradiction step is missing",
  issueLocation: "The fourth line discharges the assumption too early.",
  explanation:
    "Negation introduction needs a contradiction while the temporary assumption remains in scope.",
  socraticQuestion:
    "What can you derive from p and ¬p before closing the subproof?",
  whyThisQuestion:
    "It targets the missing inference without completing the proof for the learner.",
  hints: [
    { level: "location", text: "Inspect the final transition." },
    {
      level: "concept",
      text: "Negation introduction closes a complete subproof.",
    },
    {
      level: "strategy",
      text: "Look for what p and ¬p jointly imply before line four.",
    },
  ],
  criteria: [
    {
      id: "explicit-contradiction",
      label: "Derives an explicit contradiction",
      state: "missing",
      evidence: null,
    },
    {
      id: "scoped-assumption",
      label: "Keeps the temporary assumption in scope",
      state: "emerging",
      evidence: "2. | p ∧ q     Assumption",
    },
  ],
  limitation:
    "This is bounded formative feedback, not proof that the work is correct.",
} satisfies CoachDiagnosis;

const diagnoseEnvelope = (nextDiagnosis: CoachDiagnosis = diagnosis) => ({
  success: true,
  data: {
    runId: "coach_run_ui_test",
    source: {
      kind: "custom",
      domain: "formal-logic",
      assignment:
        "Using Fitch-style natural deduction, prove ¬p ⊢ ¬(p ∧ q).",
      constraints: "Use Fitch-style natural deduction.",
    },
    diagnosis: nextDiagnosis,
    probes: [],
    trace: {
      plannerModel: "gpt-5.6-sol",
      synthesisModel: "gpt-5.6-sol",
      degraded: false,
      probes: [],
    },
  },
  error: null,
});

const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const openConstraints = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(
    screen.getByRole("button", {
      name: "Course rules or constraints (optional)",
    }),
  );
  return screen.getByLabelText(/Course rules or constraints/iu);
};

const fillCustomDraft = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole("radio", { name: /Python/iu }));

  const assignment = screen.getByLabelText("Problem or assignment");
  await user.clear(assignment);
  await user.type(
    assignment,
    "Review this Python function for correctness on every list input.",
  );

  const attempt = screen.getByLabelText("Your current attempt");
  await user.clear(attempt);
  await user.type(
    attempt,
    "def average(nums):\n    return sum(nums) / len(nums)",
  );

  const constraints = await openConstraints(user);
  await user.clear(constraints);
  await user.type(
    constraints,
    "Preserve non-empty behavior and choose an empty-input policy.",
  );

  return { assignment, attempt, constraints };
};

const diagnoseCustomDraft = async () => {
  const user = userEvent.setup();
  vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
    jsonResponse(diagnoseEnvelope()),
  );
  render(<OfficeHoursStudio />);
  const fields = await fillCustomDraft(user);
  await user.click(
    screen.getByRole("button", { name: "Find the first break" }),
  );
  await screen.findByText(diagnosis.socraticQuestion);
  return { user, ...fields };
};

const collectKeys = (value: unknown): string[] => {
  if (Array.isArray(value)) return value.flatMap(collectKeys);
  if (value === null || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, nested]) => [
    key,
    ...collectKeys(nested),
  ]);
};

describe("OfficeHoursStudio", () => {
  it("opens directly on the office-hours workspace and states the authorship boundary", () => {
    render(<OfficeHoursStudio />);

    expect(
      screen.getByRole("heading", {
        name: "Work through the step that’s stuck.",
      }),
    ).toBeVisible();
    expect(
      screen.getByText(/Paste the problem and your attempt/iu),
    ).toBeVisible();
    expect(
      screen.getByText(/won’t complete the work for you/iu),
    ).toBeVisible();
    expect(screen.getByText("Private in this tab")).toBeVisible();
    expect(
      screen.getByRole("heading", {
        name: "Bring the draft, not just the question.",
      }),
    ).toBeVisible();
  });

  it("offers exactly four accessible reasoning-domain choices", () => {
    render(<OfficeHoursStudio />);

    const chooser = screen.getByRole("group", {
      name: "What are you working on?",
    });
    const radios = within(chooser).getAllByRole("radio");

    expect(radios).toHaveLength(4);
    expect(
      within(chooser).getByRole("radio", { name: /Formal logic/iu }),
    ).toBeChecked();
    expect(
      within(chooser).getByRole("radio", { name: /Algebra/iu }),
    ).toBeVisible();
    expect(
      within(chooser).getByRole("radio", { name: /Python/iu }),
    ).toBeVisible();
    expect(
      within(chooser).getByRole("radio", { name: /Causal reasoning/iu }),
    ).toBeVisible();
  });

  it("loads the selected guided scenario into all learner context fields", async () => {
    const user = userEvent.setup();
    const scenario = getScenario("logic-negation-introduction");
    render(<OfficeHoursStudio />);

    await user.click(
      screen.getByRole("button", { name: "Try the formal logic example" }),
    );

    expect(screen.getByLabelText("Problem or assignment")).toHaveValue(
      scenario.assignment,
    );
    expect(screen.getByLabelText("Your current attempt")).toHaveValue(
      scenario.attempt,
    );
    await openConstraints(user);
    expect(
      screen.getByLabelText(/Course rules or constraints/iu),
    ).toHaveValue(scenario.constraints);
  });

  it("accepts a learner's assignment, attempt, and optional constraints", async () => {
    const user = userEvent.setup();
    render(<OfficeHoursStudio />);

    const { assignment, attempt, constraints } = await fillCustomDraft(user);

    expect(assignment).toHaveValue(
      "Review this Python function for correctness on every list input.",
    );
    expect(attempt).toHaveValue(
      "def average(nums):\n    return sum(nums) / len(nums)",
    );
    expect(constraints).toHaveValue(
      "Preserve non-empty behavior and choose an empty-input policy.",
    );
  });

  it("posts custom work only to the same-origin coach boundary", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse(diagnoseEnvelope()));
    render(<OfficeHoursStudio />);
    await fillCustomDraft(user);

    await user.click(
      screen.getByRole("button", { name: "Find the first break" }),
    );
    await screen.findByText(diagnosis.socraticQuestion);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("/api/coach/diagnose");
    expect(init).toMatchObject({ method: "POST" });
    expect(new Headers(init?.headers).get("Content-Type")).toBe(
      "application/json",
    );
    expect(new Headers(init?.headers).get("X-ReasonPatch-Mode")).toBe("live");
    expect(new Headers(init?.headers).has("Authorization")).toBe(false);

    const body = JSON.parse(String(init?.body)) as unknown;
    expect(body).toMatchObject({
      source: {
        kind: "custom",
        domain: "python",
        assignment:
          "Review this Python function for correctness on every list input.",
        attempt: "def average(nums):\n    return sum(nums) / len(nums)",
        constraints:
          "Preserve non-empty behavior and choose an empty-input policy.",
      },
      mode: "live",
      coachStyle: "socratic",
      forceLunaFallback: false,
    });
    expect(collectKeys(body)).not.toEqual(
      expect.arrayContaining(["apiKey", "key", "endpoint", "model"]),
    );
  });

  it("renders strengths, the exact hinge, and one focused question", async () => {
    await diagnoseCustomDraft();

    expect(
      screen.getByRole("heading", { name: "What already works" }),
    ).toBeVisible();
    expect(screen.getByText(diagnosis.strengths[0]!)).toBeVisible();
    expect(
      screen.getByRole("heading", {
        name: "First place the reasoning breaks",
      }),
    ).toBeVisible();
    expect(screen.getByText(diagnosis.hingeQuote)).toBeVisible();
    expect(
      screen.getByRole("heading", {
        name: "Question to answer before you revise",
      }),
    ).toBeVisible();
    expect(screen.getByText(diagnosis.socraticQuestion)).toBeVisible();
  });

  it("keeps hints hidden and reveals them one at a time in order", async () => {
    const { user } = await diagnoseCustomDraft();
    const firstHint = diagnosis.hints[0]!;
    const secondHint = diagnosis.hints[1]!;
    const thirdHint = diagnosis.hints[2]!;

    expect(screen.queryByText(firstHint.text)).not.toBeInTheDocument();
    expect(screen.queryByText(secondHint.text)).not.toBeInTheDocument();
    expect(screen.queryByText(thirdHint.text)).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /nudge|hint/iu }),
    );
    expect(screen.getByText(firstHint.text)).toBeVisible();
    expect(screen.queryByText(secondHint.text)).not.toBeInTheDocument();
    expect(screen.queryByText(thirdHint.text)).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /nudge|hint/iu }),
    );
    expect(screen.getByText(secondHint.text)).toBeVisible();
    expect(screen.queryByText(thirdHint.text)).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /nudge|hint/iu }),
    );
    expect(screen.getByText(thirdHint.text)).toBeVisible();
  });

  it("prefills revision with the learner's exact attempt and no generated text", async () => {
    const { user, attempt } = await diagnoseCustomDraft();
    const exactAttempt = String((attempt as HTMLTextAreaElement).value);

    await user.click(
      screen.getByRole("button", { name: "Revise this attempt" }),
    );

    expect(screen.getByLabelText("Edit your own draft")).toHaveValue(
      exactAttempt,
    );
    expect(screen.getByText(/Every edit remains yours/iu)).toBeVisible();
  });

  it("clears stale coaching when the source attempt changes", async () => {
    const { user, attempt } = await diagnoseCustomDraft();

    await user.type(attempt, "\n5. I changed the source draft.");

    expect(
      screen.queryByText(diagnosis.socraticQuestion),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(diagnosis.hingeQuote)).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "This draft changed, so the previous coaching was cleared.",
    );
  });

  it("does not expose provider, endpoint, model, or API-key controls", () => {
    const { container } = render(<OfficeHoursStudio />);

    expect(
      screen.queryByLabelText(/API key|provider|endpoint|model/iu),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Connect an LLM/iu)).not.toBeInTheDocument();
    expect(container.querySelector('input[type="password"]')).toBeNull();
  });

  it("renders prompt-injection and HTML-shaped model text inertly", async () => {
    const user = userEvent.setup();
    const maliciousMarkup =
      '<img src=x onerror="window.__reasonPatchXss = true">';
    const maliciousQuestion =
      '<script>window.__reasonPatchXss = true</script> What assumption is unsupported?';
    const hostileDiagnosis = {
      ...diagnosis,
      strengths: [`The learner included ${maliciousMarkup} as plain text.`],
      hingeQuote: maliciousMarkup,
      socraticQuestion: maliciousQuestion,
    } satisfies CoachDiagnosis;
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(jsonResponse(diagnoseEnvelope(hostileDiagnosis)));
    const { container } = render(<OfficeHoursStudio />);
    await fillCustomDraft(user);

    await user.click(
      screen.getByRole("button", { name: "Find the first break" }),
    );
    await screen.findByText(maliciousQuestion);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(screen.getAllByText(maliciousMarkup).length).toBeGreaterThan(0);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("[onerror]")).toBeNull();
  });
});
