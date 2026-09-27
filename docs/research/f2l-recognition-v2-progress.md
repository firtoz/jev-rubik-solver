# Grouped F2L recognition

The incumbent selects among 41 fixed F2L reference cases in one request. The candidate asks JEV to recognise the corner pattern, then choose a routine from that model-selected reference family. Code does not recognise the live case or correct a wrong group. The routine library is unchanged.

All three development formulations passed20/20 canonical cases. Grouping used32,221 input tokens versus65,160 for the incumbent, but doubled requests and increased mean decision time from0.663s to1.141s. The grouped version then passed21/21 remaining canonical cases, includingpair-41, which the incumbent had missed in a retired full recording. This is finite case coverage, not a fresh full-solve success claim.

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

Grouping passed the predefined15% token-saving gate narrowly, at15.063%, with1.06% more turns and8.64% more time. It remains a cost-saving candidate with a latency tradeoff. No policy promotion yet. Fresh stage validation also passed: 8/8 each, 155 versus146 turns, 182,753 versus144,982 input tokens (20.7% saving), and131.674 versus134.045 total seconds. Four fresh paired full solves are next; the candidate changes only F2L routine selection. It is not yet promoted.

Records: experiments/f2l-recognition-v2. Verification: bun scripts/f2l-recognition-v2/verify.ts and bun scripts/f2l-recognition-v2/verify-stage.ts. All16 recorded chains replayed against native model responses and cube mechanics. Two adapter tests verify exact request equivalence and propagation of wrong model choices. Original97/100 policy remains unchanged apart from separately authorised budget infrastructure.

The four paired full solves are now complete and verified: both solved4/4 in70,83,94 and88 turns. Baseline used510 requests,275.876 seconds and$0.017106264; grouped used526 requests,282.509 seconds and$0.016016322. The candidate passed its predefined full gate with6.37% lower cost and2.40% longer execution. Retain it for final selection as a cost tradeoff, not a proven reliability improvement. See full-integration/report.json and verification.json under the experiment directory.
