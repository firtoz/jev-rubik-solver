import { apply, solved, pieces, hash } from '../../src/lib/cube';
import { skillDecision } from '../../src/server/skill-policy';
import { getRun, events } from '../../src/server/store';
import { fixtures as oldFixtures, type Fixture } from './cases';
import type { JevRequest, Run } from '../../src/lib/types';
export const variants = {
  combined: 'Current combined request',
  'split-full': 'Separate questions, same observation',
  'split-focused': 'Separate questions, selected-piece observation',
  'split-checklist': 'Selected-piece observation and ordered checks',
};
export type Variant = keyof typeof variants;
export function targetRequest(base: JevRequest): JevRequest {
  return {
    ...structuredClone(base),
    questions: { target: structuredClone(base.questions.target) },
  };
}
export function intentionRequest(base: JevRequest, target: string, variant: Variant): JevRequest {
  const state = base.state as any;
  const piece = state.stagePieces.find((p: any) => p.piece === target);
  if (!piece || !base.questions['intent_' + target]) throw new Error('Invalid selected target');
  if (variant === 'split-full')
    return {
      ...structuredClone(base),
      questions: { intention: structuredClone(base.questions['intent_' + target]) },
    };
  return {
    model: base.model,
    state: {
      frame: state.frame,
      stage: state.stage,
      goal: state.goal,
      target: piece,
      recentActions: state.recentActions,
      previouslyTriedFromThisState: state.previouslyTriedFromThisState,
    },
    questions: {
      intention: {
        type: 'choice',
        criteria: structuredClone(base.questions['intent_' + target].criteria),
        instructions:
          variant === 'split-checklist'
            ? 'Classify only target. Check in order: solved=true means done. Otherwise, yellow not pointing U or target not in U layer means extract. Otherwise, current position equal to the U slot above destination means insert; different means align. DF→UF, DR→UR, DB→UB, DL→UL. Read observed stickers, not required directions. No move is being selected yet.'
            : 'Choose the immediate intention for target. Read its current position and observed stickers, not its permanent identity or desired sticker directions. A yellow-up top edge needs alignment above its destination before transfer down; a sideways or trapped yellow edge needs lifting/reorientation; a correctly solved bottom edge is done. Choose an intention, not a move.',
      },
    },
  };
}
export async function fixtures(
  options: { validationSeed?: number; excludeValidation?: string[] } = {},
): Promise<Fixture[]> {
  const seen = new Set((await oldFixtures()).map((f) => hash(f.run.state)));
  const result: Fixture[] = [];
  for (const h of options.excludeValidation ?? []) seen.add(h);
  const source = getRun('419c33ae-ded2-49c1-bf18-f9e4842004b0');
  const actions = events(source.id).filter((e) => e.kind === 'action');
  for (const split of ['development', 'validation'] as const) {
    let seed = split === 'development' ? 819237 : (options.validationSeed ?? 637291);
    const random = () => {
      seed ^= seed << 13;
      seed ^= seed >>> 17;
      seed ^= seed << 5;
      return (seed >>> 0) / 4294967296;
    };
    const sequence = (n: number) => {
      const a: string[] = [];
      while (a.length < n) {
        const f = 'UDFBRL'[Math.floor(random() * 6)];
        if (a.at(-1)?.[0] !== f) a.push(f + ['', "'", '2'][Math.floor(random() * 3)]);
      }
      return a.join(' ');
    };
    let count = 0;
    while (count < 20) {
      let scramble = sequence(count < 10 ? 5 : 10);
      let history = count % 2 ? [sequence(1), sequence(1)] : [];
      let state = await apply(await solved(), [scramble, ...history].join(' '));
      let target: string | null = history.length ? ['DF', 'DR', 'DB', 'DL'][count % 4] : null;
      // One explicitly retired development failure with its actual solve context.
      // This is the only permitted overlap with earlier fixtures.
      if (split === 'development' && count === 0) {
        scramble = source.scramble;
        history = source.history.slice(0, 1);
        state = actions[1].payload.before;
        target = actions[0].payload.target;
      }
      const edges = pieces(state).filter((p) => p.kind === 'edge' && p.destination.includes('D'));
      if (
        !edges.some((p) => !p.solved) ||
        (seen.has(hash(state)) && !(split === 'development' && count === 0))
      )
        continue;
      seen.add(hash(state));
      const accepted: Record<string, string[]> = {
        target: edges.filter((p) => !p.solved).map((p) => p.piece),
      };
      for (const p of edges) {
        const label = p.solved
          ? 'done'
          : p.position.includes('U') && p.stickers.yellow === 'U'
            ? p.position === 'U' + p.destination.slice(1)
              ? 'insert'
              : 'align'
            : 'extract';
        accepted['intent_' + p.piece] = [label];
        if (label === 'insert' || label === 'align') {
          let valid = false;
          for (const setup of label === 'insert' ? [''] : ['U', "U'", 'U2'])
            if (
              pieces(await apply(state, [setup, p.destination[1] + '2'].join(' '))).find(
                (q) => q.piece === p.piece,
              )!.solved
            )
              valid = true;
          if (!valid) throw new Error('Invalid golden label');
        }
      }
      const run: Run = {
        ...source,
        id: '',
        createdAt: '',
        scramble,
        state,
        target,
        history,
        status: 'stopped',
        revision: 0,
        stage: 'cross',
        requests: 0,
        tokens: 0,
        cost: 0,
        turns: 0,
        activeMs: 0,
        reason: 'Isolated assessment experiment',
        version: 'separate-assessment-v1',
        split: 'probe',
        benchmarkId: null,
      };
      let request!: JevRequest;
      const stop = new Error('captured');
      try {
        await skillDecision(
          run,
          'jev-1.13.0',
          async (r) => {
            request = r;
            throw stop;
          },
          [],
        );
      } catch (e) {
        if (e !== stop) throw e;
      }
      result.push({
        id: split + '/case-' + String(++count).padStart(2, '0'),
        split,
        run,
        request,
        accepted,
        evidence: { edges, context: history.length ? 'actual applied actions' : 'fresh state' },
      });
    }
  }
  if (new Set(result.map((f) => hash(f.run.state))).size !== 40) throw new Error('Duplicate cases');
  return result;
}
