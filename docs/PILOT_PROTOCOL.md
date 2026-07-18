# Educator pilot protocol

## Status and boundary

This is a preregistration-ready **draft**, not a completed or validated study. ReasonPatch has not demonstrated improved learning, retention, grades, or instructor workload. The product currently demonstrates only that it can withhold an answer, elicit two learner-submitted attempts, and bind rubric states to excerpts that actually occur in those attempts.

The demo's fresh-context step happens immediately in the same session and is isolated as a separate response from the revision. It is not a delayed, blinded, or validated transfer measure.

The current local export creates two separate draft artifacts. The **blinded rater packet** uses anonymous IDs, non-chronological order, and blank rubrics while excluding product, condition, time-point, provenance, and automated-score cues. The **coordinator audit manifest** retains the private stage map, prompts, model or fixture provenance, and automated evidence states. Both contain submitted text and require coordinator de-identification before approved sharing.

## Research-grounded rationale

These sources motivate the interaction design; they do **not** establish efficacy for ReasonPatch:

- [Bisra et al., *Inducing Self-Explanation: A Meta-Analysis*](https://doi.org/10.1007/s10648-018-9434-x) synthesized 69 effect sizes from 64 reports and estimated a pooled self-explanation effect of `g = 0.55`. The reviewed prompts were generally researcher- or instructor-authored, so this result cannot be transferred directly to AI-generated prompts.
- [Sinha and Kapur, *When Problem Solving Followed by Instruction Works*](https://doi.org/10.3102/00346543211019105) analyzed 166 comparisons and found an advantage for problem solving before instruction on conceptual knowledge and transfer (`g = 0.36`, 95% CI `[0.20, 0.51]`), but not procedural knowledge. ReasonPatch borrows the attempt-before-assistance principle; it is not a complete productive-failure intervention.
- [Wisniewski, Zierer, and Hattie, *The Power of Feedback Revisited*](https://doi.org/10.3389/fpsyg.2019.03087) analyzed 435 studies and found a heterogeneous overall feedback effect (`d = 0.48` after extreme-value handling). Information content moderated effects, but some feedback effects were negative.
- [delMas et al., *Assessing Students' Conceptual Understanding After a First Course in Statistics*](https://iase-pub.org/ojs/SERJ/article/view/483) tested 1,470 students across 33 institutions and documented persistent conceptual errors, including causal interpretation, sampling, and conditional probability. It establishes a credible problem area, not ReasonPatch's effectiveness.
- The American Statistical Association's [GAISE College Report](https://www.amstat.org/asa/files/pdfs/gaise/gaisecollege_full.pdf) recommends emphasizing statistical thinking, conceptual understanding, active learning, and assessment that improves learning rather than computed answers alone.

## Pilot question

Compared with answer-first assistance, does a single ReasonPatch interaction produce stronger reasoning evidence on an isolated, delayed isomorphic case without increasing answer leakage?

## Proposed feasibility design

1. Recruit learners currently studying introductory statistics; obtain institutional review and consent appropriate to the setting.
2. Give every learner a baseline explanation task drawn from the same misconception family.
3. Randomize the assistance condition:
   - **ReasonPatch:** earliest-hinge question, learner revision, evidence-bound receipt;
   - **Answer-first comparison:** a concise worked explanation containing the target reasoning.
4. Collect the immediate revision in both conditions.
5. End the assistance interface, then collect an immediate fresh-context response in a separate step without access to the earlier feedback.
6. After 48–72 hours, administer the primary delayed isomorphic case without assistance or access to the earlier feedback.
7. De-identify responses and blind at least two educator raters to condition and time point.
8. Publish aggregate results, disagreement, exclusions, and the full scoring protocol—including null or negative findings.

## Separate coordinator and rater artifacts

The pilot should produce two distinct artifacts:

- **Coordinator audit manifest:** participant key, condition and time-point mapping, prompt assignment, raw submissions, model or fixture provenance, and automated evidence states. Keep this access-controlled. De-identify it before approved sharing, and never give it to blinded raters.
- **Blinded rater packet:** randomized participant ID, only the response text and scoring context required by the preregistered design, and a blank rubric. Remove ReasonPatch branding, condition and time-point labels, model provenance, and automated rubric states. Store the re-identification key separately from raters.

The current in-product export supplies both structures and keeps their contents separate. It does not by itself make the submitted text de-identified or turn the immediate demo case into a valid delayed transfer measure.

## Measures to preregister

**Primary feasibility measure**

- completion rate for the isolated delayed fresh case.

**Primary reasoning measure**

- blinded 0–2 rating for each visible reasoning criterion on the fresh case.

**Secondary measures**

- whether the earliest unsupported inference was repaired (`no / partial / yes`);
- answer leakage (`yes / no`), defined before data collection;
- change from baseline to revision and from baseline to fresh case;
- rater agreement and adjudication rate;
- response time, optional free-text learner friction, and educator review time.

The pilot should be described as feasibility evidence unless its sample size and analysis plan are powered for causal learning claims.

## Privacy and integrity

- Treat the local export as raw submitted text. Remove names, course identifiers, health details, and other sensitive information before approved sharing.
- Keep the coordinator audit manifest local and access-controlled; do not upload it without an approved data process.
- Give raters only the separately prepared blinded packet, never the coordinator manifest or its automated evidence states.
- Do not use the Transfer Slip as a grade, mastery label, authorship claim, or proof of learning.
- Preserve missing evidence as missing. Never infer a green state from fluency, length, or evaluator instructions.
- Lock the prompt assignments and rubric before data collection. Keep held-out prompts access-controlled until response collection is complete, then publish them with the scoring protocol before inspecting condition-level outcomes.

## Public prompt-pool limitation

The guided demo uses a small fresh-case prompt pool that is shipped in the public client bundle. Anyone can inspect those prompts, so the demo cannot establish performance on secret or held-out items. A pilot should draw from a larger preregistered pool delivered by an access-controlled server, record assignments in the coordinator manifest, and prevent repeat exposure before the delayed measure.

## Current automated evidence

The deterministic suite currently covers 12 repair cases and 67 fresh-transfer cases across complete, partial, stale-context, evaluator-instruction, contradiction, relation-smuggling, local-negation, direct/embedded interrogative, duplicate-grounding, rejected-claim, fact-correction, and valid-phrasing variants. It checks exact rubric states and verifies that every positive excerpt occurs in submitted text. This is functional calibration—not a learner study.
