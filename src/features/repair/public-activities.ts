import type { ActivityId } from "./contracts";

export type PublicActivity = Readonly<{
  id: ActivityId;
  title: string;
  eyebrow: string;
  prompt: string;
  transferPrompt: string;
  sampleResponse: string;
  rubric: ReadonlyArray<Readonly<{ id: string; label: string }>>;
}>;

const PUBLIC_ACTIVITIES: ReadonlyArray<PublicActivity> = [
  {
    id: "correlation-causation",
    title: "Causation or coincidence?",
    eyebrow: "Intro statistics · causal inference",
    prompt:
      "A school says its tutoring program caused scores to rise because participants averaged eight points higher than non-participants. Evaluate the claim.",
    transferPrompt:
      "Patients who voluntarily joined a hospital nutrition program recovered two days faster than patients who did not. A reporter says the program caused faster recovery. Evaluate the claim. Explain your reasoning.",
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
  {
    id: "base-rate-neglect",
    title: "Accurate test, wrong conclusion",
    eyebrow: "Intro statistics · conditional probability",
    prompt:
      "A rare condition affects 1 in 1,000 people. A test detects it 99% of the time and has a 1% false-positive rate. Explain what a positive result means.",
    transferPrompt:
      "A second rare condition affects 1 in 2,000 people. A screening test detects it 98% of the time and has a 2% false-positive rate. A positive result is declared 98% likely to indicate the condition. Evaluate that conclusion. Explain your reasoning.",
    sampleResponse:
      "The test is 99% accurate, so a person who tests positive has a 99% chance of having the condition.",
    rubric: [
      { id: "association-causation", label: "Uses the population base rate" },
      { id: "confounder", label: "Counts true and false positives" },
      {
        id: "additional-evidence",
        label: "States the correct conditional comparison",
      },
    ],
  },
  {
    id: "sampling-bias",
    title: "Who answered the survey?",
    eyebrow: "Intro statistics · sampling",
    prompt:
      "A campus newspaper posts an online poll and reports that 82% of students want all lectures recorded. Evaluate the conclusion.",
    transferPrompt:
      "A university dining service posts a QR-code poll inside dining halls and reports that 76% of students want later hours. Evaluate whether the poll supports a claim about all students. Explain your reasoning.",
    sampleResponse:
      "Because hundreds of students answered, the poll proves most students want every lecture recorded.",
    rubric: [
      { id: "association-causation", label: "Identifies the target population" },
      { id: "confounder", label: "Explains voluntary-response bias" },
      {
        id: "additional-evidence",
        label: "Proposes a more representative sample",
      },
    ],
  },
] as const;

const clonePublicActivity = (activity: PublicActivity): PublicActivity => ({
  ...activity,
  rubric: activity.rubric.map((criterion) => ({ ...criterion })),
});

export const listPublicActivities = (): ReadonlyArray<PublicActivity> =>
  PUBLIC_ACTIVITIES.map(clonePublicActivity);

export const getPublicActivity = (id: string): PublicActivity => {
  const activity = PUBLIC_ACTIVITIES.find((candidate) => candidate.id === id);
  if (!activity) throw new Error(`Unknown activity: ${id}`);
  return clonePublicActivity(activity);
};
