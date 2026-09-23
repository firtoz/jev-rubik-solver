# Less-help middle-edge screening

| Split | Teaching | Intention | Action | Both | Input tokens | Cost | Median call ms |
|---|---|---:|---:|---:|---:|---:|---:|
| development | explicit | 12/20 | 12/20 | 11/20 | 36300 | $0.001525 | 421 |
| development | relational | 6/20 | 9/20 | 6/20 | 31420 | $0.001320 | 420 |
| development | minimal | 10/20 | 11/20 | 9/20 | 27980 | $0.001175 | 424 |
| validation | explicit | 11/20 | 11/20 | 9/20 | 36300 | $0.001525 | 395 |
| validation | minimal | 7/20 | 10/20 | 7/20 | 27980 | $0.001175 | 402 |

200 live calls, no retries or provider errors. Total $0.00671916. All actions preserve the bottom layer because the menu consists of routines that do so; preservation alone is not evidence of correct selection. No full solves were attempted.

## Interpretation

Reduced-help variants recognize many trapped/flipped middle edges, but fail upper-edge alignment/insertion and often disturb already solved targets. The matched explicit baseline also fails, so this study does not isolate the cost of removing rules from the proven pipeline. It also removes computed solved/layer/alignment fields and combines reference and action choice, unlike production. In development-1, the blue-red edge is at UR, blue faces R and red faces U. The explicit arm chooses extract and middle-right@R; the acceptable immediate action is U-prime alignment. Calling the target a middle edge may be confused with current location. This is a hypothesis, not a demonstrated cause.

## Limits and next experiment

Forty cube states are distinct, but the compact target-only observation collapses them to 14 development and 17 validation inputs, with 7 overlapping between splits. Treat this as screening, not independent held-out evidence. Fix future fixture uniqueness at the actual request boundary, balance reference directions, and use contrasting current locations. Keep reliable location words (upper/front/right) in observations while avoiding tactical verdicts. Compare relational teaching to explicit rules with otherwise matched inputs; first test current-location recognition separately, then action choice. The minimal arm won development among reduced-help variants and was selected without tuning; both validation candidates remain inadequate. No production policy was changed.

Exact requests, responses, timings and accepted-answer sets: [results.json](results.json). Frozen builders, fixtures and protocol are in this directory. Scoring simulations run offline only.
