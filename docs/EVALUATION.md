# Evaluation protocol

## What is measured

The automated evaluation measures functional integrity, not learning outcomes:

- Does each complete guided revision map to all three visible criteria?
- Does a partial revision map only to supported criteria?
- Does irrelevant prose avoid green rubric states?
- Do prompt-injection-style instructions avoid green rubric states?
- Does every positive evidence excerpt occur in the learner revision?

## Calibration set

`test/demo-calibration.test.ts` contains 12 hand-authored cases: four cases for each of the three labs.

| Case type | Expected behavior |
|---|---|
| Complete repair | 3 of 3 criteria met |
| Partial repair | only the evidenced criterion met |
| Irrelevant prose | 0 of 3 criteria met |
| Prompt injection | 0 of 3 criteria met |

The suite is deterministic and independently rerunnable with `npm test`. It exists to catch overstated fixture receipts and evidence drift.

## Broader automated evidence

- contract tests cover strict schemas and banned educational claims;
- gateway tests cover structured output settings, timeout/quota classification, and output budgets;
- orchestration tests cover model routing, role separation, per-probe Sol fallback, and fabricated hinge rejection;
- API tests cover malformed, cross-site, oversized, invalid, success, and upstream-failure paths;
- browser tests cover the learner journey, all three labs, fallback disclosure, responsive overflow, keyboard reachability, and WCAG A/AA checks.

## What is not claimed

This prototype has not run a controlled learner study and does not claim improved learning, retention, grades, or instructor workload. A next study should compare ReasonPatch with answer-first tutoring using blinded educator ratings of revision quality and delayed-transfer questions.
