import type { CoachDiagnosis, DomainId } from "./contracts";
import { DomainIdSchema } from "./contracts";
import type { ScenarioEvaluation } from "./scenario-evaluator";
import type { ScenarioId } from "./scenario-ids";
import { getScenario } from "./scenarios";

export type CoachSessionStatus =
  | "composing"
  | "diagnosing"
  | "diagnosed"
  | "revising"
  | "reviewing"
  | "reviewed"
  | "transferring"
  | "complete";

export type CoachSessionState = Readonly<{
  status: CoachSessionStatus;
  mode: "demo" | "live";
  domain: DomainId;
  scenarioId: ScenarioId | null;
  assignment: string;
  constraints: string;
  attempt: string;
  diagnosis: CoachDiagnosis | null;
  revealedHints: number;
  revision: string;
  review: ScenarioEvaluation | Readonly<{ status: string }> | null;
  transferResponse: string;
  transfer: ScenarioEvaluation | Readonly<{ status: string }> | null;
  notice: string | null;
}>;

type DraftField = "domain" | "assignment" | "constraints" | "attempt";

export type CoachSessionAction =
  | Readonly<{ type: "scenario.loaded"; scenarioId: ScenarioId }>
  | Readonly<{ type: "draft.changed"; field: DraftField; value: string }>
  | Readonly<{ type: "diagnosis.started" }>
  | Readonly<{ type: "diagnosis.received"; diagnosis: CoachDiagnosis }>
  | Readonly<{ type: "diagnosis.failed" }>
  | Readonly<{ type: "hint.revealed" }>
  | Readonly<{ type: "revision.started" }>
  | Readonly<{ type: "revision.changed"; value: string }>
  | Readonly<{ type: "review.started" }>
  | Readonly<{ type: "review.failed" }>
  | Readonly<{
      type: "review.received";
      review: ScenarioEvaluation | Readonly<{ status: string }>;
    }>
  | Readonly<{ type: "transfer.started" }>
  | Readonly<{ type: "transfer.failed" }>
  | Readonly<{ type: "transfer.changed"; value: string }>
  | Readonly<{
      type: "transfer.received";
      transfer: ScenarioEvaluation | Readonly<{ status: string }>;
    }>
  | Readonly<{ type: "session.reset" }>;

export const createInitialSession = (): CoachSessionState => ({
  status: "composing",
  mode: "demo",
  domain: "formal-logic",
  scenarioId: null,
  assignment: "",
  constraints: "",
  attempt: "",
  diagnosis: null,
  revealedHints: 0,
  revision: "",
  review: null,
  transferResponse: "",
  transfer: null,
  notice: null,
});

const clearCoaching = (
  state: CoachSessionState,
  patch: Partial<CoachSessionState>,
): CoachSessionState => {
  const hadCoaching =
    state.diagnosis !== null ||
    state.review !== null ||
    state.transfer !== null ||
    state.revision.length > 0 ||
    state.transferResponse.length > 0;
  return {
    ...state,
    ...patch,
    status: "composing",
    diagnosis: null,
    revealedHints: 0,
    revision: "",
    review: null,
    transferResponse: "",
    transfer: null,
    notice: hadCoaching
      ? "This draft changed, so the previous coaching was cleared."
      : null,
  };
};

export const reduceCoachSession = (
  state: CoachSessionState,
  action: CoachSessionAction,
): CoachSessionState => {
  switch (action.type) {
    case "scenario.loaded": {
      const scenario = getScenario(action.scenarioId);
      return {
        ...createInitialSession(),
        mode: "demo",
        domain: scenario.domain,
        scenarioId: scenario.id,
        assignment: scenario.assignment,
        constraints: scenario.constraints,
        attempt: scenario.attempt,
      };
    }
    case "draft.changed": {
      if (action.field === "domain") {
        const domain = DomainIdSchema.parse(action.value);
        return clearCoaching(state, {
          domain,
          mode: "live",
          scenarioId: null,
        });
      }
      return clearCoaching(state, {
        [action.field]: action.value,
        mode: "live",
        scenarioId: null,
      });
    }
    case "diagnosis.started":
      return { ...state, status: "diagnosing", notice: null };
    case "diagnosis.received":
      return {
        ...state,
        status: "diagnosed",
        diagnosis: action.diagnosis,
        revealedHints: 0,
        revision: "",
        review: null,
        transferResponse: "",
        transfer: null,
        notice: null,
      };
    case "diagnosis.failed":
      return { ...state, status: "composing" };
    case "hint.revealed":
      return {
        ...state,
        revealedHints: Math.min(
          state.revealedHints + 1,
          state.diagnosis?.hints.length ?? 0,
        ),
      };
    case "revision.started":
      return {
        ...state,
        status: "revising",
        revision: state.revision || state.attempt,
        review: null,
        transferResponse: "",
        transfer: null,
      };
    case "revision.changed":
      return {
        ...state,
        status: "revising",
        revision: action.value,
        review: null,
        transferResponse: "",
        transfer: null,
      };
    case "review.started":
      return { ...state, status: "reviewing", notice: null };
    case "review.failed":
      return { ...state, status: "revising" };
    case "review.received":
      return {
        ...state,
        status: "reviewed",
        review: action.review,
        transferResponse: "",
        transfer: null,
      };
    case "transfer.started":
      return {
        ...state,
        status: "transferring",
        transferResponse: "",
        transfer: null,
        notice: null,
      };
    case "transfer.failed":
      return { ...state, status: "transferring" };
    case "transfer.changed":
      return {
        ...state,
        status: "transferring",
        transferResponse: action.value,
        transfer: null,
      };
    case "transfer.received":
      return { ...state, status: "complete", transfer: action.transfer };
    case "session.reset":
      return createInitialSession();
  }
};
