import { test, expect } from 'bun:test';
import {
  solved,
  apply,
  inverse,
  hash,
  isSolved,
  pieces,
  facts,
  mapAlg,
  turns,
  parseScramble,
  stage,
} from '../src/lib/cube';
import { skills } from '../src/lib/skills';
test('face turns and inverses preserve a valid cube', async () => {
  const s = await solved();
  for (const move of turns) {
    expect(hash(await apply(s, `${move} ${inverse(move)}`))).toBe(hash(s));
    expect(isSolved(await apply(s, Array(4).fill(move).join(' ')))).toBe(true);
  }
  const a = await apply(s, "R U F2 D L' B");
  expect(isSolved(a)).toBe(false);
  expect(new Set(a.EDGES.pieces).size).toBe(12);
  expect(new Set(a.CORNERS.pieces).size).toBe(8);
  expect(a.EDGES.orientation.reduce((a, b) => a + b, 0) % 2).toBe(0);
  expect(a.CORNERS.orientation.reduce((a, b) => a + b, 0) % 3).toBe(0);
});
test('stickers agree with independently known clockwise R rotation', async () => {
  const s = await apply(await solved(), 'R');
  const p = pieces(s).find((p) => p.piece === 'UFR')!;
  expect(p.position).toBe('URB');
  expect(p.stickers).toEqual({ white: 'B', green: 'U', red: 'R' });
});
test('reference mapping is a yaw conjugation', async () => {
  const s = await solved();
  for (const [front, rotation] of [
    ['F', ''],
    ['R', 'y'],
    ['B', 'y2'],
    ['L', "y'"],
  ]) {
    for (const skill of skills) {
      const mapped = await apply(s, mapAlg(skill.alg, front));
      const conjugated = await apply(s, `${rotation} ${skill.alg} ${inverse(rotation)}`);
      expect(hash(mapped)).toBe(hash(conjugated));
    }
  }
});
test('skill inverses and preservation fixtures in every frame', async () => {
  const s = await solved();
  for (const skill of skills) {
    for (const front of ['F', 'R', 'B', 'L']) {
      const alg = mapAlg(skill.alg, front),
        fixture = await apply(s, inverse(alg));
      expect(isSolved(await apply(fixture, alg))).toBe(true);
      if (skill.stages.some((x) => x.startsWith('top-'))) expect(facts(fixture).middle).toBe(true);
      if (skill.id.startsWith('edge-cycle')) expect(facts(fixture).cornersPlaced).toBe(true);
      if (skill.id.startsWith('middle-')) expect(facts(fixture).firstLayer).toBe(true);
    }
  }
});
test('input parsing and exact stage checks', async () => {
  expect(() => parseScramble('R x M')).toThrow();
  expect(parseScramble(" R  U' ")).toBe("R U'");
  expect(stage(await solved())).toBe('solved');
  expect(stage(await apply(await solved(), 'U'))).toBe('top-corners');
});
test('static direction reference agrees with cube mechanics for every face turn', async () => {
  const { turnDescription } = await import('../src/lib/cube');
  const s = await solved();
  for (const move of turns) {
    const after = pieces(await apply(s, move));
    const desc = turnDescription(move);
    const mapping = Object.fromEntries(
      [...desc.matchAll(/([UDFBRL])→([UDFBRL])/g)].map((m) => [m[1], m[2]]),
    );
    for (const p of pieces(s)) {
      const actual = after.find((x) => x.piece === p.piece)!;
      const expected = Object.fromEntries(
        Object.entries(p.stickers).map(([color, face]) => [
          color,
          p.position.includes(move[0]) ? mapping[face] || face : face,
        ]),
      );
      expect(actual.stickers).toEqual(expected);
    }
  }
});
test('reference observations relabel destinations and sticker directions consistently', async () => {
  const { focusedObservation, referenceObservation, colors } = await import('../src/lib/cube');
  const state = await apply(await solved(), 'R');
  const base = focusedObservation({ state, target: 'DR', stage: 'cross', history: [] });
  const ref = referenceObservation(base, 'R');
  expect(ref.frame.centers.F).toBe('red');
  expect(ref.target.requiredStickerDirections.red).toBe('F');
  expect(ref.target.requiredStickerDirections.yellow).toBe('D');
  for (const front of ['F', 'R', 'B', 'L']) {
    const r = referenceObservation(
      focusedObservation({ state: await solved(), target: 'DR', stage: 'cross', history: [] }),
      front,
    );
    expect(r.target.stickers).toEqual(r.target.requiredStickerDirections);
  }
});
test('documented corner, middle and last-layer cases match their algorithms', async () => {
  const s = await solved();
  const skill = (id: string) => skills.find((s) => s.id === id)!.alg;
  const f = async (id: string) => pieces(await apply(s, inverse(skill(id))));
  expect((await f('corner-insert')).find((p) => p.piece === 'DRF')?.stickers).toEqual({
    yellow: 'R',
    red: 'U',
    green: 'F',
  });
  expect((await f('middle-right')).find((p) => p.piece === 'FR')?.stickers).toEqual({
    green: 'F',
    red: 'U',
  });
  expect((await f('middle-left')).find((p) => p.piece === 'FL')?.stickers).toEqual({
    green: 'F',
    orange: 'U',
  });
  expect(
    (await f('orient-elbow'))
      .filter((p) => p.kind === 'edge' && p.position.startsWith('U') && p.stickers.white === 'U')
      .map((p) => p.position),
  ).toEqual(['UB', 'UL']);
  const t = pieces(await apply(s, skill('corner-permute'))).filter((p) => !p.solved);
  expect(t.map((p) => p.position)).toEqual(['UR', 'UL', 'UFR', 'URB']);
  const cycle = pieces(await apply(s, skill('edge-cycle')));
  expect(cycle.find((p) => p.piece === 'UF')?.position).toBe('UR');
  expect(cycle.find((p) => p.piece === 'UR')?.position).toBe('UL');
  expect(cycle.find((p) => p.piece === 'UL')?.position).toBe('UF');
});
test('daisy skills lift the intended yellow edge in their documented local cases', async () => {
  const fixtures: [string, string][] = [
    ['lift-bottom', ''],
    ['lift-middle-right', 'D R'],
    ['lift-middle-left', "D' L'"],
    ['flip-bottom-edge', 'D R F'],
    ['flip-top-edge', "D R F'"],
    ['flip-top-edge-left', "D R F'"],
  ];
  for (const [id, scramble] of fixtures) {
    const before = await apply(await solved(), scramble);
    const skill = skills.find((s) => s.id === id)!;
    const after = pieces(await apply(before, skill.alg)).find((p) => p.piece === 'DF')!;
    expect(after.stickers.yellow).toBe('U');
  }
  const daisy = await apply(await solved(), 'F2 R2 B2 L2');
  expect(facts(daisy).daisy).toBe(4);
  expect(stage(daisy)).toBe('cross');
  const partial = await apply(daisy, 'F2');
  expect(stage(partial, 'cross')).toBe('cross');
});
test('stage goals are unambiguous and reference coordinates use canonical slot names', async () => {
  const { focusedObservation, referenceObservation, names } = await import('../src/lib/cube');
  const s = await apply(await solved(), 'R');
  const o = focusedObservation({ state: s, target: 'DF', stage: 'daisy', history: [] });
  expect(o.target && typeof o.target === 'object' && o.target.requiredStickerDirections).toEqual({
    yellow: 'U',
  });
  for (const front of ['F', 'R', 'B', 'L']) {
    const r = referenceObservation(o, front);
    for (const p of [...r.stagePieces, ...r.otherPieces])
      expect([...names.EDGES, ...names.CORNERS]).toContain(p.position);
  }
});

test('Sune and inverse-Sune reference patterns are exact', async () => {
  for (const [id, expected] of [
    ['sune', { UFR: 'F', URB: 'R', UBL: 'B', ULF: 'U' }],
    ['antisune', { UFR: 'R', URB: 'U', UBL: 'L', ULF: 'F' }],
  ] as const) {
    const state = await apply(await solved(), inverse(skills.find((s) => s.id === id)!.alg));
    expect(
      Object.fromEntries(
        pieces(state)
          .filter((p) => p.kind === 'corner' && p.position.includes('U'))
          .map((p) => [p.position, p.stickers.white]),
      ),
    ).toEqual(expected);
  }
});

test('staging a sideways bottom daisy edge needs only one free slot', async () => {
  const before = await apply(await solved(), 'D R F');
  const after = await apply(before, skills.find((s) => s.id === 'stage-bottom-edge')!.alg);
  const p = pieces(after).find((p) => p.piece === 'DF')!;
  expect(p.position).toBe('FL');
  expect(p.stickers.yellow).toBe('F');
});
