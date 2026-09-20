import { apply, solved, inverse, pieces, names, mapAlg, hash, facts } from '../../src/lib/cube';
import { skills } from '../../src/lib/skills';
import { skillDecision } from '../../src/server/skill-policy';
import type { Run, JevRequest } from '../../src/lib/types';
import type { Fixture } from './cases';
const alg = (id: string) => skills.find((s) => s.id === id)!.alg;
const specs = [
  { id: 'daisy-side', stage: 'daisy', scramble: 'F', target: 'DF', intent: 'lift' },
  { id: 'cross-align', stage: 'cross', scramble: 'F2 U', target: 'DF', intent: 'align' },
  {
    id: 'corner-insert',
    stage: 'first-layer',
    scramble: inverse(alg('corner-insert')),
    target: 'DRF',
    intent: 'insert',
  },
  {
    id: 'corner-extract',
    stage: 'first-layer',
    scramble: alg('right-trigger') + ' ' + alg('right-trigger'),
    target: 'DRF',
    intent: 'extract',
  },
  {
    id: 'middle-insert',
    stage: 'middle-layer',
    scramble: inverse(alg('middle-right')),
    target: 'FR',
    intent: 'insert',
  },
  {
    id: 'middle-extract',
    stage: 'middle-layer',
    scramble: inverse(alg('middle-left')) + ' ' + alg('middle-right'),
    target: 'FL',
    intent: 'extract',
  },
  {
    id: 'white-line',
    stage: 'top-cross',
    scramble: inverse(alg('orient-edges')),
    target: 'whole',
    intent: 'line',
  },
  {
    id: 'white-corners',
    stage: 'top-orientation',
    scramble: inverse(alg('sune')),
    target: 'whole',
    intent: 'orient',
  },
  {
    id: 'corner-pair',
    stage: 'top-corners',
    scramble: inverse(alg('corner-permute')),
    target: 'whole',
    intent: 'permute',
  },
  {
    id: 'edge-cycle',
    stage: 'top-edges',
    scramble: inverse(alg('edge-cycle')),
    target: 'whole',
    intent: 'permute',
  },
];
// Offline geometry labels only. No correct frame is computed by the live policy.
export function accepts(stage: string, intent: string, v: any): boolean {
  const p = v.target;
  switch (stage) {
    case 'daisy':
      return p.stickers.yellow === 'F' || (p.stickers.yellow === 'D' && p.position === 'DF');
    case 'cross':
      return p.destination === 'DF';
    case 'first-layer':
      return (intent === 'extract' ? p.position : p.destination) === 'DRF';
    case 'middle-layer':
      return intent === 'extract'
        ? p.position === 'FR'
        : p.sideFacingStickers[0].color === v.centers.F;
    case 'top-cross':
      return v.whiteUpPositions.includes('UL') && v.whiteUpPositions.includes('UR');
    case 'top-orientation':
      return (
        (v.whiteUpPositions.includes('ULF') &&
          v.stagePieces.find((p: any) => p.position === 'UFR').stickers.white === 'F') ||
        (v.whiteUpPositions.includes('URB') &&
          v.stagePieces.find((p: any) => p.position === 'UFR').stickers.white === 'R')
      );
    case 'top-corners':
      return v.sideRows.L.length === 2 && v.sideRows.L[0].color === v.sideRows.L[1].color;
    case 'top-edges':
      return v.stagePieces.some((p: any) => p.position === 'UB' && p.destination === 'UB');
    default:
      throw new Error('Unknown stage');
  }
}
export async function fixtures(): Promise<Fixture[]> {
  const result: Fixture[] = [];
  for (const split of ['development', 'validation'] as const)
    for (const yaw of split === 'development' ? ['F', 'R'] : ['B', 'L'])
      for (const spec of specs) {
        const scramble = mapAlg(spec.scramble, yaw),
          state = await apply(await solved(), scramble);
        const faces = spec.target === 'whole' ? [] : [...spec.target].map((f) => mapAlg(f, yaw));
        const target =
          spec.target === 'whole'
            ? 'whole'
            : [...names.EDGES, ...names.CORNERS].find(
                (n) => n.length === faces.length && [...n].every((f) => faces.includes(f)),
              )!;
        const p = pieces(state).find((p) => p.piece === target);
        if (spec.intent === 'extract' && (!p || p.solved || p.position.includes('U')))
          throw new Error('Invalid extraction fixture ' + spec.id);
        if (
          spec.id === 'cross-align' &&
          !(p?.stickers.yellow === 'U' && p.position !== 'U' + p.destination.slice(1))
        )
          throw new Error('Invalid alignment fixture');
        if (spec.id === 'middle-insert' && !p?.position.includes('U'))
          throw new Error('Invalid middle insertion');
        const run: Run = {
          id: '',
          createdAt: '',
          policy: 'skills',
          scramble,
          state,
          stage: spec.stage,
          target: null,
          history: [],
          revision: 0,
          requests: 0,
          turns: 0,
          tokens: 0,
          cost: 0,
          activeMs: 0,
          status: 'stopped',
          reason: 'Isolated reference selection',
          version: 'reference-eval-v1',
          split: 'probe',
          benchmarkId: null,
        };
        let request!: JevRequest;
        const stop = new Error('captured');
        try {
          await skillDecision(
            run,
            'jev-1.13.0',
            async (req) => {
              if (req.questions.reference) {
                request = req;
                throw stop;
              }
              const answers = Object.fromEntries(
                Object.entries(req.questions).map(([id, q]) => {
                  const choice = id === 'target' ? target : spec.intent;
                  if (!(choice in q.criteria)) throw new Error('Invalid supplied intent');
                  return [
                    id,
                    {
                      type: 'choice' as const,
                      choice,
                      confidence: 1,
                      probabilities: Object.fromEntries(
                        Object.keys(q.criteria).map((k) => [k, k === choice ? 1 : 0]),
                      ),
                    },
                  ];
                }),
              );
              return { model: req.model, answers, usage: { input_tokens: 0, output_tokens: 0 } };
            },
            [],
          );
        } catch (e) {
          if (e !== stop) throw e;
        }
        if (!request) throw new Error('Missing request');
        const views = (request.state as any).referenceViews;
        const allowed = Object.entries(views)
          .filter(([, v]) => accepts(spec.stage, spec.intent, v))
          .map(([f]) => f);
        if (!allowed.length) throw new Error('No accepted frame ' + spec.id);
        // Independently verify last-layer labels using the documented algorithms.
        for (const front of allowed) {
          const ids =
            spec.stage === 'top-cross'
              ? ['orient-edges']
              : spec.stage === 'top-orientation'
                ? ['sune', 'antisune']
                : spec.stage === 'top-corners'
                  ? ['corner-permute']
                  : spec.stage === 'top-edges'
                    ? ['edge-cycle']
                    : [];
          if (ids.length) {
            let valid = false;
            for (const id of ids) {
              const f = facts(await apply(state, mapAlg(alg(id), front)));
              if (
                spec.stage === 'top-cross'
                  ? f.middle && f.topCross
                  : spec.stage === 'top-orientation'
                    ? f.middle && f.topCross && f.topOriented
                    : f.solved
              )
                valid = true;
            }
            if (!valid)
              throw new Error('Mechanical frame verification failed ' + spec.id + '/' + front);
          }
        }
        result.push({
          id: split + '/' + spec.id + '-' + yaw,
          split,
          run,
          request,
          accepted: { reference: allowed },
          evidence: { spec, yaw, target, intent: spec.intent },
        });
      }
  if (new Set(result.map((f) => hash(f.run.state))).size !== 40)
    throw new Error('Duplicate states');
  return result;
}
export const variants = {
  baseline: 'Current request',
  checklist: 'Explicit field checks',
  concise: 'Short options without duplicated observations',
  neutral: 'Neutral option names plus explicit checks',
};
export type Variant = keyof typeof variants;
export function wording(base: JevRequest, variant: Variant): JevRequest {
  const req = structuredClone(base);
  if (variant === 'baseline') return req;
  const q = req.questions.reference;
  if (variant === 'checklist' || variant === 'neutral')
    q.instructions =
      String(q.instructions) +
      ' Evaluate each candidate view against the stated requirement using its LOCAL position, destination, observed stickers, and center colors. CURRENT position and DESTINATION are different fields. Do not choose by the permanent piece ID or by the original front name. A reference only renames coordinates; it does not rotate the cube. Multiple candidates can be valid; choose any valid one.';
  if (variant === 'concise' || variant === 'neutral')
    q.criteria = Object.fromEntries(
      ['F', 'R', 'B', 'L'].map((f) => [
        f,
        `Use referenceViews.${f}. All subsequent moves use that view’s local coordinates.`,
      ]),
    );
  return req;
}
