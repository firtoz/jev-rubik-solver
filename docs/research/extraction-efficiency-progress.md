# Partner-aware extraction

> Historical study note. Status, budgets and original commands describe this experiment at the time. See the [research index](README.md) for current code and available records.

A recorded F2L edge extraction trapped its matching corner in a bottom slot, requiring another extraction. The candidate gives JEV two fixed slot-opening directions, with generic effects documented for both. Code reports actual positions and executes the selected routine.

| Format | Development | Unused position cases |
|---|---:|---:|
| Flat menu, coordinate fields | 13/15 | Not run |
| Flat menu, sentences | 12/15 | Not run |
| Choose slot, then direction | 15/15 | 15/15 |

The sequential version narrows the second menu using JEV's first answer and explicitly teaches which incoming position would trap the partner. A wrong slot answer is not repaired. Tests score physical extraction, partner availability, the cross and completed pairs. Correct individual pieces inside an unfinished slot may temporarily move.

All 30 cases passed exact request/native response and mechanics replay for the sequential policy. The two studies cost $0.002131080 combined, 90 requests. No transport errors occurred. Sources and complete records are in `experiments/extraction-efficiency-v1/`.

The integrated controller passes the recorded trap geometry test. Full-solve improvement remains untested: different opening directions can change later insertion costs. Next is a small paired integration on extraction-heavy recorded starts. The prior fresh full-set result remains 5/8 under 100 turns.

## Full comparison

Four extraction-heavy recorded starts all solved within 100 turns, versus the saved 3/4:

| Start | Saved result | Candidate |
|---|---|---|
| fresh-1 | Solved 87 | Solved 98 |
| fresh-2 | Solved 96 | Solved 96 |
| fresh-3 | Solved 85 | Solved 95 |
| fresh-5 | Capped 93 | Solved 93 |

Candidate extraction actions trapped no partners (0/5); baseline actions trapped two (2/7). Overall F2L turns did not consistently improve, and two complete solves became longer. The newly successful start also benefited from its later corner routine finishing the whole cube. This is a selected developmental comparison, not a population reliability estimate.

All records passed exact request/native response/action replay. 591 calls cost $0.019601232, with no HTTP failures. Project commitment: $8.187757200. The broader 5/8 result remains preserved and is not recomputed by replacing failed attempts with these reruns.
