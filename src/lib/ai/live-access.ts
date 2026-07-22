type Environment = Readonly<Record<string, string | undefined>>;

export const assertLiveModeEnabled = (
  environment: Environment = process.env,
): void => {
  if (environment.REASONPATCH_LIVE_MODE !== "true") {
    throw new Error("Live GPT mode is disabled on this deployment.");
  }
};

const modeHeader = "x-reasonpatch-mode";

export const isLiveModeRequest = (request: Request): boolean =>
  request.headers.get(modeHeader) === "live";

export const hasMatchingDeclaredMode = (
  request: Request,
  validatedMode: "demo" | "live",
): boolean => {
  const declaredMode = request.headers.get(modeHeader);
  return declaredMode === validatedMode;
};
