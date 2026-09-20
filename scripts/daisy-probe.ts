import { writeFileSync } from 'node:fs';
import { events, getRun, saveRun, event } from '../src/server/store';
import { daisyPreparation, daisyClearance } from '../src/server/skill-policy';
import { evaluate, MODEL, budget } from '../src/server/jev';
const sourceIds = [
  '2084b85b-6f1e-4aa8-8043-2bf11e7e312b',
  '96c1668e-d6dc-44e7-b04c-36adc3fe7d80',
  '0096306f-c112-4206-84d8-41bcc777ae6b',
];
const fixtures: { name: string; state: any; expected: string; turns?: string[] }[] = sourceIds.map(
  (id, i) => ({
    name: `retired-failure-${i + 1}`,
    state: events(id)
      .filter((e) => e.kind === 'decision')
      .at(-1)!.payload.request.state,
    expected: i === 0 ? 'clear' : 'lower',
    turns: i === 0 ? ['U', "U'", 'U2'] : undefined,
  }),
);
for (const [empty, turns] of [
  ['UL', ["U'"]],
  ['UB', ['U2']],
  ['UR', ['U']],
  ['UF', []],
] as [string, string[]][]) {
  fixtures.push({
    name: `only-${empty}-free`,
    state: {
      target: { layer: 'middle' },
      mustBeFree: ['UF'],
      topSlotOccupancy: Object.fromEntries(
        ['UF', 'UR', 'UB', 'UL'].map((s) => [
          s,
          s === empty ? 'free of yellow-up petals' : 'occupied by yellow-up petal',
        ]),
      ),
    },
    expected: empty === 'UF' ? 'execute' : 'clear',
    turns,
  });
}
fixtures.push({
  name: 'no-clearance-needed',
  state: { ...fixtures[1].state, mustBeFree: [] },
  expected: 'execute',
});
writeFileSync('experiments/daisy-probe-v1.lock', new Date().toISOString(), { flag: 'wx' });
const results = [];
for (const f of fixtures) {
  const r = {
    ...getRun(sourceIds[0]),
    id: crypto.randomUUID(),
    status: 'stopped' as const,
    split: 'probe',
    benchmarkId: null,
    requests: 0,
    tokens: 0,
    cost: 0,
    version: 'daisy-probe-v1',
  };
  saveRun(r);
  const ask = (request: any) =>
    evaluate(r.id, request, AbortSignal.timeout(30000), { maxAttempts: 1 });
  const d = await ask(daisyPreparation(MODEL, f.state));
  const prep = d.response.answers.preparation.choice;
  const clearance = prep === 'clear' ? await ask(daisyClearance(MODEL, f.state)) : null;
  const turn = clearance?.response.answers.clearance.choice;
  const result = {
    name: f.name,
    expected: f.expected,
    actual: prep,
    turn,
    correct: prep === f.expected && (prep !== 'clear' || f.turns?.includes(turn!)),
    cost: d.cost + (clearance?.cost ?? 0),
    runId: r.id,
  };
  event(r.id, 'daisy-probe-result', result);
  results.push(result);
  console.log(JSON.stringify(result));
}
writeFileSync(
  'experiments/daisy-probe-v1.json',
  JSON.stringify({ results, budget: budget() }, null, 2),
);
