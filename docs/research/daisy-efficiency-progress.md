# Daisy cost teaching

> Historical study note. Status, budgets and original commands describe this experiment at the time. See the [research index](README.md) for current code and available records.

An offline audit found six recorded three-turn lifts where an existing one-turn routine could gather the same target while preserving existing petals and solved bottom edges. The audit is evaluator-only; no outcome ranking enters live requests.

| Routine-selection request | Development score |
|---|---:|
| Original | 9/15 |
| Add fixed turn costs and cheapest eligible lift teaching | 14/15 |
| Also simplify observations and require exact position matches | 13/15 |

The first cost prompt retained one wrong-position selection. The revision fixed that error but preferred staging in two cases where the rubric expected an immediate lift. No variant passed the 15/15 gate, so the 15 reserved inputs remain unused and no prompt is promoted. 45 calls cost $0.003164868, with exact request/native response replay verified.

The rubric has a practical limit: cheapest immediate lift is not necessarily cheapest complete gathering sequence. Staging can make a later lift cheaper. Therefore the revised staging choices are instruction mismatches, not proven full-solve efficiency failures.

Next: a bounded paired comparison of complete early-stage trajectories, counting setup and staging turns and requiring preservation and cross completion. The objective remains full cubes solved within 100 turns, not merely matching a preferred local answer.

## Complete early-stage comparison

The frozen cost-v2 prompt was then evaluated on the actual stage objective rather than the immediate-lift rubric:

| Recorded start | Baseline turns to cross | Candidate turns to cross |
|---|---:|---:|
| fresh-1 | 17 | 15 |
| fresh-7 | 24 | 13 |
| fresh-8 | 22 | 13 |

All six completed the cross and passed exact request/native response/action replay. The candidate preserved every previously solved bottom edge; baseline fresh-7 temporarily lost one. Candidate elapsed 30.5–44.8 seconds, baseline 41.0–48.6 seconds. 439 requests cost $0.013762182.

This does not retroactively pass the earlier local gate. It is new evidence under a more relevant complete-stage metric, and still does not prove full-solve savings: later F2L states differ. Three new random-state cross cases are being tested unchanged before full integration.

Fresh cross validation completed 3/3 in 11,16 and 16 turns. However, one attempt disturbed a solved bottom edge, failing the zero-regression gate. No full integration was launched. The 212 requests cost $0.006684636; project commitment: $8.211368886.

The trace exposed a dependent-request gap: routine selection received protected bottom slots, but the later landing/preparation question did not. That question directed JEV to lower any blocked top target, and the fixed lowering move broke the protected edge below it. The next test must supply the missing observations and offer a model-selected safe preparation, rather than automatically correcting the move in code.
