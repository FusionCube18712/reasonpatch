import { describe, expect, it } from "vitest";

import type { CoachDiagnosis } from "./contracts";
import {
  createInitialSession,
  reduceCoachSession,
  type CoachSessionState,
} from "./session-reducer";

const diagnosis = {
  strengths: ["The attempt starts from the given premise."],
  hingeQuote: "4. ¬(p ∧ q)    ¬I 1, 3",
  issueTitle: "The contradiction step is missing",
  issueLocation: "The fourth line discharges the assumption too early.",
  explanation: "Negation introduction needs a contradiction in scope.",
  socraticQuestion:
    "What can you derive from p and ¬p before closing the subproof?",
  whyThisQuestion: "It targets the missing inference without completing it.",
  hints: [
    { level: "location", text: "Inspect the final transition." },
    { level: "concept", text: "Negation introduction closes a subproof." },
    { level: "strategy", text: "Look for what p and ¬p jointly imply." },
  ],
  criteria: [
    {
      id: "explicit-contradiction",
      label: "Derives an explicit contradiction",
      state: "missing",
      evidence: null,
    },
    {
      id: "negation-introduction",
      label: "Uses the full subproof",
      state: "missing",
      evidence: null,
    },
  ],
  limitation: "Formative review only; notation varies by course.",
} satisfies CoachDiagnosis;

const diagnosedState = (): CoachSessionState => {
  const initial = createInitialSession();
  const loaded = reduceCoachSession(initial, {
    type: "scenario.loaded",
    scenarioId: "logic-negation-introduction",
  });
  return reduceCoachSession(loaded, {
    type: "diagnosis.received",
    diagnosis,
  });
};

describe("coach session reducer", () => {
  it("does not announce stale coaching while the learner is composing the first draft", () => {
    const next = reduceCoachSession(createInitialSession(), {
      type: "draft.changed",
      field: "attempt",
      value: "My first unfinished attempt",
    });

    expect(next.notice).toBeNull();
  });

  it("loads a guided scenario without mutating the previous state", () => {
    const initial = createInitialSession();
    const snapshot = structuredClone(initial);

    const next = reduceCoachSession(initial, {
      type: "scenario.loaded",
      scenarioId: "python-empty-aggregate",
    });

    expect(initial).toEqual(snapshot);
    expect(next).not.toBe(initial);
    expect(next.mode).toBe("demo");
    expect(next.domain).toBe("python");
    expect(next.assignment).toMatch(/every list input/iu);
    expect(next.attempt).toContain("return sum(nums) / len(nums)");
    expect(next.status).toBe("composing");
  });

  it.each(["domain", "assignment", "constraints", "attempt"] as const)(
    "clears stale coaching when %s changes",
    (field) => {
      const state = {
        ...diagnosedState(),
        revealedHints: 2,
        revision: "learner revision",
        review: { status: "evidence-observed" },
        transferResponse: "fresh response",
        transfer: { status: "evidence-observed" },
      } as CoachSessionState;

      const next = reduceCoachSession(state, {
        type: "draft.changed",
        field,
        value: field === "domain" ? "algebra" : "changed value",
      });

      expect(next.status).toBe("composing");
      expect(next.diagnosis).toBeNull();
      expect(next.revealedHints).toBe(0);
      expect(next.revision).toBe("");
      expect(next.review).toBeNull();
      expect(next.transferResponse).toBe("");
      expect(next.transfer).toBeNull();
      expect(next.notice).toMatch(/previous coaching was cleared/iu);
    },
  );

  it("reveals hints in order and never exceeds the diagnosis", () => {
    const state = diagnosedState();

    const once = reduceCoachSession(state, { type: "hint.revealed" });
    const twice = reduceCoachSession(once, { type: "hint.revealed" });
    const thrice = reduceCoachSession(twice, { type: "hint.revealed" });
    const extra = reduceCoachSession(thrice, { type: "hint.revealed" });

    expect([once, twice, thrice, extra].map(({ revealedHints }) => revealedHints)).toEqual([
      1, 2, 3, 3,
    ]);
  });

  it("copies the learner attempt exactly when revision begins", () => {
    const state = diagnosedState();

    const next = reduceCoachSession(state, { type: "revision.started" });

    expect(next.status).toBe("revising");
    expect(next.revision).toBe(state.attempt);
  });

  it("does not overwrite an in-progress learner revision when revision begins again", () => {
    const state = {
      ...diagnosedState(),
      status: "revising" as const,
      revision: "My in-progress learner revision",
    };

    const next = reduceCoachSession(state, { type: "revision.started" });

    expect(next.revision).toBe("My in-progress learner revision");
  });

  it("clears review and transfer evidence when the learner edits a revision", () => {
    const state = {
      ...diagnosedState(),
      status: "reviewed" as const,
      revision: "first revision",
      review: { status: "evidence-observed" },
      transferResponse: "fresh response",
      transfer: { status: "evidence-observed" },
    } as CoachSessionState;

    const next = reduceCoachSession(state, {
      type: "revision.changed",
      value: "second revision",
    });

    expect(next.status).toBe("revising");
    expect(next.revision).toBe("second revision");
    expect(next.review).toBeNull();
    expect(next.transferResponse).toBe("");
    expect(next.transfer).toBeNull();
  });

  it("enters an isolated fresh-case state without copying prior text", () => {
    const state = {
      ...diagnosedState(),
      status: "reviewed" as const,
      revision: "learner revision",
      review: { status: "evidence-observed" },
    } as CoachSessionState;

    const next = reduceCoachSession(state, { type: "transfer.started" });

    expect(next.status).toBe("transferring");
    expect(next.transferResponse).toBe("");
    expect(next.transfer).toBeNull();
  });

  it("preserves learner writing when diagnosis fails", () => {
    const composing = reduceCoachSession(createInitialSession(), {
      type: "draft.changed",
      field: "attempt",
      value: "My unfinished reasoning",
    });
    const diagnosing = reduceCoachSession(composing, {
      type: "diagnosis.started",
    });

    const next = reduceCoachSession(diagnosing, { type: "diagnosis.failed" });

    expect(next.status).toBe("composing");
    expect(next.attempt).toBe("My unfinished reasoning");
  });

  it("returns to the editable revision when review fails", () => {
    const revising = reduceCoachSession(diagnosedState(), {
      type: "revision.started",
    });
    const reviewing = reduceCoachSession(revising, { type: "review.started" });

    const next = reduceCoachSession(reviewing, { type: "review.failed" });

    expect(next.status).toBe("revising");
    expect(next.revision).toBe(revising.revision);
  });

  it("preserves the isolated response when transfer checking fails", () => {
    const transferring = {
      ...diagnosedState(),
      status: "transferring" as const,
      transferResponse: "My fresh-case response",
    };

    const next = reduceCoachSession(transferring, { type: "transfer.failed" });

    expect(next.status).toBe("transferring");
    expect(next.transferResponse).toBe("My fresh-case response");
  });
});
