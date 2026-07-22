import { describe, expect, it, vi } from "vitest";

import type { ModelCall, ModelGateway } from "@/lib/ai/model-gateway";
import { getScenario } from "./scenarios";
import {
  reviewCustomRevision,
  reviewGuidedRevision,
} from "./review-service";

const guidedRevisions = {
  "logic-negation-introduction": `1. ¬p                 Premise
2. | p ∧ q            Assumption
3. | p                ∧E 2
4. | ⊥                ¬E 1,3
5. ¬(p ∧ q)          ¬I 2-4`,
  "algebra-square-branches": `1. x² = 9
2. x² - 9 = 0
3. (x - 3)(x + 3) = 0
4. x = 3 or x = -3 by the zero-product property`,
  "python-empty-aggregate": `def average(nums):
    if not nums:
        raise ValueError("average requires at least one value")
    return sum(nums) / len(nums)`,
  "causal-observational-claim":
    "The observational association does not establish causation. Students choosing flashcards may also study longer. A randomized controlled study would provide stronger causal evidence.",
} as const;

const customSource = {
  kind: "custom" as const,
  domain: "python" as const,
  assignment:
    "Review this Python function for correctness on every list input.",
  attempt: `def average(nums):
    return sum(nums) / len(nums)`,
  constraints:
    "Keep behavior for non-empty numeric lists and choose an empty-input policy.",
};

const customRevision = `def average(nums):
    if not nums:
        raise ValueError("average requires at least one value")
    return sum(nums) / len(nums)`;

const modelReview = {
  status: "evidence-observed" as const,
  summary: "The revision adds an explicit empty-input policy.",
  changes: [
    {
      label: "Empty-input behavior",
      before: "return sum(nums) / len(nums)",
      after: 'raise ValueError("average requires at least one value")',
    },
  ],
  criteria: [
    {
      id: "empty-input-policy",
      label: "Defines behavior for empty input",
      state: "met" as const,
      evidence: 'raise ValueError("average requires at least one value")',
    },
    {
      id: "preserved-calculation",
      label: "Preserves the non-empty calculation",
      state: "met" as const,
      evidence: "return sum(nums) / len(nums)",
    },
  ],
  remainingCaveat: "Element-type validation remains outside this review.",
  source: {
    kind: "guided",
    scenarioId: "logic-negation-introduction",
  },
  provenance: {
    mode: "demo",
    source: "guided-fixture",
  },
};

const customRequest = {
  source: customSource,
  diagnosis: {
    hingeQuote: "return sum(nums) / len(nums)",
    issueTitle: "Empty input reaches division by zero",
    criteria: [
      { id: "empty-input-policy", label: "Defines behavior for empty input" },
      {
        id: "preserved-calculation",
        label: "Preserves the non-empty calculation",
      },
    ],
  },
  revision: customRevision,
  mode: "live" as const,
};

describe("guided revision review", () => {
  it.each(Object.entries(guidedRevisions))(
    "builds an evidence-bound receipt from the deterministic %s evaluator",
    (scenarioId, revision) => {
      const scenario = getScenario(scenarioId);
      const result = reviewGuidedRevision({
        source: {
          kind: "guided",
          scenarioId,
          attempt: scenario.attempt,
        },
        revision,
        mode: "demo",
      });

      expect(result.status).toBe("evidence-observed");
      expect(result.receipt.source).toEqual({ kind: "guided", scenarioId });
      expect(result.receipt.criteria.map(({ id }) => id)).toEqual(
        scenario.criteria.map(({ id }) => id),
      );
      expect(
        result.receipt.criteria.every(
          ({ state, evidence }) =>
            state === "met" && evidence !== null && revision.includes(evidence),
        ),
      ).toBe(true);
      expect(result.receipt.provenance).toEqual({
        mode: "demo",
        source: "deterministic-verifier",
        scope: "guided-scenario-only",
        scenarioId,
      });
      expect(JSON.stringify(result)).not.toMatch(
        /master(?:y|ed)|grade(?:d)?|authorship|proof of learning/iu,
      );
    },
  );
});

