type Environment = Readonly<Record<string, string | undefined>>;

export const assertLiveModeEnabled = (
  environment: Environment = process.env,
): void => {
  if (environment.REASONPATCH_LIVE_MODE !== "true") {
    throw new Error("Live GPT mode is disabled on this deployment.");
  }
};
