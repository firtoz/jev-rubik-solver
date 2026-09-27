# Incremental solver experiments

Completed: the selected candidate solved 98/100 fresh cubes within 100 turns, with two abstentions and no caps. Every trajectory passed full replay verification. The historical 97/100 incumbent remains intact. See [final results and tradeoffs](budget-round-results.md).

| Change | Evidence | Decision |
| --- | --- | --- |
| Group F2L recognition before routine selection | All41 canonical cases; two sets of8 paired complete stages;4 paired full solves, both4/4 with identical335 total turns | Retain as cost-saving candidate: full cost6.4% lower, requests3.1% higher, time2.4% longer |
| Rewrite daisy reference and situation definitions | Two bounded wording rounds; final48/48 finite-domain checks;8 paired cross stages, both8/8 with111 turns and440 requests | Reject promotion: no execution gain,4.7% higher cost |
| Protect landing space and consider preparation cost | Earlier component evidence, but prior full trajectories were inconclusive; new comparison completed8/8 with87 versus111 turns,421 versus440 requests and6.9% lower cost | Fresh stage validation also8/8:101 versus150 turns, with6.8%more requests and4.9%higher cost. Combined full comparison passed4/4 versus3/4; selected for final evaluation |

More explicit definitions are added teaching. Grouping narrows the reference menu using JEV's own answer. Neither method lets code select the live case, rank simulated outcomes, or repair an incorrect tactical answer.

The daisy repeatability check changed cube configurations without changing transmitted position/direction inputs. It covers repeated calls over a finite input domain, not generalisation to unseen inputs. Exact requests, native answers and independent move replays are retained in experiments/daisy-focus-v1, experiments/daisy-focus-v2 and experiments/f2l-recognition-v2.

Budget began at $8.787338406 project commitment and ended at $9.386859090. This round committed $0.599520684, including a retained $0.002688 uncertain reservation. Estimated provider credit is $0.885848362, not live verified; conservative usable allowance after the $0.10 buffer is $0.785848362. All attempts are terminal; no more paid calls are planned for this round.

The useful lesson so far is to evaluate the complete path from observation to execution. Cleaner labels can improve a question score without changing the actions, while one extra recognition call can reduce tokens yet increase latency.

The selected combination solved the four paired full starts in72,77,82 and75 turns. The incumbent capped at82 on the first, then solved the others in75 each. The candidate used526 versus546 requests and cost$0.015648696 versus$0.017958486. This small comparison supports advancement, not a population reliability claim. On jointly solved pairs the candidate used nine more turns, so the move advantage is not uniform.

The final sample was fixed at100 from the measured cost before outcomes. Forecast$0.3912174, hard study cap$0.50, two workers, no tuning or replacement cases. Source/fixture manifests and live records are in experiments/budget-round-v1/final-evaluation. Original97/100 evidence remains separate.
