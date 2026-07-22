const ClaimPatterns: ReadonlyArray<RegExp> = [
  /\b(?:master(?:y|ed)?|grade(?:d)?|proof\s+of\s+learning|authorship|learner[- ]authored)\b/iu,
  /\b(?:correct|accurate)\s+(?:answer|solution|revision|work)\b/iu,
  /\b(?:answer|solution|revision|work)\s+(?:is|was|seems?|appears?)\s+(?:fully\s+)?(?:correct|accurate)\b/iu,
  /\b(?:confirm(?:s|ed)?[^.!?\n]{0,45}\baccuracy|proven\s+understanding)\b/iu,
  /\blearner[^.!?\n]{0,35}\b(?:clearly\s+)?(?:understands?|understood|learned)\b/iu,
  /\b(?:prove[ds]?|demonstrate[ds]?|show[ns]?)\s+(?:that\s+)?(?:the\s+)?learner[^.!?\n]{0,45}\b(?:understands?|understanding|learned)\b/iu,
];

const polarityScope = (text: string, matchIndex: number): string => {
  const prefix = text.slice(Math.max(0, matchIndex - 120), matchIndex);
  const boundaries = [".", "!", "?", ";", "\n", ", but ", " however ", " yet "];
  const lastBoundary = Math.max(
    ...boundaries.map((boundary) => prefix.toLocaleLowerCase("en-US").lastIndexOf(boundary)),
  );
  return prefix.slice(lastBoundary + 1);
};

const isNegated = (text: string, matchIndex: number): boolean => {
  const scope = polarityScope(text, matchIndex);
  if (/\bnot\s+only\b/iu.test(scope)) return false;
  return /\b(?:not|never|no|cannot|can't|doesn't|does\s+not|didn't|did\s+not|isn't|is\s+not|aren't|are\s+not|without)\b[^.!?;\n]{0,95}$/iu.test(
    scope,
  );
};

export const containsProhibitedEvidenceVerdict = (text: string): boolean =>
  ClaimPatterns.some((pattern) => {
    const matcher = new RegExp(pattern.source, `${pattern.flags}g`);
    for (const match of text.matchAll(matcher)) {
      if (!isNegated(text, match.index)) return true;
    }
    return false;
  });
