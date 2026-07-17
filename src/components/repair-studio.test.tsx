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
      expect.stringContaining("caused the improvement"),
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
});

