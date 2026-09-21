import { apply, solved, inverse, pieces, mapAlg, hash, facts } from '../../src/lib/cube';
import { skills } from '../../src/lib/skills';
import { skillDecision } from '../../src/server/skill-policy';
import { fixtures as referenceFixtures } from './reference';
import type { JevRequest, Run } from '../../src/lib/types';
import type { Fixture } from './cases';
const skill = (id: string) => skills.find((s) => s.id === id)!.alg;
export const variants = {
  baseline: 'Current reference request',
  'slot-rule': 'Explicit current-slot mapping',
  'position-first': 'Read current slot then choose frame',
  'position-only': 'Choose frame from model-reported slot only',
};
export type Variant = keyof typeof variants;
const rule =
  'For this middle-edge EXTRACTION, use CURRENT position, not destination. Put the occupied slot at local FR. In the original fixed frame: current FR requires front F; current BR requires front R; current BL requires front B; current FL requires front L. Destination does not determine the extraction frame.';
export function observationRequest(base: JevRequest): JevRequest {
  return {
    model: base.model,
    state: {
      target: (base.state as any).referenceViews.F.target,
      frame: (base.state as any).referenceViews.F.centers,
    },
    questions: {
      currentSlot: {
        type: 'choice',
        instructions:
          'Which middle-layer slot is the target occupying NOW? Read target.position, not target.destination or target.piece. This view uses the original fixed frame.',
        criteria: {
          FR: 'Front-right slot',
          BR: 'Back-right slot',
          BL: 'Back-left slot',
          FL: 'Front-left slot',
        },
      },
    },
  };
}
export function wording(base: JevRequest, variant: Variant, reported?: string): JevRequest {
  const req = structuredClone(base);
  if (variant === 'baseline') return req;
  req.questions.reference.instructions = rule;
  if (variant === 'position-only')
    req.state = { intent: 'extract', modelReportedCurrentSlot: reported };
  else if (variant === 'position-first')
    req.state = { ...(req.state as any), modelReportedCurrentSlot: reported };
  if (variant === 'position-first' || variant === 'position-only')
    req.questions.reference.instructions +=
      ' The prior observation choice is in modelReportedCurrentSlot. Use that as the current slot.';
  // Keep option labels identical. The position-only arm must not leak the real
  // position through the original duplicated option descriptions.
  if (variant === 'position-only')
    req.questions.reference.criteria = {
      F: 'Original F becomes local front',
      R: 'Original R becomes local front',
      B: 'Original B becomes local front',
      L: 'Original L becomes local front',
    };
  return req;
}
export async function fixtures(
  options: { seedOffset?: number; excludedStates?: string[] } = {},
): Promise<Fixture[]> {
  const previous = await referenceFixtures();
  const seen = new Set([
    ...previous.map((f) => hash(f.run.state)),
    ...(options.excludedStates ?? []),
  ]);
  const result: Fixture[] = [];
  const slots = ['FR', 'BR', 'BL', 'FL'];
  const fronts = ['F', 'R', 'B', 'L'];
  for (const split of ['development', 'validation'] as const) {
    let seed = (split === 'development' ? 936871 : 437521) + (options.seedOffset ?? 0);
    const random = () => {
      seed ^= seed << 13;
      seed ^= seed >>> 17;
      seed ^= seed << 5;
      return (seed >>> 0) / 4294967296;
    };
    const counts = [0, 0, 0, 0];
    let attempts = 0;
    while (counts.reduce((a, b) => a + b, 0) < 20) {
      if (++attempts > 1000) throw new Error('Fixture generation exhausted');
      const known = split === 'development' && attempts === 1;
      let scramble = '';
      for (let i = 0, n = 2 + Math.floor(random() * 3); i < n; i++) {
        const a = skill(random() < 0.5 ? 'middle-right' : 'middle-left');
        scramble +=
          ' ' +
          mapAlg(random() < 0.5 ? a : inverse(a), fronts[Math.floor(random() * 4)]) +
          ' ' +
          ['U', "U'", 'U2'][Math.floor(random() * 3)];
      }
      if (known)
        scramble = previous.find((f) => f.id === 'development/middle-extract-R')!.run.scramble;
      scramble = scramble.trim();
      const state = await apply(await solved(), scramble);
      if (!facts(state).firstLayer) throw new Error('Construction disturbed first layer');
      if (seen.has(hash(state)) && !known) continue;
      const candidates = pieces(state).filter(
        (p) =>
          p.kind === 'edge' &&
          !/[UD]/.test(p.position + p.destination) &&
          p.position !== p.destination &&
          counts[slots.indexOf(p.position)] < 5,
      );
      if (!candidates.length) continue;
      const p = known
        ? candidates.find((p) => p.position === 'BR')!
        : candidates[Math.floor(random() * candidates.length)];
      if (!p) throw new Error('Missing historical target');
      const front = fronts[slots.indexOf(p.position)];
      const after = await apply(state, mapAlg(skill('middle-right'), front));
      if (
        !pieces(after)
          .find((q) => q.piece === p.piece)!
          .position.includes('U') ||
        !facts(after).firstLayer
      )
        throw new Error('Golden reference failed mechanical ejection check');
      const run: Run = {
        ...previous[0].run,
        id: '',
        createdAt: '',
        scramble,
        state,
        stage: 'middle-layer',
        target: null,
        version: 'extraction-reference-v1',
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
            return {
              model: req.model,
              usage: { input_tokens: 0, output_tokens: 0 },
              answers: Object.fromEntries(
                Object.entries(req.questions).map(([id, q]) => {
                  const choice = id === 'target' ? p.piece : 'extract';
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
      if (!request) throw new Error('No reference request');
      if ((request.state as any).referenceViews[front].target.position !== 'FR')
        throw new Error('Reference geometry disagrees');
      seen.add(hash(state));
      counts[slots.indexOf(p.position)]++;
      result.push({
        id: split + '/case-' + String(counts.reduce((a, b) => a + b, 0)).padStart(2, '0'),
        split,
        run,
        request,
        accepted: { reference: [front] },
        evidence: {
          piece: p,
          currentSlot: p.position,
          correctFront: front,
          historicalFailure: known,
          ejectionPreservesFirstLayer: true,
        },
      });
    }
  }
  return result;
}
