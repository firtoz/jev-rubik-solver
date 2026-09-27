# Teaching JEV to solve a Rubik’s cube

An interactive article, recorded request viewer and local TypeScript lab for exploring how a small decision model can apply a supplied solving method.

The current **grouped-menu solver** solved **98 of 100 fresh random-state cubes within 100 face turns**. It uses hosted `jev-1.13.0`, with no training. This is a measured result for this task and reference library, not a claim of general reasoning ability.

## Run locally

Requires [Bun](https://bun.sh/) 1.3.13 or later.

```sh
bun install
bun run dev
```

Open [the article](http://127.0.0.1:3000/how-it-works), [the recorded request flow](http://127.0.0.1:3000/request-flow).

The website is read-only and makes no JEV API calls. It needs no credentials.

To run a paid solve locally, copy `.env.example` to `.env`, set `TYPESAFE_API_KEY` and your budget, then run `bun run lab solve "R U" --live`. Only the CLI calls the provider.

`RUBIK_BUDGET_USD` sets the cumulative local ledger ceiling, default **$1**. The ledger includes conservative reservations for uncertain outcomes. It is not the provider account balance. Keep the database when restarting so the ceiling continues to cover earlier calls. The configured estimate is $0.042 per million input tokens; check [provider pricing](https://docs.typesafe.ai/models) before a new paid study. Each attempt allows 500 requests, 100 face turns and ten minutes of active execution.

## GitHub Pages

The static Pages build is prepared in `.github/workflows/pages.yml`. It prerenders the article and request viewer with the project URL prefix and publishes only the static client output. While this repository is private on GitHub Free, pushes build an artifact and skip deployment. After making the repository public, select **Settings → Pages → Build and deployment → GitHub Actions**, then run the **Deploy GitHub Pages** workflow once. The published site will be public.

## How it works

Code measures the current cube and executes moves. JEV chooses the goal, target, reference frame, preparation and routine. Independent questions may share a request; dependent questions wait for earlier answers. For F2L it recognises a corner family before choosing from that family's routines. For PLL it recognises the corner pattern before choosing the matching edge routine.

The supplied routines are substantial assistance. The policy does not search candidate outcomes, supply recommended moves, see the scramble history or fall back to a cube solver. It can make mistakes or abstain. Full details are in the article and [architecture guide](docs/architecture.md).

Only the latest solver is runnable. Earlier policies survive as recorded evidence and research notes. The single-turn comparison is a historical recording, not an executable second policy.

## Commands

```sh
bun run check                      # tests, types, 100-record offline verification, build, release checks
bun run lab status                 # local ledger; no provider calls
bun run lab solve "R U" --live      # paid solve using the featured recording policy
bun run verify:recordings           # reproduce saved requests and moves without an API
bun run build
bun run start                      # serve the production build on localhost
bun run release:export             # clean snapshot in .data/public-release, excluding local data and Git history
```

## Repository map

| Directory | Contents |
| --- | --- |
| `src/solver/` | The current policy, prompts, memory and static routine references |
| `src/lib/` | Cube mechanics, recording data and UI helpers |
| `src/server/` | JEV transport, SQLite ledger, locks and execution |
| `src/components/`, `src/routes/` | Read-only article and recorded viewer |
| `tests/` | Offline mechanics, policy, persistence and UI tests |
| `research/evidence/` | Compressed final evaluation records and summaries |
| `docs/research/`, `notes.md` | Historical findings and experiment notes |
| `scripts/` | Local CLI, verification and release tooling |

See [evidence and reproduction](research/README.md), [contributing](CONTRIBUTING.md) and [security](SECURITY.md).

The website has no live solve endpoints. Local CLI execution and its ledger are single-user tooling. SQLite files, credentials and the full local experiment archive are excluded from the public snapshot.

## Credits and license

MIT. See [LICENSE](LICENSE). Cube transformations and animated playback use [cubing.js](https://js.cubing.net/cubing/); the static view uses [Three.js](https://threejs.org/). The app uses [TanStack Start](https://tanstack.com/start) and React. JEV is a hosted service from [TypeSafe](https://docs.typesafe.ai/api); its API access is separate from this repository's license.

Routine references and sources are described in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md). This project is an independent experiment.
