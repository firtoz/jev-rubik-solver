# Architecture

## One active policy

`src/solver/index.ts` exposes `decideRound(run, ask, context)`. The local CLI uses `src/server/runner.ts` to call it. Policy version `grouped-menu-v1` prevents older runs from continuing under changed code. The website does not import the runner or provider transport.

The solver is independent of HTTP and SQLite. The caller supplies an `ask` function that returns a typed JEV response. Tests and the recording verifier supply saved answers; live callers use `src/server/jev.ts`.

| Module                        | Responsibility                                                    |
| ----------------------------- | ----------------------------------------------------------------- |
| `solver/goal.ts`, `policy.ts` | Goal request and routing by JEV's answer                          |
| `solver/cross/`               | Daisy targets, reference, routine, protected landing and transfer |
| `solver/plan-commitment.ts`   | JEV checks whether to resume its remembered preparation plan      |
| `solver/f2l/`                 | Target pair, frame, extraction/alignment, corner family, routine  |
| `solver/top-cross.ts`         | White-edge pattern, reference and routine                         |
| `solver/orientation.ts`       | White-corner orientation routine                                  |
| `solver/pll.ts`               | Corner family followed by edge-pattern routine                    |
| `solver/references/`          | Fixed algorithms and mechanically generated reference patterns    |

A few routine names and helper structures descend from earlier experiments. They are retained only as components of the current chain. The general beginner solver and primitive live policy have been removed. `src/lib/skills.ts` is a reference glossary also used to explain historical recordings, not a runnable second solver.

## Boundary between code and model

Code measures stickers, counts pieces, checks completed structures, converts coordinates, executes moves and records results. JEV chooses the goal, target, reference frame, recognised situation, preparation, routine and response to repeated states. There is no search or predicted-outcome ranking.

Menus may be narrowed by an earlier JEV-selected family. Code does not inspect the current case to pick that family. A mistaken model answer passes downstream; it is not replaced with an oracle answer. Reference catalogs were constructed offline and do not solve the current cube.

Scrambles initialise the state, but are absent from requests. Memory contains only previous solving actions, a target and the model's unfinished preparation plan.

## Persistence and limits

SQLite stores runs, immutable events, command IDs, leases and a shared cost ledger. Every network attempt reserves cost before dispatch. Successful responses settle using token usage; uncertain attempts retain their reservations. Budget checks are transactional across processes. The ledger ceiling is cumulative and separate from provider credit balance.

The runner has internal pause, resume and restart recovery support. The current CLI exposes only `status` and `solve`. Each attempt allows 500 HTTP attempts, 100 face turns and ten minutes of active execution. Transport retries count as requests and reserve separately. A half turn counts as one face turn; undo turns count too.

## Presentation

`/how-it-works` combines the article, immutable recorded comparisons and local CLI instructions. `/request-flow` shows the featured current solve's exact requests and handoffs. `/` redirects to the article. There are no web server functions for creating runs or calling JEV.

The featured solve was selected after evaluation as the fewest-turn success, so it illustrates a favourable case. Earlier results and the single-turn replay are historical evidence, labelled separately. Playback makes no API calls.

Request and response JSON are preserved without headers. Confidence is the provider's statistic, not a calibrated solve probability.
