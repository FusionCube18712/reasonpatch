# Evaluation protocol

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

`test/transfer-calibration.test.ts` contains 12 additional cases: complete, partial, irrelevant, and evaluator-instruction responses with domain-keyword bait for each lab. The suite asserts the exact criterion IDs marked as met—not only a count—and verifies every positive excerpt against the submitted fresh-case text.

Together, the two calibration sets cover 24 responses and 72 visible rubric decisions. This demonstrates deterministic evaluator integrity on the curated domains; it does not demonstrate that learners retain or transfer knowledge.

## Broader automated evidence

- contract tests cover strict schemas and banned educational claims;
- gateway tests cover structured output settings, timeout/quota classification, and output budgets;
- orchestration tests cover model routing, role separation, per-probe Sol fallback, and fabricated hinge rejection;
- API tests cover malformed, cross-site, oversized, invalid, success, and upstream-failure paths;
- browser tests cover the learner journey, all three labs, fallback disclosure, the fresh-case Transfer Slip, a real local pilot-packet download, responsive overflow, keyboard reachability, and WCAG A/AA checks.

## What is not claimed

This prototype has not run a controlled learner study and does not claim improved learning, retention, grades, or instructor workload. The demo's fresh-context step is immediate and isolated as a separate response; it is not a delayed, blinded, or validated transfer measure.

The current local export is a coordinator audit manifest, not a score report or blinded rater packet. It contains raw submitted text, prompt and time-point labels, provenance, and automated evidence states, so a coordinator must de-identify it before approved sharing. A next study should compare ReasonPatch with answer-first tutoring using an isolated delayed isomorphic case and a separate rater packet that removes condition, time-point, product, model, and automated-score cues.

The public demo's small transfer-prompt pool is shipped in the client bundle and is not held out. A credible pilot would use access-controlled server delivery from a larger preregistered prompt pool and record assignments in the coordinator manifest. See the [full pilot protocol](PILOT_PROTOCOL.md).
