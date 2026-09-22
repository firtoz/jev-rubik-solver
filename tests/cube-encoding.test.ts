import { test, expect } from 'bun:test';
import { readFileSync } from 'node:fs';
import { netStickers } from '../src/lib/cube-encoding';
import { solved, apply, pieces, colors } from '../src/lib/cube';

test('unfolded face positions agree with piece sticker directions', async () => {
  const solvedState = await solved();
  for (const [face, stickers] of Object.entries(netStickers(solvedState))) {
    expect(stickers.every(s => s.color === colors[face])).toBe(true);
  }
  const recording = JSON.parse(readFileSync('public/recordings/brain-v3-flow.json', 'utf8'));
  let state = await apply(solvedState, recording.previewSetup);
  for (const step of recording.steps) {
    expect(state).toEqual(step.before);
    const net = netStickers(state), occurrences: Record<string, number> = {};
    const counts: Record<string, number> = {};
    for (const [face, stickers] of Object.entries(net)) {
      expect(stickers.length).toBe(9);
      for (const sticker of stickers) {
        expect(sticker.position.includes(face)).toBe(true);
        counts[sticker.color] = (counts[sticker.color] || 0) + 1;
        occurrences[sticker.position] = (occurrences[sticker.position] || 0) + 1;
      }
    }
    expect(Object.values(counts).sort()).toEqual([9,9,9,9,9,9]);
    for (const p of pieces(state)) expect(occurrences[p.position]).toBe(p.kind === 'edge' ? 2 : 3);
    state = await apply(state, step.alg);
    expect(state).toEqual(step.after);
  }
});
