import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Page from "./page";

describe("ReasonPatch page", () => {
  it("opens directly on the four-domain office-hours workspace", () => {
    render(<Page />);

    expect(screen.getByText("ReasonPatch")).toBeVisible();
    expect(screen.getByText("AI office hours · Education track")).toBeVisible();
    expect(
      screen.getByRole("heading", {
        name: "Work through the step that’s stuck.",
      }),
    ).toBeVisible();
    expect(screen.getAllByRole("radio")).toHaveLength(4);
  });

  it("keeps the learning journey and provenance visible without a marketing gate", () => {
    render(<Page />);

    expect(screen.getByText("1 Attempt")).toBeVisible();
    expect(screen.getByText("2 Question")).toBeVisible();
    expect(screen.getByText("3 Revision")).toBeVisible();
    expect(screen.getByText("4 Apply")).toBeVisible();
    expect(
      screen.getByText(
        /Live mode uses GPT-5\.6 Sol with parallel Luna probes; guided examples use deterministic fixtures with zero model calls/iu,
      ),
    ).toBeVisible();
  });

  it("states the privacy and educational boundaries before learner input", () => {
    render(<Page />);

    expect(screen.getByText("Not saved by ReasonPatch")).toBeVisible();
    expect(
      screen.getByText(/designed to keep the work in your hands/iu),
    ).toBeVisible();
    expect(
      screen.getByText(/Formative evidence, not a grade or proof of learning/iu),
    ).toBeVisible();
  });

  it("exposes top-level banner, main, and content-info landmarks", () => {
    render(<Page />);

    expect(screen.getByRole("banner")).toBeVisible();
    expect(screen.getByRole("main")).toBeVisible();
    expect(screen.getByRole("contentinfo")).toBeVisible();
  });
});
