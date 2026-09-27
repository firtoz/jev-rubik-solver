# Minimum teaching study: two-round result

> Historical study note. Status, budgets and original commands describe this experiment at the time. See the [research index](README.md) for current code and available records.

The final candidate passed **39/40 fresh complete decisions** and **10/10 autonomous middle-layer runs**. Required gates were 36/40 and 9/10. Both sample gates passed.

| Development teaching | Round 1 | Round 2 |
|---|---:|---:|
| General effects |14/20|14/20|
| Contrasting examples |18/20|20/20|
| Applicability conditions |16/20|20/20|

Round 1 examples passed 38/40 held-out decisions but only 2/10 integrations. Round 2 used retired integration failures in development, narrowed intention observations and teaching, and removed repeated examples from routine selection. These simultaneous changes and different evaluation samples prevent causal attribution to one wording change. Round 2 fresh decision coverage: done 4, extract 6, align 24, insert 6. The lone decision failure selected insertion correctly but picked the wrong side at front B.

## Assistance supplied

Code supplies legal cube mechanics, positions, centers, current layer and solved flags for target selection. JEV chooses the target, compares colors, chooses the operation family, setup destination and turn, insertion front and routine. Its answers pass unchanged. Code routes on its selected family and executes a fixed routine. No runtime outcome simulation, applicability verdict, best-branch selection or tactical repair. The program checks termination and limits.

All arms receive expert-written generic routine effects and U cycles. The final candidate additionally receives four explicit case-to-intention examples (upper matched/unmatched; middle matched/unmatched). Those examples are compact applicability teaching, not evidence of independently discovering cube strategy. This study identifies a tested teaching tradeoff, not the globally least possible assistance.

## Autonomous results

| Start | Solved | Requests | Cycles | No-op actions | Revisited states | First incorrect decision |
|---|---|---:|---:|---:|---:|---|
|case-5|yes|20|4|0|0|none|
|case-6|yes|15|3|0|0|none|
|case-7|yes|20|4|0|0|none|
|case-8|yes|39|8|0|0|routine/frame at cycle 2|
|case-9|yes|10|2|0|0|none|
|case-10|yes|48|10|0|0|none|
|case-11|yes|20|4|0|0|none|
|case-12|yes|44|9|0|0|routine/frame at cycle 2|
|case-13|yes|24|5|0|0|none|
|case-14|yes|5|1|0|0|none|

Each attempt allows 160 requests, 200 face turns and 120 seconds, without retries or intervention. Every capped/failed attempt remains in the denominator. Complete cubes and observed scenes are fresh against retired fixture/reached states; finite local situations may repeat. Starts are legal routine-generated middle-layer cases with a solved bottom, not a random full-cube reliability sample.

## Cost and reproduction

Cumulative round 1+round 2 ledger: **2449 requests, $0.06523373** including retained reservations, within the $0.25 study cap. Global cap remains $9. No changes to the proven solver.

Policies and exact source snapshots: round 1 (archived: `experiments/teaching-study-v1/sources.json`), round 2 (archived: `experiments/teaching-study-v2/sources.json`). Protocols, fixtures, every request/native response and results live alongside them. Offline verification: `bun scripts/teaching-study/verify.ts` and `bun scripts/teaching-study-v2/verify.ts`. These reconstruct requests and chosen actions, replay cubing transformations and independently check raw middle/bottom piece predicates. `bun scripts/teaching-study-v2/report.ts` regenerates this report. Live runners use immutable started markers to prevent accidental repeat spending; do not delete them to reproduce runs.

## Article lessons and limits

- A model can score well on sampled one-step tasks and still repeatedly fail in autonomous execution. Test the states its own actions produce.
- Keep relevant observations local, and distinguish preparation from execution. The results support this as a useful design hypothesis, not an isolated causal finding.
- Examples encode expertise. Declare their content rather than claiming the model inferred all strategy from generic physics.
- A correct intention still needs a correct reference frame and routine. Measure the whole chain and retain recoverable mistakes as well as final failures.
- These middle-layer results do not replace the original full-cube evaluation or establish a general method for every complex problem.
