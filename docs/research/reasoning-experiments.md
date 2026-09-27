# Reducing supplied solving knowledge

This follow-up preserves the v26 solver and its historical results. It investigates single-turn reasoning without beginner algorithms, case-to-skill mappings or simulated candidate ranking. A model that selects supplied algorithms and a model that plans primitive turns solve different experimental tasks.

## Working protocol

1. Define one question and its offline scoring rule. Use 20 distinct development cases, not repeated calls on one case.
2. Preserve a baseline. Compare 3–4 nearby request variants on identical cases with the same observation and answer menus. Run bounded parallel workers, one per variant, with no automatic provider retries.
3. Select on the predefined exact-answer score. Treat a gain of two cases out of 20 as a screening threshold, not statistical evidence. Freeze a selected improvement before fresh validation. Keep the baseline when changes regress or produce only a one-case gain.
4. After two rounds without the threshold gain, stop that wording search. Diagnose the errors and test a different representation or a smaller component. Do not simply keep paying for synonyms.
5. Validate on 20 new states, without correcting intermediate JEV responses. Keep validation failures in the denominator. Development inputs may be reused for prompt comparison; validation inputs may not be used to tune a prompt and still called held out.
6. Attempt short integrations only after the component measurements support them. Keep all failed variants, exact requests, native responses, timing, source snapshots and cost. Every live attempt uses the shared $5 ledger.

The first representation exploration preceded the explicit two-round rule. It is documented as exploratory, not retroactively presented as a pre-registered experiment.

## Results

All representation scores below use the same original 20 development cases.

| Representation | Position | Sticker | Both |
|---|---:|---:|---:|
| Original piece names | 8/20 | 12/20 | 4/20 |
| Neutral name | 5/20 | 14/20 | 4/20 |
| Coordinates | 7/20 | 12/20 | 6/20 |
| Membership then coordinates | 4/20 | 12/20 | 4/20 |
| Membership then generic vector formula | 1/20 | 7/20 | 1/20 |
| Membership then face diagram | 13/20 | Not tested | Not tested |

The membership question passed 20/20 in each development run. Repeated runs on these same inputs do not increase the number of independent test cases.

Grid wording round 1: retained baseline 14/20; paper analogy 13/20; clock analogy 10/20. Round 2: baseline 13/20; horizontal/vertical reasoning 13/20; piece-type and direction checks 11/20. No challenger met the development-gain threshold; the wording search stopped.

Fresh validation of the unchanged face-diagram baseline: membership 20/20 and final grid position 16/20. These were 20 new unique cube states (4-, 8- and 13-turn generated setups), with earlier model answers passed on unchanged. This validates a narrower capability, not complete planning, sticker prediction or cube solving. Eighty percent position accuracy is still insufficient for long reliable action chains.

This follow-up used 320 live requests beyond the initial 20-request probe. No full solves were launched. See each suite's results.json for exact spend; the combined cost was below one cent.

## What code still does

Code names current piece locations, expresses them as coordinates or a straight-on face diagram, serializes questions, and scores answers offline. The grid projection changes viewpoint only. The vector variant supplied a generic rotation formula in the prompt; JEV had to apply it, and did poorly. No calculated post-turn point or correct transition was supplied.

Tests independently compare the face projection and generic rotation convention with cubing.js to guard against incorrect labels. The runtime request builders never call the offline rotation calculation. The membership result is never replaced by the evaluator's answer.

## Reproduction

Scripts are in scripts/request-eval/. Each live suite refuses to overwrite a started experiment. Use a new version/directory for a new run and preserve the previous records. grid-round.ts runs three variants concurrently. The second round retains the baseline and adds two local instruction variants. grid-prediction.ts --validation uses the frozen baseline and a distinct fixture seed.

Offline checks: `bun test tests/move-prediction.test.ts` and `bun run typecheck`.

Article tables: `bun scripts/summarize-reasoning.ts`, which reads saved measurements into a compact public summary. The full provider histories remain under experiments/ and in the local SQLite event ledger.

Next proposed branch: explain the remaining grid-direction errors and compare a genuinely different decomposition. The retained membership question is suitable for a small integration experiment, but full-cube reliability remains unproven without the beginner algorithms.
