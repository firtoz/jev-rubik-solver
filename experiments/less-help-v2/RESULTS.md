# Less-help v2: readable current geometry

| Split | Teaching | Location | Intention | Action | Both |
|---|---|---:|---:|---:|---:|
| development | explicit | 20/20 | 16/20 | 10/20 | 10/20 |
| development | relational | 20/20 | 15/20 | 12/20 | 9/20 |
| development | minimal | 20/20 | 16/20 | 10/20 | 7/20 |
| validation | explicit | 20/20 | 16/20 | 10/20 | 10/20 |
| validation | relational | 20/20 | 15/20 | 7/20 | 7/20 |

200 calls, no retries; 0 errors. Cost $0.00807744; project commitment $5.61793945.

## Findings

All 100 case/variant evaluations correctly report current layer, which is supplied explicitly by code. This verifies reading that observation, not discovering layer from raw stickers. Relational teaching wins reduced-help development and is frozen for validation. Neither baseline nor reduced-help variant reaches acceptable complete-decision reliability. Scores do not support replacing production.

In development-3, blue faces back at UB and matches the blue back center; red faces up. Explicit chooses align then U-prime instead of the accepted middle-left@B insertion. In development-4, it correctly chooses alignment but uses U-prime when U is needed. Reading location successfully does not establish correct recognition of the relevant color relationship or rotation direction. We cannot infer internal reasoning from these outputs.

## Boundaries and limitations

All 40 actual observation inputs are distinct across splits. Quotas per split: 2 solved, 2 flipped, 4 trapped, 8 align, 4 insert. Current target is supplied and action menu contains learned insertions at four fronts, U turns and leave. Code supplies readable present geometry and adjacent center colors, but not solved/aligned predicates. Two dependent calls; location is an independent diagnostic question batched with intention, not consumed by the action call. Full cube state and expected answers remain offline. Acceptance tests compare applied action effects offline and never repair model choices.

The arms share richer observations. Comparison against v1 is not causal: wording and observations changed together and the family proportions differ. The current-layer answer is a readback, not a demonstration of spatial reasoning. Small component suites do not establish full-solve reliability. All offered algorithms preserve the bottom layer by construction, so preservation alone cannot establish model competence.

## Next distinguishing experiment

Keep readable geometry. Separate the relevant side-sticker comparison from intention, and test setup direction separately with a generic U rotation reference. Compare an isolated learned-routine decision with the same decision inside the chain. If isolated components pass but the chain fails, investigate composition; if they fail in isolation, richer strategic wording is unlikely to fix them. This is proposed, not run. Production solver unchanged.

Exact exchanges: [results.json](results.json). Frozen requests, fixtures, runner and protocol in this folder.
