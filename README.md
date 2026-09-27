# Teaching JEV to solve a Rubik’s cube

An interactive article about breaking cube solving into decisions a small model can handle. The repository includes recorded replays, an inspector for every request and response, and the final solver as a local command-line tool.

The final **grouped-menu solver solved 98 of 100 fresh random-state cubes within 100 face turns**. We supplied observations and known cube algorithms, then asked hosted `jev-1.13.0` to choose when and how to use them. We did not train the model.

[Read the article](https://firtoz.github.io/jev-rubik-solver/how-it-works/) · [Inspect a recorded solve](https://firtoz.github.io/jev-rubik-solver/request-flow/)

The website uses saved recordings and needs no API key.

## Run the website locally

Install [Bun](https://bun.sh/) 1.3.13 or later, then run these commands from the repository root:

```sh
bun install
bun run dev
```

Open `http://127.0.0.1:3000`. This serves the same article and recordings locally.

## Try a live solve

Copy `.env.example` to `.env` and set `TYPESAFE_API_KEY` and `RUBIK_BUDGET_USD`. Keep your key in that ignored file or in an environment variable.

```sh
cp .env.example .env
# Edit .env before continuing.
bun run lab status
bun run lab solve "R U" --live
```

The quoted moves describe a scramble applied to a solved cube. Only the last command calls JEV. It uses the policy from the featured recording and prints the outcome, turns, requests, estimated cost and elapsed time. Full exchanges are saved in the local SQLite database under `.data/`.

`RUBIK_BUDGET_USD` is the cumulative local spending ceiling, default **$1**. Uncertain requests retain a reserved allowance so they still count against that ceiling. Keep the database between runs to preserve the spending record. `lab status` reports this local accounting, not your provider account balance.

Each attempt allows 500 HTTP attempts, 100 face turns and ten minutes of active execution. Retries count toward those limits. A half turn counts as one face turn. Usage estimates use the study's rate of $0.042 per million input tokens; check [current provider pricing](https://docs.typesafe.ai/models) before running a paid experiment.

## How the solver works

Code measures the cube and executes moves. JEV chooses the goal, target piece, reference orientation, preparation and routine. Independent questions can share a request. A question that needs an earlier answer waits for it.

For **F2L** (first two layers), JEV recognises the corner pattern before choosing a routine for the corner and its matching edge. For **PLL** (permutation of the last layer), it recognises a corner pattern before choosing a routine using the edge arrangement.

The supplied algorithms are substantial assistance. JEV receives no scramble history, predicted move outcomes or solver-generated solution. Wrong choices can lead to extra work or a failed attempt. See the [architecture guide](docs/architecture.md) for the boundary between code and model.

Only this final policy is runnable. Earlier approaches, including the single-turn comparison, remain as research notes and recordings.

## Offline checks and other commands

```sh
bun run verify:recordings  # replay the final 100 attempts without calling JEV
bun run check              # tests, types, recording verification, build and release checks
bun run build
bun run start              # serve the production build on localhost
bun run release:export     # copy distributable files into .data/public-release
```

The export omits credentials, local databases and Git history. Move an existing export aside before running it again.

## GitHub Pages

The [Pages workflow](.github/workflows/pages.yml) builds static HTML for the article and request viewer at `/jev-rubik-solver/`. It uses Node 22 for prerendering and Bun to install dependencies. Only `dist/client` is published.

Pushes to `main` deploy automatically through GitHub Actions.

To build the Pages files locally, install Node 22 as well as Bun and run:

```sh
GITHUB_PAGES=1 bun run build:pages
```

## Repository map

| Directory                        | Contents                                                            |
| -------------------------------- | ------------------------------------------------------------------- |
| `src/solver/`                    | Current prompts, decision sequence, memory and algorithm references |
| `src/lib/`                       | Cube mechanics, recorded data and viewer helpers                    |
| `src/server/`                    | CLI transport, SQLite ledger, locks and execution                   |
| `src/components/`, `src/routes/` | Article and recorded viewer                                         |
| `tests/`                         | Offline mechanics, policy, persistence and UI checks                |
| `research/evidence/`             | Final evaluation records and summaries                              |
| `docs/research/`, `notes.md`     | Experiment history and lessons for the article                      |
| `scripts/`                       | CLI, verification and release tools                                 |

See [evidence and reproduction](research/README.md), [contributing](CONTRIBUTING.md) and [security](SECURITY.md). The website has no live solve endpoints. Paid execution is available through the local CLI.

## Credits and license

[MIT](LICENSE). Cube transformations and animated playback use [cubing.js](https://js.cubing.net/cubing/); the static view uses [Three.js](https://threejs.org/). The app uses [TanStack Start](https://tanstack.com/start) and React. JEV is a hosted service from [TypeSafe](https://docs.typesafe.ai/api); API access is separate from this repository's license.

Algorithm sources are listed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). This is an independent experiment.
