# Where the API budget went

> Historical study note. Status, budgets and original commands describe this experiment at the time. See the [research index](README.md) for current code and available records.

The new confirmation used **15,106 calls**, **17,174,681 input tokens**, **$0.721337 estimated spent** and **$0.102144 unresolved reservations**. These are local ledger estimates from native token usage, not an account invoice.

Input tokens cost $0.042 per million; output tokens are free. Each dispatch first reserves $0.002688 (the full 64,000-token ceiling). A valid response replaces that reservation with its reported input-token cost. Failed or uncertain requests retain their reservation. Reservations are not additional confirmed charges.

## By solving stage

| Group | Calls | Input tokens | Estimated spent | Reserved |
|---|---:|---:|---:|---:|
| first-layer | 3355 | 7,128,627 | $0.299402 | $0.000000 |
| daisy | 3229 | 2,564,977 | $0.107729 | $0.000000 |
| middle-layer | 3747 | 2,452,406 | $0.103001 | $0.000000 |
| incomplete / unassigned | 38 | 0 | $0.000000 | $0.102144 |
| top-corners | 974 | 1,660,286 | $0.069732 | $0.000000 |
| cross | 2354 | 1,614,293 | $0.067800 | $0.000000 |
| top-edges | 490 | 742,543 | $0.031187 | $0.000000 |
| top-orientation | 608 | 562,234 | $0.023614 | $0.000000 |
| top-cross | 311 | 449,315 | $0.018871 | $0.000000 |

Stage attribution uses the goal selected in that action cycle. Incomplete cycles without a selected goal and recovery-only actions are labelled separately.

## By request type

| Group | Calls | Input tokens | Estimated spent | Reserved |
|---|---:|---:|---:|---:|
| reference | 1433 | 3,420,291 | $0.143652 | $0.010752 |
| goal | 3174 | 2,455,400 | $0.103127 | $0.016128 |
| operation | 1429 | 2,772,325 | $0.116438 | $0.002688 |
| intent_DBR + intent_DFL + intent_DLB + intent_DRF + target | 843 | 2,450,224 | $0.102909 | $0.010752 |
| gatherTarget + transferTarget | 1085 | 967,700 | $0.040643 | $0.008064 |
| reference + situation | 1082 | 630,536 | $0.026483 | $0.016128 |
| decision | 1124 | 708,848 | $0.029772 | $0.010752 |
| intent_whole + target | 595 | 773,102 | $0.032470 | $0.002688 |
| routine | 430 | 686,522 | $0.028834 | $0.005376 |
| target | 645 | 585,332 | $0.024584 | $0.000000 |
| intention | 644 | 387,148 | $0.016260 | $0.002688 |
| action | 407 | 329,863 | $0.013854 | $0.002688 |
| setup | 429 | 182,644 | $0.007671 | $0.002688 |
| destination | 236 | 105,045 | $0.004412 | $0.002688 |
| front | 294 | 152,586 | $0.006409 | $0.000000 |
| plan | 164 | 88,414 | $0.003713 | $0.002688 |
| match_L + match_U | 152 | 67,195 | $0.002822 | $0.002688 |
| freeSlot | 151 | 60,032 | $0.002521 | $0.002688 |
| turn | 235 | 103,165 | $0.004333 | $0.000000 |
| match_F + match_U | 156 | 69,420 | $0.002916 | $0.000000 |
| match_R + match_U | 116 | 51,620 | $0.002168 | $0.000000 |
| match_B + match_U | 108 | 48,060 | $0.002019 | $0.000000 |
| recovery | 61 | 28,924 | $0.001215 | $0.000000 |
| match_B + match_R | 48 | 21,360 | $0.000897 | $0.000000 |
| match_F + match_R | 31 | 13,795 | $0.000579 | $0.000000 |
| match_B + match_L | 18 | 8,010 | $0.000336 | $0.000000 |
| match_F + match_L | 16 | 7,120 | $0.000299 | $0.000000 |

Names are the actual question keys. A row with several keys is one batched API call and is counted once. Goal selection is requested repeatedly as the cube changes. Multi-turn routines are one execution, but choosing their goal, target, frame and routine can require several calls.

Explicit repeated-state recovery questions used 61 calls and $0.001215 estimated spent, with $0.000000 reserved. This is a subset of the tables, not an extra charge. It does not measure all work spent correcting earlier tactical errors.

## Separate project studies

