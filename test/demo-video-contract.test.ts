import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const recorderSource = readFileSync(
  resolve(process.cwd(), "scripts/record-demo.mjs"),
  "utf8",
);
const orchestratorSource = readFileSync(
  resolve(process.cwd(), "src/features/repair/orchestrator.ts"),
  "utf8",
);

describe("submission video recorder", () => {
  it("renders technical proof from local project evidence instead of a remote branded page", () => {
    expect(recorderSource).toContain("showTechnicalProofSlide");
    expect(recorderSource).toContain("src/features/repair/orchestrator.ts");
    expect(recorderSource).toContain("Sol → Luna ×3 → Sol");
    expect(recorderSource).toContain("requireSourceLine");
    expect(recorderSource).not.toContain("orchestratorLines");
    expect(recorderSource).not.toContain("https://github.com/");

    for (const token of [
      'model: "gpt-5.6-sol"',
      'generateProbe(role, "gpt-5.6-luna", input)',
      "Promise.all",
      "classifyFailure(error)",
      "schema: AnalysisPlanSchema",
      "assertEvidenceOccursIn(",
      'task: "synthesize"',
    ]) {
      expect(orchestratorSource).toContain(token);
      expect(recorderSource).toContain(token);
    }
  });

  it("shows Codex collaboration as a stable local build trace", () => {
    expect(recorderSource).toContain("Codex build trace");
    expect(recorderSource).toContain("RED → GREEN → adversarial review");
    expect(recorderSource).toContain("125 automated tests");
  });
});
