import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Page from "./page";

describe("ReasonPatch page", () => {
  it("frames one complete Explain, Repair, Receipt journey", () => {
    render(<Page />);

    expect(screen.getByText("ReasonPatch")).toBeVisible();
    expect(screen.getByText("Repair the step. Keep the thinking yours.")).toBeVisible();
    expect(screen.getByText("01 Explain")).toBeVisible();
    expect(screen.getByText("02 Repair")).toBeVisible();
    expect(screen.getByText("03 Receipt")).toBeVisible();
  });

  it("states the privacy and grading boundary before learner input", () => {
    render(<Page />);

    expect(screen.getByText(/No accounts or local text storage/)).toBeVisible();
    expect(screen.getByText(/storage disabled/)).toBeVisible();
    expect(screen.getByText(/not grades or verdicts/i)).toBeVisible();
  });
});
