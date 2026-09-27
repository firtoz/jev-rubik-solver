# Full PLL experiment

> Historical study note. Status, budgets and original commands describe this experiment at the time. See the [research index](README.md) for current code and available records.

The previous controller placed top corners and edges separately. Recorded solves commonly spent 26–30 turns on that part alone. This experiment teaches the standard full PLL vocabulary so JEV can choose a routine that places both together.

Code still measures piece positions and homes. JEV first identifies the corner arrangement, then selects a routine from that model-selected reference family using the edge arrangement. That choice includes the frame and any initial U setup. Code executes it without correcting the model's answer.

The fixed algorithms are explicit assistance, sourced from [CubeSkills](https://www.cubeskills.com/uploads/pdf/tutorials/pll-algorithms.pdf). They were converted to outer-face turns and mechanically verified. Their reference illustrations cover all 288 legal oriented top-layer permutations, including solved and U-adjustment cases. This coverage is a property of the reference library, not a claim that JEV passed 288 live tests.

## Evidence

| Check | Result |
| --- | --- |
| Development, structured inputs | 24/24 complete PLL solves |
| Development, equivalent player descriptions | 24/24 complete PLL solves |
| Separate validation, frozen structured form | 24/24 complete PLL solves |
| Paired full development runs | 4/4 solved in 83, 82, 79, 93 turns |
| Saved baseline on those starts | 4/4 solved in 98, 96, 95, 93 turns |

The structured form used slightly fewer tokens. The measured tie does not show that prose helps or hurts accuracy. Upstream decisions varied between full runs, so the whole-solve differences are not a controlled measurement of PLL alone. The PLL portions used 14, 12, 15 and 15 turns.

Eight new random-state starts passed with the policy frozen: 82, 81, 84, 67, 87, 83, 77 and 72 turns. There were no repeated states, recovery actions or transport failures. This batch cost $0.036030498. The unchanged policy subsequently passed the separate 100-case held-out evaluation: 97/100 solved within 100 face turns. See the final result below.

## Reproduction and records

- Reference and offline compiler: `scripts/full-pll-v1/reference.ts`, `compile.ts`.
- Request construction and model-selected routing: `policy.ts`.
- Isolated evaluations: `screen.ts`; records in `experiments/full-pll-v1`.
- Full candidate: `full-policy.ts`; paired records in `full-integration`.
- Fresh development runner: `fresh-development.ts`.
- Final runner: `final100.ts`, guarded by verified development results and budget reservations.
- Verification scripts reconstruct exact requests from recorded native responses and independently replay cube transformations. Replays make no API calls.

Live runners deliberately refuse to overwrite their start manifests. Re-running a completed study needs a new named dataset and ledger scope, not deletion of its records. All calls use the project's existing server-side credentials and global commitment ceiling.

A useful lesson so far: correct low-level choices can still be inefficient when the learned action vocabulary is too limited. A richer routine vocabulary can help, provided case recognition is measured separately and its contribution is disclosed. This is evidence from this cube task, not proof of a general reasoning capability.

## Final held-out result

The frozen policy solved **97 of 100 fresh random-state scrambles within 100 face turns**, meeting the requested acceptance target. Every attempt was retained and independently replayed. No policy changes or failed-cube reruns occurred during the test.

| Measure | Result |
| --- | --- |
| Successful face turns, minimum / median / maximum | 49 / 81 / 98 |
| Successful execution seconds, minimum / median / maximum | 49.042 / 100.099 / 190.118 |
| Successful requests, minimum / median / maximum | 85 / 128 / 199 |
| HTTP attempts / successful exchanges | 12,731 / 12,730 |
| Input tokens in successful exchanges | 10,086,702 |
| Evaluation settled cost | $0.423641484 |
| Evaluation unresolved reservation | $0.002688 |
| Evaluation total commitment | $0.426329484 |
| Entire project commitment | $8.732707452 of $9 |

One network failure on final-19 was retried successfully. Its uncertain reservation remains held. There were no unresolved transport attempts. Project commitment includes $8.455843452 settled and $0.276864 reserved across the whole project, not just this test.

Failures remain in the denominator: final-12 abstained in daisy construction before executing a move; final-20 abstained during F2L at 44 turns; final-99 stopped at 93 because its selected 15-turn Z permutation would have reached 108. The last case had already spent 24 turns orienting top edges. These are observations, not evidence that any proposed repair would improve the frozen policy.

Among successful solves, average turns by stage were daisy 9.34, cross 6.28, F2L 35.80, top-cross 7.61, top-orientation 7.44 and PLL 14.19. F2L remains the largest source of moves. This result measures the supplied recognition-and-routine system. It does not demonstrate algorithm discovery, minimal solutions, a guaranteed population success rate, or transfer to other problems.

Final records: `experiments/full-pll-v1/final100/{started,fixtures,results,completion,verification,report}.json`. Exact request/native-response bodies are in results and the persisted event ledger. Offline reproduction:

```sh
bun scripts/full-pll-v1/verify-final.ts
bun scripts/full-pll-v1/report-final.ts
```

## Completion audit

- Baseline stage audits and failed candidates are retained in the move-efficiency, alignment, extraction, daisy, protected-landing and last-layer progress documents and `notes.md`.
- Isolated development and fresh validation preceded paired full comparisons and eight fresh development solves. Those gates are recorded separately from the final test.
- The final runner froze its transitive sources before generating 100 unique random-state scrambles. Verification checks the freeze and excludes prior recorded starting states.
- The verifier reconstructs every request from recorded model answers and replays every executed move. It checks final solved states, standard face-turn counts, the 500-request and 10-minute limits, and the $9 commitment ceiling. All 100 records passed.
- Code supplies measurements and executes fixed routines; JEV selects the goal, target, preparation and routine. The PLL reference family follows JEV's corner-pattern answer. Wrong answers are not repaired. All fixed algorithms and static case illustrations are disclosed assistance.
- Fourteen relevant mechanics and responsibility-boundary tests passed with 3,609 assertions; TypeScript checking passed. No live calls were made by these checks.
- All three non-successes and the recovered transport error remain recorded. No final-test failures have been used for tuning. Any future tuning from them must retire this set.

The original 99/100 result under looser turn limits remains a separate experiment.
