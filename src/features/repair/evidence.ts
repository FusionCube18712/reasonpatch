import { ModelGatewayError } from "@/lib/ai/model-gateway";

const normalize = (value: string): string =>
  value
    .normalize("NFKC")
    .toLocaleLowerCase("en-US")
    .replace(/[“”"'‘’]/gu, "")
    .replace(/\s+/gu, " ")
    .trim();

export const evidenceOccursIn = (source: string, excerpt: string): boolean => {
  const normalizedSource = normalize(source);
  const normalizedExcerpt = normalize(excerpt);
  return normalizedExcerpt.length >= 3 && normalizedSource.includes(normalizedExcerpt);
};

export const assertEvidenceOccursIn = (
  source: string,
  excerpt: string,
  label: string,
): void => {
  if (!evidenceOccursIn(source, excerpt)) {
    throw new ModelGatewayError(
      `${label} was not found in the learner's text.`,
      "invalid_output",
    );
  }
};