describe("custom live revision review", () => {
  it("uses Sol structured review and stamps canonical source and provenance", async () => {
    const generate = vi.fn().mockResolvedValue(modelReview);
    const gateway: ModelGateway = { generate };

    const result = await reviewCustomRevision({
      gateway,
      request: customRequest,
    });

    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-5.6-sol",
        task: "coach:review",
        input: expect.objectContaining({
          originalAttempt: customSource.attempt,
          revision: customRevision,
        }),
      }),
    );
    expect(result.source).toEqual({
      kind: "custom",
      domain: "python",
      assignment: customSource.assignment,
      constraints: customSource.constraints,
    });
    expect(result.provenance).toEqual({
      mode: "live",
      source: "gpt-5.6-sol",
    });
    for (const change of result.changes) {
      if (change.before !== null) {
        expect(customSource.attempt).toContain(change.before);
      }
      expect(customRevision).toContain(change.after);
    }
    for (const criterion of result.criteria) {
      if (criterion.evidence !== null) {
        expect(customRevision).toContain(criterion.evidence);
      }
    }
    expect(JSON.stringify(result)).not.toMatch(
      /master(?:y|ed)|grade(?:d)?|authorship|proof of learning/iu,
    );
  });

  it("rejects model-authored excerpts that are absent from submitted text", async () => {
    const gateway: ModelGateway = {
      generate: vi.fn().mockResolvedValue({
        ...modelReview,
        changes: [
          {
            ...modelReview.changes[0],
            after: "an invented revision quotation",
          },
        ],
      }),
    };

    await expect(
      reviewCustomRevision({ gateway, request: customRequest }),
    ).rejects.toThrow();
  });

  it("rejects duplicate model criteria instead of silently canonicalizing them", async () => {
    const gateway: ModelGateway = {
      generate: vi.fn().mockResolvedValue({
        ...modelReview,
        criteria: [
          modelReview.criteria[0],
          modelReview.criteria[0],
          modelReview.criteria[1],
        ],
      }),
    };

    await expect(
      reviewCustomRevision({ gateway, request: customRequest }),
    ).rejects.toThrow();
  });

  it("rejects contradictory criterion state and evidence", async () => {
    const gateway: ModelGateway = {
      generate: vi.fn().mockResolvedValue({
        ...modelReview,
        criteria: [
          {
            ...modelReview.criteria[0],
            state: "missing",
          },
          modelReview.criteria[1],
        ],
      }),
    };

    await expect(
      reviewCustomRevision({ gateway, request: customRequest }),
    ).rejects.toThrow();
  });

  it("rejects an evidence-observed status unless every criterion is met", async () => {
    const gateway: ModelGateway = {
      generate: vi.fn().mockResolvedValue({
        ...modelReview,
        criteria: [
          {
            ...modelReview.criteria[0],
            state: "missing",
            evidence: null,
          },
          modelReview.criteria[1],
        ],
      }),
    };

    await expect(
      reviewCustomRevision({ gateway, request: customRequest }),
    ).rejects.toThrow();
  });

  it("rejects duplicate client diagnosis criterion identifiers", async () => {
    const generate = vi.fn().mockResolvedValue(modelReview);
    const gateway: ModelGateway = { generate };

    await expect(
      reviewCustomRevision({
        gateway,
        request: {
          ...customRequest,
          diagnosis: {
            ...customRequest.diagnosis,
            criteria: [
              customRequest.diagnosis.criteria[0],
              customRequest.diagnosis.criteria[0],
            ],
          },
        },
      }),
    ).rejects.toThrow();
    expect(generate).not.toHaveBeenCalled();
  });

  it.each([
    "mastered",
    "graded",
    "authorship",
    "proof of learning",
    "a correct answer",
    "proven understanding",
    "confirmed accuracy",
    "learner-authored work",
  ])(
    "rejects the unsafe model claim %s",
    async (claim) => {
      const gateway: ModelGateway = {
        generate: vi.fn().mockResolvedValue({
          ...modelReview,
          summary: `The learner has ${claim}.`,
        }),
      };

      await expect(
        reviewCustomRevision({ gateway, request: customRequest }),
      ).rejects.toThrow();
    },
  );

  it.each([
    "The revision is fully correct.",
    "The learner clearly understands the concept now.",
  ])("rejects the categorical review verdict %s", async (summary) => {
    const gateway: ModelGateway = {
      generate: vi.fn().mockResolvedValue({ ...modelReview, summary }),
    };

    await expect(
      reviewCustomRevision({ gateway, request: customRequest }),
    ).rejects.toThrow();
  });

  it.each([
    "This does not establish that the answer is correct.",
    "The evidence does not prove that the learner understands the topic.",
  ])("allows the negated review caveat %s", async (summary) => {
    const gateway: ModelGateway = {
      generate: vi.fn().mockResolvedValue({ ...modelReview, summary }),
    };

    await expect(
      reviewCustomRevision({ gateway, request: customRequest }),
    ).resolves.toEqual(expect.objectContaining({ summary }));
  });

  it("keeps learner content in model input rather than system instructions", async () => {
    const calls: ModelCall[] = [];
    const gateway: ModelGateway = {
      async generate(call) {
        calls.push(call);
        return modelReview;
      },
    };

    await reviewCustomRevision({ gateway, request: customRequest });

    expect(calls).toHaveLength(1);
    expect(calls[0]?.instructions).not.toContain(customSource.attempt);
    expect(calls[0]?.instructions).not.toContain(customRevision);
    expect(calls[0]?.input).toEqual(
      expect.objectContaining({
        originalAttempt: customSource.attempt,
        revision: customRevision,
      }),
    );
  });
});