| Group | Calls | Input tokens | Estimated spent | Reserved |
|---|---:|---:|---:|---:|
| final-test | 29465 | 54,942,208 | $2.307573 | $0.002688 |
| brain-full-v3-final | 17665 | 24,030,420 | $1.009278 | $0.005376 |
| development | 12812 | 23,288,302 | $0.978109 | $0.002688 |
| brain-teaching-full-v1-final | 18745 | 21,553,514 | $0.905248 | $0.000000 |
| brain-teaching-confirmation-v1 | 15106 | 17,174,681 | $0.721337 | $0.102144 |
| validation | 6004 | 11,643,694 | $0.489035 | $0.000000 |
| comparison | 1500 | 3,310,572 | $0.139044 | $0.000000 |
| probe | 1811 | 2,926,362 | $0.122907 | $0.000000 |
| brain-full-v3-validation | 1774 | 2,436,863 | $0.102348 | $0.000000 |
| brain-full-v2-validation | 1699 | 2,328,919 | $0.097815 | $0.002688 |
| brain-full-v2-transport-validation | 1659 | 2,272,608 | $0.095450 | $0.002688 |
| brain-teaching-full-v1-validation | 1856 | 2,136,306 | $0.089725 | $0.000000 |
| teaching-study-v1 | 1754 | 1,122,335 | $0.047138 | $0.000000 |
| brain-full-v2 | 654 | 1,017,540 | $0.042737 | $0.000000 |
| brain-full-v3 | 671 | 930,407 | $0.039077 | $0.000000 |
| observation-boundary-v1 | 380 | 869,604 | $0.036523 | $0.000000 |
| teaching-study-v2 | 695 | 430,849 | $0.018096 | $0.000000 |
| progress-goal-development | 220 | 299,480 | $0.012578 | $0.000000 |
| first-layer-development | 260 | 256,540 | $0.010775 | $0.000000 |
| brain-v3-viewer-2026-09-22T21-49-38-503Z | 196 | 244,147 | $0.010254 | $0.000000 |
| brain-early-v2 | 262 | 214,404 | $0.009005 | $0.000000 |
| less-help-v2 | 200 | 192,320 | $0.008077 | $0.000000 |
| progress-integration-v1 | 114 | 192,243 | $0.008074 | $0.000000 |
| daisy-decision | 220 | 161,360 | $0.006777 | $0.000000 |
| less-help-v1 | 200 | 159,980 | $0.006719 | $0.000000 |
| brain-early-v3 | 197 | 155,899 | $0.006548 | $0.000000 |
| daisy-integration-v1 | 140 | 153,915 | $0.006464 | $0.000000 |
| plan-memory-v1 | 78 | 136,364 | $0.005727 | $0.000000 |
| daisy-transition-development | 120 | 128,340 | $0.005390 | $0.000000 |
| action-preconditions-v1 | 200 | 123,042 | $0.005168 | $0.000000 |
| progress-goal-validation | 80 | 121,580 | $0.005106 | $0.000000 |
| brain-early-v1 | 126 | 108,119 | $0.004541 | $0.000000 |
| goal-readable-v1 | 128 | 102,216 | $0.004293 | $0.000000 |
| goal-contract-v1 | 96 | 102,164 | $0.004291 | $0.000000 |
| less-help-compose-v1 | 80 | 92,980 | $0.003905 | $0.000000 |
| less-help-routed-v1 | 130 | 91,398 | $0.003839 | $0.000000 |
| less-help-roles-v1 | 141 | 82,251 | $0.003455 | $0.000000 |
| less-help-view-v1 | 120 | 80,912 | $0.003398 | $0.000000 |
| grid-variant-development | 120 | 71,238 | $0.002992 | $0.000000 |
| geometric-development | 80 | 69,657 | $0.002926 | $0.000000 |
| brain-full-v1 | 59 | 65,592 | $0.002755 | $0.000000 |
| less-help-scene-v1 | 88 | 56,895 | $0.002390 | $0.000000 |
| first-layer-validation | 60 | 55,380 | $0.002326 | $0.000000 |
| goal-handoff | 60 | 52,580 | $0.002208 | $0.000000 |
| development-probe | 20 | 49,781 | $0.002091 | $0.000000 |
| less-help-context-v1 | 70 | 46,027 | $0.001933 | $0.000000 |
| vector-prediction | 40 | 45,756 | $0.001922 | $0.000000 |
| grid-prediction | 80 | 45,418 | $0.001908 | $0.000000 |
| less-help-context-v2 | 70 | 41,211 | $0.001731 | $0.000000 |
| less-help-probes-v1 | 56 | 20,856 | $0.000876 | $0.000000 |
| article-manual | 9 | 17,648 | $0.000741 | $0.000000 |
| move-prediction-development | 20 | 16,341 | $0.000686 | $0.000000 |
| plan-commit-validation | 24 | 13,078 | $0.000549 | $0.000000 |
| top-slot-transfer-v1 | 24 | 10,152 | $0.000426 | $0.000000 |
| plan-commit-development | 18 | 9,768 | $0.000410 | $0.000000 |
| interactive | 2 | 4,462 | $0.000187 | $0.000000 |

These ledger groups include earlier experiments and the current confirmation separately. Unlabelled entries are retained rather than guessed. Historical uncertain reservations remain visible. Latency totals and per-group numeric values are available in the machine-readable breakdown (archived: `experiments/brain-teaching-confirmation-v1/cost-breakdown.json`); summed latency is not wall-clock duration because four attempts run concurrently.
