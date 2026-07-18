import type { ActivityId } from "./contracts";
import {
  getPublicActivity,
  listPublicActivities,
  type PublicActivity,
} from "./public-activities";

type PrivateActivity = Readonly<{
  instructorIntent: string;
  expectedMisconception: string;
  answerBoundary: string;
}>;

type Activity = Readonly<{
  id: ActivityId;
  public: PublicActivity;
  private: PrivateActivity;
}>;

const PRIVATE_ACTIVITIES: Readonly<Record<ActivityId, PrivateActivity>> = {
  "correlation-causation": {
    instructorIntent:
      "The learner should distinguish association from causation, identify self-selection, and request stronger comparison evidence.",
    expectedMisconception: "association-as-causation",
    answerBoundary:
      "Do not write a replacement response. Ask one question that exposes the causal hinge.",
  },
  "base-rate-neglect": {
    instructorIntent:
      "The learner should include prevalence and compare true positives with false positives among all positive tests.",
    expectedMisconception: "base-rate-neglect",
    answerBoundary:
      "Do not calculate the final posterior. Ask the learner to imagine a concrete population of 100,000.",
  },
  "sampling-bias": {
    instructorIntent:
      "The learner should notice voluntary-response bias and separate sample size from representativeness.",
    expectedMisconception: "sample-size-erases-bias",
    answerBoundary:
      "Do not supply a full evaluation. Ask who was more likely to notice and answer the poll.",
  },
};

const clonePrivateActivity = (activity: PrivateActivity): PrivateActivity => ({
  ...activity,
});

export const listActivities = (): ReadonlyArray<Activity> =>
  listPublicActivities().map((publicActivity) => ({
    id: publicActivity.id,
    public: publicActivity,
    private: clonePrivateActivity(PRIVATE_ACTIVITIES[publicActivity.id]),
  }));

export const getActivity = (id: string): Activity => {
  const publicActivity = getPublicActivity(id);
  return {
    id: publicActivity.id,
    public: publicActivity,
    private: clonePrivateActivity(PRIVATE_ACTIVITIES[publicActivity.id]),
  };
};
