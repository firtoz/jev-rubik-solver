# JEV Rubik’s Cube Lab

Local TanStack Start + Bun app for studying whether hosted `jev-1.13.0` can solve a 3×3 cube through typed decisions. The frozen v26 skill policy achieved **99/100 unseen autonomous full random-state solves**, exceeding the 95/100 target. One HTTP 503 failure remains counted. See [results](docs/results.md) for scope, costs and verification.

```sh
bun install
bun run dev
# http://127.0.0.1:3000
bun run typecheck
bun test
bun run build
bun run start
```

Set `TYPESAFE_API_KEY` server-side, or use the existing local credential in `/home/frtn/work/2026/laya/.env`. Laya is read only. SQLite data and cost reservations live in `.data/lab.sqlite` (`RUBIK_DB` overrides the path). Do not expose this single-user app to the public network.

## How decisions work

Code owns cubing.js transformations, current-state observations, factual pattern measurements, persistence and limits. Since rubik-v21, JEV chooses the goal before every action from an unfiltered goal menu, using six-face sticker observations, counts, completion flags, its previous goal and a static beginner strategy reference. Code does not select the next curriculum stage. JEV then chooses targets, intentions, reference orientations, setups and skills; completed target pieces remain in its menu. The skill library contains static move sequences and descriptions. Code never runs a solver, ranks simulated candidate outcomes or chooses a skill by matching the current case.

Observations include positions, sticker directions, centre colours, stage completion, and recent actual actions. Permanent piece identities are separated from local coordinates. Last-layer observations include visible side rows. Some independent per-piece intention questions are batched; cross and middle-layer target/intent decisions are sequential and use compact observations. Dependent operation questions use later requests. Daisy preparation is a separate JEV choice after selecting a lift. Its fixed clearance requirements are library metadata, not a current-state answer.

A selected target persists as context across setup moves. JEV can choose recovery on repetition or lack of stage progress. Temporary disruption inside a skill is allowed; the complete skill is one recorded action. Primitive mode selects individual face turns. Neither policy sees the scramble history; the scramble is used only to initialise and independently replay a run.

The UI supports live execution, step/pause/stop, rotatable 3D rendering, playback, native probability distributions, provider confidence, raw request/response inspection, saved runs and benchmarks. Polling and replay make no JEV calls. The global activity display and stop control cover running runs and in-flight decisions. Confidence describes an answer distribution, not the measured chance of solving a cube.

The Inspector renders the entire request body and full native response, with optional raw JSON. Older recordings are explicitly labelled as validated-field captures. Headers are never persisted. Recorded timing preserves the wall-clock intervals from the first solving step, including request waits and pauses. Each transition's animation spans the interval between its two recorded cube states, arriving at the next state at its original timestamp. Back/Next visits each request, response and action; responses remain hidden until their recorded receipt. Live follow buffers completed rounds and animates them at their measured duration while JEV works ahead; it waits if the next completed round is unavailable. Intermediate movement is a visual interpolation: the server applies each skill atomically.

Earlier policy failures and retired evaluations remain documented in [request coverage](docs/request-coverage.md). Component coverage is still partial: passing the complete solve evaluation does not imply every intermediate answer is correct.

## Experimental workflow

Prefer a labelled checkpoint or tiny batch before a broad evaluation. There is no automatic prompt tuning or model training. These commands make live calls unless marked offline:

```sh
bun run lab status                         # offline ledger summary
bun scripts/progress.ts BENCHMARK_ID       # offline evaluation progress
bun scripts/decision-probe.ts              # offline six-scenario fixture verification
bun scripts/decision-probe.ts --live       # exclusive twelve-call experiment, no retries
bun scripts/checkpoint.ts RUN_PREFIX INDEX # one recorded action checkpoint, current policy
bun scripts/iterate.ts "R U"                # bounded diagnostic solve, stops on repetition
bun run lab generate development 3         # offline random-state generation
bun scripts/iterate.ts --dataset .data/development.json
bun run lab generate validation 5
bun run lab compare .data/validation.json --skills-only
bun run lab compare .data/development.json # both policies, identical limits
```

`iterate.ts` uses stricter diagnostic limits (180 requests, 60 actions, $0.03 per attempt, or three visits to a state), stops the batch after failure and retains all results. These are not the final acceptance limits. `lab compare` uses 500 requests / 1,000 face turns / 10 minutes per attempt, including undo moves. Half turns count as one turn.

Only after validation supports it, freeze the policy and generate a fresh final set:

```sh
bun run lab generate final-test 100
bun scripts/evaluate.ts begin .data/final-test.json
bun scripts/evaluate.ts batch BENCHMARK_ID # four assigned cases; repeat until complete
```

Final datasets cannot be reused or overlap prior recorded initial states. Do not tune on final-test failures and then reuse that set. Success requires at least 95 verified autonomous solves out of the 100 assigned cases; failed and capped attempts stay in the denominator. Primitive comparisons may be run separately on matched cases.

Every request is recorded with its exact input and native response in immutable SQLite events. Source snapshots, dataset manifests, metrics and failed attempts are retained under `.data/configs`, `.data/datasets`, `.data/reports` and `.data/iterations`. Single-step probes are not full solves. Checkpoint continuations are development diagnostics, not held-out successes.

The shared ledger enforces the **$9 cumulative project cap** (raised by the user on 2026-09-21 after funding the account to $10), including retries. Each dispatch reserves the full documented request ceiling; successful responses settle at reported input-token usage. Uncertain outcomes retain their reservation. Pricing was checked at $0.042 per million input tokens on 2026-09-20; verify it again before later evaluations.

## Interactive field guide

Open `/how-it-works` for the interactive article and manual layer workbench. Build a legal configuration using face turns or a setup sequence, prepare its first request for free, run one paid layer at a time, then explicitly apply the selected move. The workbench replays cached answers through the production goal and skill policy to construct each dependent question; revisiting a request never calls JEV. It intentionally omits automatic recovery and marks its runs `article-manual`, so they cannot count as autonomous benchmark successes.

Sessions and round histories persist in `tutorial_sessions` in the same SQLite database. Exact provider exchanges also use the existing immutable event ledger. The shared $9 cap and 500-request ceiling apply; each click makes at most one provider attempt. Manual sessions cannot be started by the autonomous runner. Configuration edits begin a new investigation without deleting earlier records.

The article's recorded comparison reads `experiments/v26-primitive-comparison.json` and corresponding local SQLite runs. Preserve `.data/lab.sqlite` when moving this existing lab. A fresh installation can use the live workbench without those historical recordings; reproduce experiments with the commands in the article and the request-evaluation scripts.
