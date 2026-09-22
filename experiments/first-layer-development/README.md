# First-layer recognition tournament

Goal: recognize a completed bottom layer from six face grids and center colors, without code-supplied completion flags, counts, target hints or recommended goals. Expected answers are offline only. All approaches receive the same observations and definition.

Twenty legal, unique development states: ten complete; four uniform-bottom but side-misaligned; three near-complete; three scrambled. A complete bottom face is not sufficient. Fixtures use controlled algorithm-generated setups, not uniform random-state sampling. Category names and scramble histories never enter requests.

Round 1 compared direct recognition, five region checks plus conclusion in one request, and five region checks followed by a dependent conclusion request. Scores: 14/20, 12/20 and 20/20. The checklist and sequential versions each correctly answered 100/100 region questions, yet the same-call checklist conclusion failed eight complete cases. This is an observed inconsistency, not evidence of the model's hidden reasoning.

Round 2 took the top two families and tested each baseline plus counterexample-focused and scope-focused wording, with at most three workers. Sequential variants all scored 20/20. Direct variants scored 14/20, 10/20 and 19/20. No API retries or majority voting. Accuracy ranked first, false positives next, then request count and cost. The original sequential wording won; the explicit-scope direct version was retained as a cheaper comparator.

Both were frozen before fresh validation on twenty new legal states balanced 10/10. Both scored 20/20 with no errors or false positives. The direct comparator used 20 requests and the sequential winner used 40. This is small component-level evidence; the existing solving policy was not changed. Validation was not used to tune either prompt. A subsequent integration into goal selection still needs testing.

All attempted cases and native responses are preserved. Response errors would remain incorrect in the assigned denominator. The two-request approach passes JEV's own region answers unchanged; code neither corrects them nor computes the final conjunction.

Offline tests verify 54 stickers, nine of each color, legal move sequences, grid orientation against a known F turn, and agreement between the independent grid criterion and cubing.js piece predicates. The request builders receive only observations, never labels. Fixtures are distinct across development and validation, though geometric case families can recur.

Commands (live calls; shared $5 cap):

```
bun scripts/request-eval/first-layer.ts
bun scripts/request-eval/first-layer.ts --round=2 --variants=sequential,sequential:counterexample,sequential:scope,direct,direct:counterexample,direct:scope
bun scripts/request-eval/first-layer.ts --validation --variants=sequential,direct:scope
```

Started rounds refuse overwriting. Use a new version and fresh validation for further tuning. Exact source snapshots are saved in each round. Offline article export: `bun scripts/summarize-first-layer.ts`.
