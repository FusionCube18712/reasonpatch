# Evaluation protocol

> **Archived v1 public-build artifact.** The calibration counts and three-lab paths below belong to the frozen submitted build. The local-only v2 uses four office-hours domains and the suites under `src/features/coach`, `src/components`, and `e2e`; see the repository [README](../README.md). No v1 result is presented as v2 validation.

## What is measured

The automated evaluation measures functional integrity, not learning outcomes:

- Does each complete guided revision map to all three visible criteria?
- Does a partial revision map only to supported criteria?
- Does irrelevant prose avoid green rubric states?
- Do prompt-injection-style instructions avoid green rubric states?
- Does every positive evidence excerpt occur in the learner revision?
- Does the same evaluator remain evidence-bound on an isomorphic fresh case?

## Repair calibration set

`test/demo-calibration.test.ts` contains 12 hand-authored cases: four cases for each of the three labs.

| Case type | Expected behavior |
|---|---|
| Complete repair | 3 of 3 criteria met |
| Partial repair | only the evidenced criterion met |
| Irrelevant prose | 0 of 3 criteria met |
| Prompt injection | 0 of 3 criteria met |

The suite is deterministic and independently rerunnable with `npm test`. It exists to catch overstated fixture receipts and evidence drift.

## Fresh-transfer calibration set

`test/transfer-calibration.test.ts` contains 67 additional cases: complete, partial, stale-context, evaluator-instruction, and explicit contradiction or negation responses—including copied original-context repairs, actor/action/object relation-smuggling, direct and local negation, direct/embedded interrogatives, duplicate-match grounding, and same/next-sentence rejection attacks; valid online-poll and dining-only wording; and correct, reversed, negated, quoted, questioned, and rejected base-rate statements. The suite asserts the exact criterion IDs marked as met—not only a count—and verifies every positive excerpt against the submitted fresh-case text.

Together, the two calibration sets cover 79 responses and 237 visible rubric decisions. This demonstrates deterministic evaluator integrity on the curated domains; it does not demonstrate that learners retain or transfer knowledge.

## Broader automated evidence

- contract tests cover strict schemas and banned educational claims;
- gateway tests cover structured output settings, timeout/quota classification, and output budgets;
- orchestration tests cover model routing, role separation, per-probe Sol fallback, and fabricated hinge rejection;
- API tests cover malformed, cross-site, oversized, invalid, success, and upstream-failure paths, including the separate demo-only transfer boundary;
- browser tests cover the learner journey, all three labs, fallback disclosure, the isolated fresh-case Transfer Slip, both real local artifact downloads, responsive overflow, keyboard reachability, and WCAG A/AA checks.

## What is not claimed

This prototype has not run a controlled learner study and does not claim improved learning, retention, grades, or instructor workload. The demo's fresh-context step is immediate and isolated as a separate response; it is not a delayed, blinded, or validated transfer measure.

The current local export separates a stripped, unscored rater packet from a coordinator audit manifest. The rater packet removes product, condition, time-point, model, provenance, and automated-score cues; the manifest retains the private mapping and full audit trail. Both contain submitted text, so a coordinator must de-identify them before approved sharing. A next study should combine those artifacts with an isolated delayed isomorphic case.

The public demo's small transfer-prompt pool is shipped in the client bundle and is not held out. A credible pilot would use access-controlled server delivery from a larger preregistered prompt pool and record assignments in the coordinator manifest. See the [full pilot protocol](PILOT_PROTOCOL.md).
