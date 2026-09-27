# Grouped F2L recognition

> Historical study note. Status, budgets and original commands describe this experiment at the time. See the [research index](README.md) for current code and available records.

The incumbent selects among 41 fixed F2L reference cases in one request. The candidate asks JEV to recognise the corner pattern, then choose a routine from that model-selected reference family. Code does not recognise the live case or correct a wrong group. The routine library is unchanged.

All three development formulations passed 20/20 canonical cases. Grouping used 32,221 input tokens versus 65,160 for the incumbent, but doubled requests and increased mean decision time from 0.663s to 1.141s. The grouped version then passed 21/21 remaining canonical cases, including pair-41, which the incumbent had missed in a retired full recording. This is finite case coverage, not a fresh full-solve success claim.

Eight complete-stage comparisons started from identical recorded F2L-entry states and recent-action memory:

| Measure | Incumbent | Grouped |
| --- | --- | --- |
| Completed | 8/8 | 8/8 |
| Total face turns | 283 | 286 |
| Requests | 426 | 463 |
| Input tokens | 325,375 | 276,364 |
| Total execution seconds | 225.577 | 245.069 |
| Cost | $0.013665750 | $0.011607288 |
| Cross and initially solved pairs preserved | Yes | Yes |

Grouping passed the predefined 15% token-saving gate narrowly, at 15.063%, with 1.06% more turns and 8.64% more time. It remains a cost-saving candidate with a latency tradeoff. No policy promotion yet. Fresh stage validation also passed: 8/8 each, 155 versus 146 turns, 182,753 versus 144,982 input tokens (20.7% saving), and 131.674 versus 134.045 total seconds. Four fresh paired full solves are next; the candidate changes only F2L routine selection. It is not yet promoted.

Records: experiments/f2l-recognition-v2. Verification: bun scripts/f2l-recognition-v2/verify.ts and bun scripts/f2l-recognition-v2/verify-stage.ts. All 16 recorded chains replayed against native model responses and cube mechanics. Two adapter tests verify exact request equivalence and propagation of wrong model choices. Original 97/100 policy remains unchanged apart from separately authorised budget infrastructure.

The four paired full solves are now complete and verified: both solved 4/4 in 70,83,94 and 88 turns. Baseline used 510 requests, 275.876 seconds and $0.017106264; grouped used 526 requests, 282.509 seconds and $0.016016322. The candidate passed its predefined full gate with 6.37% lower cost and 2.40% longer execution. Retain it for final selection as a cost tradeoff, not a proven reliability improvement. See full-integration/report.json and verification.json under the experiment directory.
