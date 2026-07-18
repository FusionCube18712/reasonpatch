# ReasonPatch architecture

## Product invariant

ReasonPatch may challenge a learner's reasoning and describe observable revision evidence. It must not supply the replacement response, present a grade, or claim mastery, authorship, or proof of learning.

## Request flow

### Analysis

1. The API boundary accepts only same-origin `application/json` bodies no larger than 16 KB.
2. Zod validates the activity, a 24–3,000 character response, mode, and fallback policy.
3. In guided mode, the server requires the exact curated sample and returns a labeled fixture replay.
4. In live mode, the server gate must be enabled before an OpenAI client is created.
5. Sol returns a plan with exactly three unique jobs and a verbatim hinge quote.
6. Luna executes counterexample, assumption, and rubric jobs concurrently.
7. A wrong role, unsupported evidence quote, timeout, quota error, or invalid output causes only that probe to rerun on Sol.
8. Sol synthesizes exactly one Socratic question. The hinge quote is revalidated against learner text.

### Receipt

1. The learner must submit a different revision of at least 36 characters.
2. Guided mode evaluates visible, deterministic evidence patterns and never marks absent evidence as met.
3. Live Sol returns a structured receipt draft with verbatim evidence excerpts.
4. The server verifies each excerpt against the revision.
5. The server overwrites model-authored activity and provenance with canonical request values.
6. The final schema rejects claims of mastery, authorship, or proof of learning.

## Model calls

| Task | Model | Reasoning | Output budget |
|---|---|---:|---:|
| Plan and hinge | `gpt-5.6-sol` | medium | 1,000 |
| Three probes | `gpt-5.6-luna` | low | 800 each |
| Probe fallback | `gpt-5.6-sol` | medium | 800 |
| Synthesis | `gpt-5.6-sol` | medium | 1,300 |
| Repair receipt | `gpt-5.6-sol` | medium | 1,300 |

All calls use Responses Structured Outputs, `store: false`, a 12-second SDK timeout, and zero automatic SDK retries. The probe stage uses `Promise.all`, so normal Luna execution is concurrent.

## Trust boundaries

- `public-activities.ts` is safe to ship to browsers.
- `activities.ts` contains instructor intent and is imported only from server execution paths.
- The OpenAI API key and live-mode gate are server-only.
- Learner text is untrusted data in the user message payload; models have no tools.
- Model output is untrusted until schema, role, evidence, and provenance checks pass.

## Failure behavior

- Luna quota/timeout/invalid output: retry that role once on Sol and disclose fallback.
- Sol plan/synthesis invalid evidence: fail closed with a generic retryable API response.
- Missing key or disabled live gate: fail closed; guided mode remains available.
- Model-authored provenance mismatch: replace with canonical server provenance.
- API abuse: reject cross-site/media/body violations, then apply per-identity and global in-process limits.

## Production hardening beyond the hackathon demo

Before enabling paid live mode on a multi-instance public deployment:

- require a signed, short-lived anonymous session or evaluator access token;
- use an atomic TTL-backed distributed rate limiter;
- add a global spend and concurrency breaker outside the app instance;
- configure platform body limits and WAF rules;
- complete institutional privacy and accessibility review;
- replace inline CSP allowances with framework-supported nonces when practical.
