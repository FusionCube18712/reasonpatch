import type { z } from "zod";

import type { ActivityIdSchema } from "./contracts";

type ActivityId = z.infer<typeof ActivityIdSchema>;

type Activity = Readonly<{
  id: ActivityId;
  public: Readonly<{
    id: ActivityId;
    title: string;
    eyebrow: string;
    prompt: string;
    sampleResponse: string;
    rubric: ReadonlyArray<Readonly<{ id: string; label: string }>>;
  }>;
  private: Readonly<{
    instructorIntent: string;
    expectedMisconception: string;
    answerBoundary: string;
  }>;
}>;

const ACTIVITIES: ReadonlyArray<Activity> = [
  {
    id: "correlation-causation",
    public: {
      id: "correlation-causation",
      title: "Causation or coincidence?",
      eyebrow: "Intro statistics · causal inference",
      prompt:
        "A school says its tutoring program caused scores to rise because participants averaged eight points higher than non-participants. Evaluate the claim.",
      sampleResponse:
        "The tutoring program caused the improvement because participants scored eight points higher. Therefore every school should use it.",
      rubric: [
        {
          id: "association-causation",
          label: "Distinguishes association from causation",
        },
        {
          id: "confounder",
          label: "Names a plausible confounder or selection effect",
        },
        {
          id: "additional-evidence",
          label: "States what additional evidence is needed",
        },
      ],
    },
    private: {
      instructorIntent:
        "The learner should distinguish association from causation, identify self-selection, and request stronger comparison evidence.",
      expectedMisconception: "association-as-causation",
      answerBoundary:
        "Do not write a replacement response. Ask one question that exposes the causal hinge.",
    },
  },
  {
    id: "base-rate-neglect",
    public: {
      id: "base-rate-neglect",
      title: "Accurate test, wrong conclusion",
      eyebrow: "Intro statistics · conditional probability",
      prompt:
        "A rare condition affects 1 in 1,000 people. A test detects it 99% of the time and has a 1% false-positive rate. Explain what a positive result means.",
      sampleResponse:
        "The test is 99% accurate, so a person who tests positive has a 99% chance of having the condition.",
      rubric: [
        { id: "association-causation", label: "Uses the population base rate" },
        { id: "confounder", label: "Counts true and false positives" },
        { id: "additional-evidence", label: "States the correct conditional comparison" },
      ],
    },
    private: {
      instructorIntent:
        "The learner should include prevalence and compare true positives with false positives among all positive tests.",
      expectedMisconception: "base-rate-neglect",
      answerBoundary:
        "Do not calculate the final posterior. Ask the learner to imagine a concrete population of 100,000.",
    },
  },
  {
    id: "sampling-bias",
    public: {
      id: "sampling-bias",
      title: "Who answered the survey?",
      eyebrow: "Intro statistics · sampling",
      prompt:
        "A campus newspaper posts an online poll and reports that 82% of students want all lectures recorded. Evaluate the conclusion.",
      sampleResponse:
        "Because hundreds of students answered, the poll proves most students want every lecture recorded.",
      rubric: [
        { id: "association-causation", label: "Identifies the target population" },
        { id: "confounder", label: "Explains voluntary-response bias" },
        { id: "additional-evidence", label: "Proposes a more representative sample" },
      ],
    },
    private: {
      instructorIntent:
        "The learner should notice voluntary-response bias and separate sample size from representativeness.",
      expectedMisconception: "sample-size-erases-bias",
      answerBoundary:
        "Do not supply a full evaluation. Ask who was more likely to notice and answer the poll.",
    },
  },
] as const;

const cloneActivity = (activity: Activity): Activity => ({
  ...activity,
  public: {
    ...activity.public,
    rubric: activity.public.rubric.map((criterion) => ({ ...criterion })),
  },
  private: { ...activity.private },
});

export const listActivities = (): ReadonlyArray<Activity> =>
  ACTIVITIES.map(cloneActivity);

export const getActivity = (id: string): Activity => {
  const activity = ACTIVITIES.find((candidate) => candidate.id === id);
  if (!activity) throw new Error(`Unknown activity: ${id}`);
  return cloneActivity(activity);
};

