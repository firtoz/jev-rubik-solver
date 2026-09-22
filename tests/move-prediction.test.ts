import { test, expect } from 'bun:test';
import { fixtures } from '../scripts/request-eval/move-prediction';
import { apply, solved, pieces, inverse, hash, turns } from '../src/lib/cube';
test('prediction suite covers 20 unique states, every turn, both piece types and unaffected controls', async () => {
  const cases = await fixtures();
  expect(new Set(cases.map((c) => c.stateHash)).size).toBe(20);
  expect(new Set(cases.map((c) => (c.request.state as any).proposedTurn)).size).toBe(18);
  expect(cases.filter((c) => !c.affected).length).toBe(4);
  for (const c of cases) {
    const input = c.request.state as any;
    expect(turns).toContain(input.proposedTurn);
    const before = await apply(await solved(), c.scramble),
      after = await apply(before, input.proposedTurn);
    const target = pieces(after).find((p) => p.piece === input.target.piece)!;
    expect(c.expected.position).toBe(target.position);
    expect(c.expected.stickerDirection).toBe(target.stickers[input.trackedSticker]);
    expect(hash(await apply(after, inverse(input.proposedTurn)))).toBe(hash(before));
    expect(Object.keys(input).sort()).toEqual(['proposedTurn', 'target', 'trackedSticker']);
    expect(Object.keys(c.request.questions.position.criteria).length).toBe(
      input.target.kind === 'edge' ? 12 : 8,
    );
  }
});

import { requestFor, coordinate } from '../scripts/request-eval/geometric-prediction';
test('geometric variants supply current observations and preserve uncorrected model membership', async () => {
  const source = (await fixtures())[0].request;
  for (const variant of ['neutral', 'coordinates', 'decomposed']) {
    const request = requestFor(source, variant, 'yes');
    const input = request.state as any;
    expect(input.target.id).toBe('selected-piece');
    expect(input.target.piece).toBeUndefined();
    expect(input.target.destination).toBeUndefined();
    expect(input.previousModelAnswer.affectedByTurn).toBe('yes');
    expect(Object.keys(request.questions.position.criteria)).toHaveLength(12);
  }
  expect(coordinate('URB')).toEqual([1, 1, -1]);
});

import { vectorRequest } from '../scripts/request-eval/vector-prediction';
import { vectors } from '../scripts/request-eval/geometric-prediction';
test('generic rotation formula agrees with cube mechanics, without calculating outcomes in requests', async () => {
  for (const c of await fixtures()) {
    const req = vectorRequest(c.request, c.affected ? 'yes' : 'no');
    const s = req.state as any;
    const rotate = (v: number[]) => {
      if (!c.affected) return v;
      const a = s.a,
        d = a.reduce((n: number, x: number, i: number) => n + x * v[i], 0);
      const cross = [
        a[1] * v[2] - a[2] * v[1],
        a[2] * v[0] - a[0] * v[2],
        a[0] * v[1] - a[1] * v[0],
      ];
      return a.map((x: number, i: number) =>
        s.turn === 'half' ? 2 * x * d - v[i] : x * d + (s.turn === 'clockwise' ? -1 : 1) * cross[i],
      );
    };
    expect(rotate(s.center).map((x: number) => x || 0)).toEqual(coordinate(c.expected.position));
    expect(rotate(s.stickerNormal).map((x: number) => x || 0)).toEqual(
      vectors[c.expected.stickerDirection],
    );
    expect(Object.keys(req.questions).length).toBe(6);
  }
});

import { faceCell, gridRequest } from '../scripts/request-eval/grid-prediction';
test('face diagrams use a consistent outside view and never insert expected outcomes', async () => {
  const points: Record<string, number[]> = {
    top_left: [-1, 1],
    top_center: [0, 1],
    top_right: [1, 1],
    middle_left: [-1, 0],
    middle_right: [1, 0],
    bottom_left: [-1, -1],
    bottom_center: [0, -1],
    bottom_right: [1, -1],
  };
  for (const c of await fixtures()) {
    const input = c.request.state as any,
      face = input.proposedTurn[0];
    const req = gridRequest(c.request, 'no');
    expect((req.state as any).previousModelAnswer.affected).toBe('no');
    expect((req.state as any).markerBefore).toBe(faceCell(input.target.position, face));
    if (!c.affected) continue;
    const [x, y] = points[faceCell(input.target.position, face)];
    const output = input.proposedTurn.includes('2')
      ? [-x, -y]
      : input.proposedTurn.includes("'")
        ? [-y, x]
        : [y, -x];
    expect(output.map((v) => v || 0)).toEqual(points[faceCell(c.expected.position, face)]);
  }
});
