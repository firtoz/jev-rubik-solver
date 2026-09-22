// OFFLINE ONLY: this module may inspect outcomes to label tests; policy.ts must never import it.
import { apply, solved, pieces, facts, hash, turns } from '../../src/lib/cube';
import type { CubeData } from '../../src/lib/types';
import { observe, measuredChecks, aggregate, ids, fronts, actionMenu, executeSelection } from './policy';
export function expected(state: CubeData) {
  const o = observe(state), summary = aggregate(measuredChecks(o));
  const { petals, bottom } = summary.counts;
  const goal = bottom === 4 ? 'first-layer' : petals + bottom === 4 ? 'cross' : 'daisy';
  return { ...summary, goal,
    gatherTargets: ids.filter(id => summary.checks[`petal_${id}`] === 'no' && summary.checks[`bottom_${id}`] === 'no'),
    transferTargets: ids.filter(id => summary.checks[`petal_${id}`] === 'yes' && summary.checks[`bottom_${id}`] === 'no'),
  };
}
export function expectedSituation(state: CubeData, target: string) {
  const e = observe(state).edges.find(e => e.id === target)!;
  return {
    situation: e.stickers.yellow === 'U' ? 'petal' : e.position.includes('D') ? e.stickers.yellow === 'D' ? 'bottomDown' : 'bottomSide' : e.position.includes('U') ? 'topSide' : 'middle',
    reference: fronts.includes(e.stickers.yellow) ? e.stickers.yellow : [...e.position].find(f => fronts.includes(f))!,
  };
}
export async function acceptableAction(state: CubeData, goal: string, target: string, front: string, operation: string) {
  const alg = executeSelection(operation, front);
  if (!alg) return false;
  const after = await apply(state, alg), beforePieces = pieces(state), afterPieces = pieces(after);
  const oldTarget = beforePieces.find(p => p.piece === target && p.kind === 'edge')!;
  const newTarget = afterPieces.find(p => p.piece === target && p.kind === 'edge')!;
  const protectedBottom = beforePieces.filter(p => p.kind === 'edge' && p.piece.includes('D') && p.solved);
  if (protectedBottom.some(p => !afterPieces.find(a => a.piece === p.piece && a.kind === 'edge')!.solved)) return false;
  const aligned = (p: typeof oldTarget) => p.stickers.yellow === 'U' && Object.entries(p.stickers).some(([c,f]) => c !== 'yellow' && observe(state).frame.centers[f] === c);
  if (goal === 'cross') return newTarget.solved || (!aligned(oldTarget) && aligned(newTarget) && operation.startsWith('turn:'));
  if (goal !== 'daisy') return false;
  const protectedPetals = beforePieces.filter(p => p.kind === 'edge' && p.stickers.yellow === 'U');
  if (protectedPetals.some(p => afterPieces.find(a => a.piece === p.piece && a.kind === 'edge')!.stickers.yellow !== 'U')) return false;
  if (newTarget.stickers.yellow === 'U' && oldTarget.stickers.yellow !== 'U') return true;
  // Explicit preparation contract: stage a sideways U/D edge in the middle.
  if ((oldTarget.position.includes('U') || oldTarget.position.includes('D')) && fronts.includes(oldTarget.stickers.yellow) && !newTarget.position.includes('U') && !newTarget.position.includes('D')) return true;
  // U-only clearance must create a protected immediate lift for THIS target.
  if (operation.startsWith('turn:') && oldTarget.position === newTarget.position && oldTarget.stickers.yellow === newTarget.stickers.yellow) {
    const canLift = async (s: CubeData) => {
      for (const f of fronts) for (const [id] of Object.entries(actionMenu)) {
        if (!id.startsWith('none:')) continue;
        const ps = pieces(await apply(s, executeSelection(id, f)));
        if (ps.find(p => p.piece === target && p.kind === 'edge')!.stickers.yellow !== 'U') continue;
        if (protectedBottom.every(p => ps.find(a => a.piece === p.piece && a.kind === 'edge')!.solved) && protectedPetals.every(p => ps.find(a => a.piece === p.piece && a.kind === 'edge')!.stickers.yellow === 'U')) return true;
      }
      return false;
    };
    return !(await canLift(state)) && await canLift(after);
  }
  return false;
}
export async function labels(state: CubeData) {
  const e = expected(state);
  const targets = e.goal === 'daisy' ? e.gatherTargets : e.goal === 'cross' ? e.transferTargets : [];
  const actions: Record<string, string[]> = {};
  const situations: Record<string, ReturnType<typeof expectedSituation>> = {};
  for (const target of targets) {
    situations[target] = expectedSituation(state, target);
    actions[target] = [];
    for (const op of Object.keys(actionMenu)) if (await acceptableAction(state, e.goal, target, situations[target].reference, op)) actions[target].push(op);
  }
  return { ...e, situations, actions };
}
export type Fixture = { id: string; category: string; scramble: string; state: CubeData; stateHash: string; expected: Awaited<ReturnType<typeof labels>> };
export async function fixtures(split: 'development' | 'validation', excluded: string[] = []): Promise<Fixture[]> {
  let seed = split === 'development' ? 742691 : 167843;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed >>> 8; };
  const used = new Set(excluded), result: Fixture[] = [];
  const top = ['U', "U'", 'U2', "R U R' U R U2 R'", "F R U R' U' F'"];
  for (const [category, n] of [['zero',3],['one',3],['two-or-three',3],['full-daisy',3],['partial-transfer',3],['cross-complete',5]] as const) {
    let collected = 0;
    for (let attempt = 0; attempt < 4000 && collected < n; attempt++) {
      let scramble = Array.from({ length: 2 + random() % 5 }, () => top[random() % top.length]).join(' ');
      if (['zero','one','two-or-three'].includes(category)) scramble += ' ' + Array.from({ length: 2 + random() % 15 }, () => turns[random() % turns.length]).join(' ');
      else if (category === 'cross-complete') scramble += " R U R' U'";
      else {
        scramble += ' F2 R2 B2 L2';
        if (category === 'partial-transfer') scramble += ' ' + ['F2','R2 B2','L2 F2 R2'][random() % 3];
        scramble += ' ' + ['', 'U', "U'", 'U2'][random() % 4];
      }
      const state = await apply(await solved(), scramble), key = hash(state), e = expected(state);
      const actual = e.goal === 'first-layer' ? 'cross-complete' : e.counts.petals === 4 ? 'full-daisy' : e.goal === 'cross' ? 'partial-transfer' : e.counts.petals === 0 ? 'zero' : e.counts.petals === 1 ? 'one' : 'two-or-three';
      if (actual !== category || facts(state).firstLayer || used.has(key)) continue;
      const gold = await labels(state);
      // Gold goal/target labels must admit a move from the disclosed library.
      if (Object.values(gold.actions).some(a => !a.length)) continue;
      result.push({ id: `${split}-${result.length+1}`, category, scramble, state, stateHash: key, expected: gold });
      used.add(key); collected++;
    }
    if (collected !== n) throw new Error(`Fixture generation exhausted: ${category}`);
  }
  return result;
}
