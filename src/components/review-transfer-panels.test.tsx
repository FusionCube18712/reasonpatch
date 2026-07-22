import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { getScenario } from "@/features/coach/scenarios";
import {
  ReviewReceiptPanel,
  TransferPanel,
  type ReviewArtifact,
} from "./review-transfer-panels";

describe("evidence panels", () => {
  it("renders criterion states without giving missing evidence a success mark", () => {
    const review: ReviewArtifact = {
      status: "needs-work",
      summary: "One criterion still needs evidence.",
      criteria: [
        {
          id: "met",
          label: "Observed step",
          state: "met",
          evidence: "learner evidence",
        },
        {
          id: "missing",
          label: "Missing step",
          state: "missing",
          evidence: null,
        },
      ],
    };

    render(
      <ReviewReceiptPanel
        review={review}
        isGuided={false}
        onReviseAgain={vi.fn()}
        onTransfer={vi.fn()}
      />,
    );

    const observed = screen.getByText("Observed step").closest("li");
    const missing = screen.getByText("Missing step").closest("li");
    expect(observed).not.toBeNull();
    expect(missing).not.toBeNull();
    expect(within(observed!).getByText("Evidence observed")).toBeVisible();
    expect(within(missing!).getByText("Needs more evidence")).toBeVisible();
    expect(within(missing!).queryByText("Evidence observed")).not.toBeInTheDocument();
  });

  it("shows fresh-case criteria before answering and actionable missing evidence after checking", () => {
    render(
      <TransferPanel
        scenario={getScenario("causal-observational-claim")}
        response=""
        evaluation={{
          status: "needs-work",
          summary: "The fresh case still needs learner evidence.",
          criteria: [
            {
              id: "fresh-common-cause",
              label: "Identifies fire severity as a common cause",
              state: "missing",
              evidence: null,
            },
          ],
        }}
        isChecking={false}
        onChange={vi.fn()}
        onCheck={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    const panel = screen.getByRole("region", { name: "Fresh transfer case" });
    expect(
      within(panel).getByText("Identifies fire severity as a common cause"),
    ).toBeVisible();
    expect(within(panel).getByText("Needs more evidence")).toBeVisible();
  });
});
