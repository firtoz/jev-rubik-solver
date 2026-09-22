import { test, expect } from 'bun:test';
import { readFileSync } from 'node:fs';
import { apply, hash, solved, pieces, colors } from '../src/lib/cube';
import { preconditionRequest, preconditionObservation } from '../src/server/action-preconditions';
test('precondition fixtures are distinct legal cubes and literal observations agree with mechanics', async () => {
  const all = ['development', 'validation'].flatMap((s) =>
    JSON.parse(readFileSync(`experiments/action-preconditions-v1/${s}-fixtures.json`, 'utf8')),
  );
  expect(new Set(all.map((c) => c.stateHash)).size).toBe(80);
  for (const c of all) {
    expect(hash(await apply(await solved(), c.scramble))).toBe(c.stateHash);
    expect(preconditionObservation(c.state, c.target, c.front, c.routine)).toEqual(c.observation);
    const target = pieces(c.state).find((p) => p.kind === 'edge' && p.piece === c.target)!;
    const side = Object.entries(target.stickers).find(([color]) => color !== 'yellow')!;
    expect(c.observation.target.sideMatchesCenter).toBe(colors[side[1]] === side[0]);
    expect(Object.values(c.observation.yellowUpPetals).filter(Boolean).length).toBe(
      pieces(c.state).filter((p) => p.kind === 'edge' && p.stickers.yellow === 'U').length,
    );
    for (const v of ['rule', 'criteria', 'check-then-choice'] as const) {
      const request = preconditionRequest(c.observation, c.family, v);
      expect(JSON.stringify(request)).not.toMatch(/"expected"|"scramble"|"stateHash"/);
      if (v === 'check-then-choice') {
        const wrong = c.ready === 'yes' ? 'no' : 'yes';
        expect(
          (preconditionRequest(c.observation, c.family, v, wrong).state as any).previousModelReady,
        ).toBe(wrong);
      }
    }
  }
});
test('precondition viewer faithfully exports all native exchanges', () => {
  const data = JSON.parse(readFileSync('src/lib/action-preconditions.json', 'utf8'));
  let count = 0;
  for (const phase of data.phases) {
    const original = JSON.parse(
      readFileSync(`experiments/action-preconditions-v1/${phase.phase}-results.json`, 'utf8'),
    );
    for (const row of phase.rows) {
      const source = original.rows.find((r: any) => r.runId === row.runId);
      for (let i = 0; i < row.exchanges.length; i++) {
        expect(row.exchanges[i].request).toEqual(source.exchanges[i].request);
        expect(row.exchanges[i].response).toEqual(source.exchanges[i].nativeResponse);
        expect(Object.keys(row.exchanges[i]).sort()).toEqual([
          'cost',
          'elapsedMs',
          'id',
          'request',
          'response',
        ]);
        count++;
      }
    }
  }
  expect(count).toBe(200);
});
