import { createRun, finish } from '../src/server/runner';
import { budget } from '../src/server/jev';
const [command, ...args] = process.argv.slice(2);
if (command === 'status') console.log(JSON.stringify(budget(), null, 2));
else if (command === 'solve' && args.includes('--live')) {
  const scramble = args.filter((a) => a !== '--live').join(' ');
  if (!scramble) throw Error('Supply a scramble, for example: bun run lab solve "R U" --live');
  const run = await createRun(scramble, 'skills', 'cli');
  console.log('Run:', run.id);
  const result = await finish(run.id);
  console.log(
    JSON.stringify(
      {
        id: result.id,
        status: result.status,
        turns: result.turns,
        requests: result.requests,
        cost: result.cost,
        elapsedMs: result.activeMs,
        reason: result.reason,
      },
      null,
      2,
    ),
  );
} else {
  console.log(
    'bun run lab status                     # local ledger, no API calls\nbun run lab solve "R U" --live          # paid solve, latest policy\nbun run verify:recordings               # offline replay of 100 recorded attempts',
  );
  if (command && command !== 'help') process.exitCode = 1;
}
