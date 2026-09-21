import { apply, solved, inverse, pieces, names, mapAlg, hash, facts } from '../../src/lib/cube';
import { skills } from '../../src/lib/skills';
import { skillDecision } from '../../src/server/skill-policy';
import type { Run, JevRequest } from '../../src/lib/types';
import type { Fixture } from './cases';
const alg = (id: string) => skills.find((s) => s.id === id)!.alg;
const defs = [
  ['cross-align', 'cross', 'F2 U', 'DF', 'align'],
  ['cross-insert', 'cross', 'F2', 'DF', 'insert'],
  ['corner-align', 'first-layer', inverse(alg('corner-insert')) + ' U', 'DRF', 'align'],
  ['corner-insert', 'first-layer', inverse(alg('corner-insert')), 'DRF', 'insert'],
  [
    'corner-extract',
    'first-layer',
    alg('right-trigger') + ' ' + alg('right-trigger'),
    'DRF',
    'extract',
  ],
  ['middle-align', 'middle-layer', inverse(alg('middle-right')) + ' U', 'FR', 'align'],
  ['middle-insert', 'middle-layer', inverse(alg('middle-right')), 'FR', 'insert'],
  [
    'middle-extract',
    'middle-layer',
    inverse(alg('middle-left')) + ' ' + alg('middle-right'),
    'FL',
    'extract',
  ],
  ['white-line', 'top-cross', inverse(alg('orient-edges')), 'whole', 'line'],
  ['white-corners', 'top-orientation', inverse(alg('sune')), 'whole', 'orient'],
  ['corner-permute', 'top-corners', inverse(alg('corner-permute')), 'whole', 'permute'],
  ['edge-cycle', 'top-edges', inverse(alg('edge-cycle')), 'whole', 'permute'],
];
export async function fixtures(): Promise<Fixture[]> {
  const fs: Fixture[] = [];
  for (const split of ['development', 'validation'] as const) {
    const yaws = split === 'development' ? ['F', 'R'] : ['B', 'L'];
    for (let i = 0; i < 20; i++) {
      const [id, stage, base, targetId, intent] = defs[i % 12],
        yaw = yaws[i < 12 ? 0 : 1];
      const scramble = mapAlg(base, yaw),
        state = await apply(await solved(), scramble);
      const target =
        targetId === 'whole'
          ? 'whole'
          : [...names.EDGES, ...names.CORNERS].find(
              (n) =>
                n.length === targetId.length &&
                [...targetId].map((f) => mapAlg(f, yaw)).every((f) => n.includes(f)),
            )!;
      const run: Run = {
        id: '',
        createdAt: '',
        policy: 'skills',
        scramble,
        state,
        status: 'stopped',
        revision: 0,
        stage,
        target: null,
        history: [],
        requests: 0,
        turns: 0,
        activeMs: 0,
        tokens: 0,
        cost: 0,
        reason: 'Isolated operation evaluation',
        version: 'operation-v1',
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
            if (req.questions.operation) {
              request = req;
              throw stop;
            }
            return {
              model: req.model,
              usage: { input_tokens: 0, output_tokens: 0 },
              answers: Object.fromEntries(
                Object.entries(req.questions).map(([q, x]) => {
                  const choice = q === 'target' ? target : q === 'reference' ? yaw : intent;
                  return [
                    q,
                    {
                      type: 'choice' as const,
                      choice,
                      confidence: 1,
                      probabilities: Object.fromEntries(
                        Object.keys(x.criteria).map((k) => [k, k === choice ? 1 : 0]),
                      ),
                    },
                  ];
                }),
              ),
            };
          },
          [],
        );
      } catch (e) {
        if (e !== stop) throw e;
      }
      if (!request) throw new Error('Missing operation request');
      // Offline scoring: evaluate every offered action against the local objective,
      // accepting all successes. No simulated result enters the request or policy.
      const beforePieces = pieces(state),
        accepted: string[] = [];
      const evidence: any[] = [];
      for (const option of Object.keys(request.questions.operation.criteria)) {
        if (option === 'reconsider') continue;
        const sequence = skills.find((s) => s.id === option)?.alg ?? option;
        const after = await apply(state, mapAlg(sequence, yaw)),
          ps = pieces(after),
          p = ps.find((p) => p.piece === target),
          f = facts(after);
        const preserve = beforePieces
          .filter((p) => p.kind === 'edge' && p.destination.includes('D') && p.solved)
          .every((p) => ps.find((q) => q.piece === p.piece)!.solved);
        let ok = false;
        if (stage === 'cross')
          ok =
            preserve &&
            (intent === 'align'
              ? p!.stickers.yellow === 'U' && p!.position === 'U' + p!.destination.slice(1)
              : p!.solved);
        if (stage === 'first-layer')
          ok =
            f.cross &&
            (intent === 'align'
              ? p!.position ===
                'U' + ({ DRF: 'FR', DFL: 'LF', DLB: 'BL', DBR: 'RB' } as any)[p!.destination]
              : intent === 'extract'
                ? p!.position.includes('U')
                : p!.solved);
        if (stage === 'middle-layer')
          ok =
            f.firstLayer &&
            (intent === 'extract'
              ? p!.position.includes('U')
              : intent === 'insert'
                ? p!.solved
                : p!.position === 'U' + yaw &&
                  Object.entries(p!.stickers).some(
                    ([c, d]) =>
                      d === yaw &&
                      c === ({ F: 'green', R: 'red', B: 'blue', L: 'orange' } as any)[yaw],
                  ));
        if (stage === 'top-cross') ok = f.middle && f.topCross;
        if (stage === 'top-orientation') ok = f.middle && f.topCross && f.topOriented;
        if (stage === 'top-corners')
          ok = f.middle && f.topCross && f.topOriented && f.cornersPlaced;
        if (stage === 'top-edges') ok = f.solved;
        if (ok) accepted.push(option);
        evidence.push({ option, accepted: ok, afterFacts: f, target: p });
      }
      if (!accepted.length) throw new Error('No valid option ' + id + '/' + yaw);
      fs.push({
        id: split + '/' + id + '-' + yaw,
        split,
        run,
        request,
        accepted: { operation: accepted },
        evidence: { target, intent, front: yaw, options: evidence },
      });
    }
  }
  if (new Set(fs.map((f) => hash(f.run.state))).size !== 40) throw new Error('Duplicate fixtures');
  return fs;
}
export const variants = {
  'extraction-local': 'Current extraction target only',
  'extraction-rule': 'Explicit extraction slot rule',
  baseline: 'Current request',
  preconditions: 'Check operation preconditions',
  local: 'Local target first',
  concise: 'Concise instruction',
};
export type Variant = keyof typeof variants;
export function wording(base: JevRequest, variant: Variant): JevRequest {
  const r = structuredClone(base);
  if (variant === 'baseline') return r;
  const q = r.questions.operation;
  if (
    variant === 'extraction-local' &&
    (r.state as any).stage === 'middle-layer' &&
    (r.state as any).chosenIntention === 'extract'
  ) {
    const x = r.state as any;
    r.state = {
      frame: x.frame,
      target: { position: x.target.position, stickers: x.target.stickers },
      chosenIntention: 'extract',
      goal: 'Eject the trapped target into the U layer while preserving the solved bottom layer.',
    };
    q.instructions =
      'Choose one insertion algorithm that ejects the trapped target from its CURRENT middle slot. In these local coordinates FR requires middle-right; FL requires middle-left. Do not use destination or incoming edge colors to choose extraction. U turns do not move a middle-layer target.';
  }
  if (variant === 'extraction-rule')
    q.instructions =
      String(q.instructions) +
      ' When chosenIntention is EXTRACT, insert a replacement top edge into the CURRENT occupied slot to eject the trapped target. In these local coordinates, FR uses middle-right and FL uses middle-left. The target destination and the incoming replacement edge colors do not select the extraction side; those color conditions apply to INSERT. Preserve the solved bottom layer.';
  if (variant === 'preconditions')
    q.instructions =
      String(q.instructions) +
      ' Compare the target CURRENT position and observed sticker directions with each option’s stated starting conditions. Choose a skill only when those starting conditions hold. A final destination is not the current position. For a setup, track the target through the static U cycles. Preserve completed lower pieces after the whole skill.';
  if (variant === 'local')
    r.state = { ...(r.state as any), stagePieces: undefined, completed: undefined };
  if (variant === 'concise')
    q.instructions =
      'Choose ONE operation fulfilling chosenIntention for the observed target or layer pattern. Use current positions and sticker directions in this reference frame. Match the starting conditions in the option descriptions. A setup moves the target into position; insertion places it at home; extraction lifts a trapped piece. Preserve completed lower layers after the full operation.';
  return r;
}

