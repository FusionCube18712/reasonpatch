import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { RepairStudio } from "./repair-studio";

describe("RepairStudio", () => {
  it("starts with the rubric visible and the sample ready", () => {
    render(<RepairStudio />);

    expect(
      screen.getByRole("heading", { name: "Causation or coincidence?" }),
    ).toBeVisible();
    expect(screen.getByText("Distinguishes association from causation")).toBeVisible();
    expect(screen.getByLabelText("Your explanation")).toHaveValue(
      "The tutoring program caused the improvement because participants scored eight points higher. Therefore every school should use it.",
    );
  });

  it("announces progress and reveals the repair question", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            runId: "run_demo",
            diagnosis: {
              hingeQuote: "The tutoring program caused the improvement",
              misconception: "association-as-causation",
              explanation: "A difference alone cannot isolate a cause.",
              socraticQuestion: "What if more motivated students chose tutoring?",
              whyThisQuestion: "It tests a selection effect.",
              rubric: [],
              limitation: "AI-generated challenge, not a grade.",
            },
            probes: [],
            trace: { degraded: false, probes: [] },
          },
          error: null,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    render(<RepairStudio />);

    await user.click(screen.getByRole("button", { name: "Find the hinge" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Repair crew complete");
    expect(
      screen.getByRole("heading", { name: "One question before you revise" }),
    ).toBeVisible();
    expect(screen.getByText("What if more motivated students chose tutoring?")).toBeVisible();
  });

  it("shows a plain-language recovery state when analysis fails", async () => {
    const user = userEvent.setup();
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: false,
          data: null,
          error: { code: "UNAVAILABLE", message: "Analysis is temporarily unavailable." },
        }),
        { status: 503, headers: { "Content-Type": "application/json" } },
      ),
    );
    render(<RepairStudio />);

    await user.click(screen.getByRole("button", { name: "Find the hinge" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Analysis is temporarily unavailable.",
    );
    expect(screen.getByRole("button", { name: "Try again" })).toBeVisible();
  });

  it("turns the learner's revision into an auditable repair receipt", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, "fetch");
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            runId: "run_demo",
            diagnosis: {
              hingeQuote: "The tutoring program caused the improvement",
              misconception: "association-as-causation",
              explanation: "A difference alone cannot isolate a cause.",
              socraticQuestion: "What if more motivated students chose tutoring?",
              whyThisQuestion: "It tests a selection effect.",
              rubric: [],
              limitation: "AI-generated challenge, not a grade.",
            },
            probes: [],
            trace: { degraded: false, probes: [] },
          },
          error: null,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            activityId: "correlation-causation",
            repairedHinge: "Association is not causation",
            summary: "The revision now qualifies the causal claim.",
            changes: [
              {
                label: "Causal claim",
                before: "The program caused the improvement.",
                after: "The difference alone does not establish causation.",
              },
            ],
            rubric: [
              {
                id: "association-causation",
                label: "Distinguishes association from causation",
                before: "missing",
                after: "met",
                evidence: "does not establish causation",
              },
            ],
            remainingCaveat: "A stronger study design is still needed.",
            provenance: { model: "gpt-5.6-sol", mode: "demo" },
          },
          error: null,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    render(<RepairStudio />);

    await user.click(screen.getByRole("button", { name: "Find the hinge" }));
    await user.type(
      screen.getByLabelText("Revised explanation"),
      "Participants scored higher, but self-selection means the difference alone does not establish causation. We need comparable baselines and random assignment.",
    );
    await user.click(screen.getByRole("button", { name: "Create repair receipt" }));

    expect(await screen.findByRole("heading", { name: "Repair receipt" })).toBeVisible();
    expect(screen.getByText("Association is not causation")).toBeVisible();
    expect(screen.getByText("AI-generated challenge, not a grade")).toBeVisible();
  });
});
