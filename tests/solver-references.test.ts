import { test, expect } from 'bun:test';
import { solved, apply, inverse, pieces, facts } from '../src/lib/cube';
import { routines as pairs } from '../src/solver/f2l/reference';
import { routines as pll, observation as pllObservation } from '../src/solver/pll';
import {
  routines as orientations,
  observation as orientationObservation,
} from '../src/solver/orientation';
import { routines as extractions } from '../src/solver/f2l/extraction-reference';

test('F2L reference diagrams match cube mechanics and preserve the cross', async () => {
  const base = await solved();
  for (const routine of pairs) {
    const before = await apply(base, inverse(routine.alg)),
      all = pieces(before);
    expect(facts(before).cross).toBe(true);
    for (const expected of routine.pattern) {
      const actual = all.find(
        (p) => p.kind === expected.kind && p.piece === (expected.kind === 'corner' ? 'DRF' : 'FR'),
      )!;
      expect(actual.position).toBe(expected.position);
      expect(actual.stickers as unknown).toEqual(expected.stickers);
    }
  }
});
test('PLL and corner-orientation reference patterns match their fixed algorithms', async () => {
  const base = await solved();
  for (const routine of pll) {
    const before = await apply(base, inverse(routine.alg)),
      observed = pllObservation(before);
    expect({ ...observed.edges, ...observed.corners }).toEqual(routine.pattern);
    expect(facts(before).middle && facts(before).topCross && facts(before).topOriented).toBe(true);
  }
  for (const routine of orientations.filter((r) => r.stage === 'orientation')) {
    const before = await apply(base, inverse(routine.alg));
    expect(orientationObservation(before, 'orientation') as unknown).toEqual(routine.pattern);
    expect(facts(before).middle && facts(before).topCross).toBe(true);
  }
});
test('extraction references describe actual landing slots while preserving the cross', async () => {
  const base = await solved();
  for (const routine of extractions) {
    const after = await apply(base, routine.alg),
      all = pieces(after);
    expect(all.find((p) => p.piece === routine.cornerSlot)!.position).toBe(routine.cornerLands);
    expect(all.find((p) => p.piece === routine.edgeSlot)!.position).toBe(routine.edgeLands);
    expect(facts(after).cross).toBe(true);
  }
});
