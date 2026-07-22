import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HintLadder } from "./hint-ladder";

const hints = [
  { level: "location" as const, text: "Inspect the hinge." },
  { level: "concept" as const, text: "Recall the governing rule." },
  { level: "strategy" as const, text: "Try a smaller case." },
  { level: "analogy" as const, text: "Compare the parallel example." },
];

describe("HintLadder", () => {
  it("calls only the final unrevealed hint final", () => {
    const onReveal = vi.fn();
    const { rerender } = render(
      <HintLadder hints={hints} revealed={2} onReveal={onReveal} />,
    );

    expect(
      screen.getByRole("button", { name: "One more hint" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Show the final hint" }),
    ).not.toBeInTheDocument();

    rerender(<HintLadder hints={hints} revealed={3} onReveal={onReveal} />);

    expect(
      screen.getByRole("button", { name: "Show the final hint" }),
    ).toBeVisible();
  });
});
