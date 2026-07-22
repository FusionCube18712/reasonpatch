const ProhibitedEvidenceVerdict =
  /(?:\b(?:master(?:y|ed)?|grade(?:d)?|proof\s+of\s+learning|authorship|learner[- ]authored)\b|\b(?:correct|accurate)\s+(?:answer|solution|work)\b|\b(?:answer|solution|work)\s+(?:is|was)\s+(?:fully\s+)?(?:correct|accurate)\b|\b(?:proven\s+understanding|confirm(?:s|ed)?[^.!?\n]{0,45}\baccuracy)\b|\b(?:prove[ds]?|demonstrate[ds]?|show[ns]?)\s+(?:that\s+)?(?:the\s+)?learner[^.!?\n]{0,45}\b(?:understands?|understanding|learned)\b)/iu;

export const containsProhibitedEvidenceVerdict = (value: unknown): boolean =>
  ProhibitedEvidenceVerdict.test(JSON.stringify(value));
