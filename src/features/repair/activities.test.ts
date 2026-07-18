import { describe, expect, it } from "vitest";

import { getActivity, listActivities } from "./activities";
import { getPublicActivity, listPublicActivities } from "./public-activities";

describe("curated activities", () => {
  it("offers three focused introductory-statistics misconceptions", () => {
    expect(listActivities().map((activity) => activity.id)).toEqual([
      "correlation-causation",
      "base-rate-neglect",
      "sampling-bias",
    ]);
  });

  it("keeps the rubric visible while the answer key stays server-side", () => {
    const activity = getActivity("correlation-causation");

    expect(activity.public.rubric).toHaveLength(3);
    expect(activity.private.instructorIntent).toContain("causation");
    expect(JSON.stringify(activity.public)).not.toContain("instructorIntent");
    expect(JSON.stringify(listPublicActivities())).not.toMatch(
      /instructorIntent|answerBoundary|expectedMisconception/,
    );
    expect(getPublicActivity("correlation-causation").rubric).toHaveLength(3);
  });

  it("rejects unknown activity identifiers", () => {
    expect(() => getActivity("invented-activity")).toThrow("Unknown activity");
  });
});