export async function targetedFixtures(): Promise<Fixture[]> {
  const { fixtures: make } = await import('./extraction');
  const old = await make();
  const cases = await make({
    seedOffset: 76513,
    excludedStates: old.map((f) => hash(f.run.state)),
  });
  for (const f of cases) {
    const target = (f.evidence as any).piece.piece,
      front = f.accepted.reference[0];
    let request!: JevRequest;
    const stop = new Error('captured');
    try {
      await skillDecision(
        f.run,
        'jev-1.13.0',
        async (req) => {
          if (req.questions.operation) {
            request = req;
            throw stop;
          }
          return {
            model: req.model,
            usage: { input_tokens: 0, output_tokens: 0 },
            answers: Object.fromEntries(
              Object.entries(req.questions).map(([id, q]) => {
                const choice = id === 'target' ? target : id === 'reference' ? front : 'extract';
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
            ),
          };
        },
        [],
      );
    } catch (e) {
      if (e !== stop) throw e;
    }
    const accepted: string[] = [];
    for (const option of Object.keys(request.questions.operation.criteria)) {
      if (option === 'reconsider') continue;
      const after = await apply(
        f.run.state,
        mapAlg(skills.find((s) => s.id === option)?.alg ?? option, front),
      );
      if (
        pieces(after)
          .find((p) => p.piece === target)!
          .position.includes('U') &&
        facts(after).firstLayer
      )
        accepted.push(option);
    }
    if (!accepted.length) throw new Error('No target extraction');
    f.request = request;
    f.accepted = { operation: accepted };
    f.evidence = { ...(f.evidence as any), target, front, accepted };
  }
  return cases;
}
