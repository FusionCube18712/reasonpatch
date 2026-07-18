import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Page from "./page";

describe("ReasonPatch page", () => {
  it("frames one complete Explain, Repair, Receipt, Transfer journey", () => {
    render(<Page />);

    expect(screen.getByText("ReasonPatch")).toBeVisible();
    expect(screen.getByText("Repair the step. Keep the thinking yours.")).toBeVisible();
    expect(screen.getByText("01 Explain")).toBeVisible();
    expect(screen.getByText("02 Repair")).toBeVisible();
    expect(screen.getByText("03 Receipt")).toBeVisible();
    expect(screen.getByText("04 Transfer")).toBeVisible();
  });

  it("gives judges above-the-fold shortcuts to the demo and implementation", () => {
    render(<Page />);

    expect(
      screen.getByRole("link", { name: "Try the 90-second demo" }),
    ).toHaveAttribute("href", "#reasoning-workspace");
    expect(
      screen.getByRole("link", { name: "View Sol/Luna source" }),
    ).toHaveAttribute(
      "href",
      "https://github.com/FusionCube18712/reasonpatch/blob/main/src/features/repair/orchestrator.ts",
    );
  });

  it("states the privacy and grading boundary before learner input", () => {
    render(<Page />);

    expect(screen.getByText(/No accounts or automatic browser storage/)).toBeVisible();
    expect(screen.getByText(/saved only when you choose to download/)).toBeVisible();
    expect(screen.getByText(/storage disabled/)).toBeVisible();
    expect(screen.getByText(/not grades or verdicts/i)).toBeVisible();
  });
});
