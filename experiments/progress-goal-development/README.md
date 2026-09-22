# Progress recognition into goal selection

Model: jev-1.13.0. Source, fixtures and every native response are saved with each round. These are component probes, not solve attempts. No moves were executed and the running solver was not changed.

Twenty development states: five each needing cross work, first-layer corners, middle edges or last-layer work. The 20 fresh validation states exclude development state hashes but share controlled fixture families. There are no fully solved live cases. Last-layer is a handoff, not detailed last-layer goal selection. Daisy and cross both count as acceptable when cross work is needed. Expected labels are computed offline; requests contain no scramble, label or state-conditioned option filtering.

| Development variant | Goals correct | Progress flags correct | Calls |
| --- | --- | --- | --- |
| Direct | 8/20 | n/a | 20 |
| Four checkpoints then goal | 7/20 | 55/80 | 40 |
| Same with explicit scope | 7/20 | 52/80 | 40 |
| Direct with scope | 7/20 | n/a | 20 |
| Self-contained checkpoint definitions then goal | 14/20 | 74/80 | 40 |
| Regions, checkpoints, goal | 17/20 | 79/80 | 60 |

The original lower-two-layers question referred to a first-layer definition located in another independent question. This is a request context defect; the initial round is retained and not treated as a clean measure of model capability. The corrected variant includes all necessary conditions in that question.

Regional pipeline: one request with 19 independent region checks, a dependent request with four progress assessments, then a dependent goal request retaining the original grids. All intermediate answers are passed unchanged. Code does not compute their conjunction or select the goal.

Two development goals were wrong despite completely correct progress assessments. We isolated the handoff by reusing the actual cached regional assessments, including its one mistake. Three variants, 20 calls each: full grids plus assessments 18/20; assessments plus full reference 16/20; assessments plus compact reference 14/20. Baseline 17→18 reflects repeated-call variation. These are the same cases, not 60 new inputs. Files: ../progress-goal-handoff/.

We froze the original regional chain and direct baseline before fresh validation:

| Validation | Goals correct | Progress flags correct | Calls |
| --- | --- | --- | --- |
| Direct | 7/20 | n/a | 20 |
| Regional chain | 19/20 | 79/80 | 60 |

Validation-5: D row2 col1 is blue, D center yellow. The regional answer Dedges=yes is false. The subsequent cross=yes and first-layer goal propagate that error. All other regional validation goals passed. No provider failures, retries, voting or answer corrections. Failures remain in the denominator. Terminal decision reliability and autonomous solve reliability are unmeasured here.

A first validation fixture-generation attempt exhausted candidates before any dispatch due to correlated generator bits. The validation generator was corrected to use shifted PRNG bits; development source and fixtures remain unchanged. No validation response was used for tuning.

Total: **360 live calls, $0.01989288 estimated input-token cost**, shared project ledger. At most three workers; dependent calls are sequential. No further live calls after validation.

## Reproduction

Offline:

```sh
bun test tests/first-layer.test.ts tests/progress-goal.test.ts
bun scripts/summarize-progress-goal.ts
```

Historical live commands (charge the shared capped budget; existing started output paths are protected):

```sh
bun scripts/request-eval/progress-goal.ts
bun scripts/request-eval/progress-goal.ts --round=2 --variants=direct:scope,chain:selfcontained,regional
bun scripts/request-eval/goal-handoff.ts
bun scripts/request-eval/progress-goal.ts --validation --variants=direct,regional
```

The article summary is regenerated from recorded files. Conclusions: make each question self-contained; decompose visual recognition into scoped checks; distinguish recognition errors from downstream errors; measure context removal rather than assuming summaries suffice. Next experiment: small bounded integration using real model assessments, without replacing the frozen solver yet.
