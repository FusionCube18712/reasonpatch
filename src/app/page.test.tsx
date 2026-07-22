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
      screen.getByText(/Orchestrated by GPT-5\.6 Sol with parallel Luna probes/iu),
    ).toBeVisible();
  });

  it("states the privacy and educational boundaries before learner input", () => {
    render(<Page />);

    expect(screen.getByText("Private in this tab")).toBeVisible();
    expect(screen.getByText(/won’t complete the work for you/iu)).toBeVisible();
    expect(
      screen.getByText(/Formative evidence, not a grade or proof of learning/iu),
    ).toBeVisible();
  });
});
