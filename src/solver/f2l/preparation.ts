import type { JevRequest } from '../../lib/types';
import type { Ask, view } from './controller';

// Route exclusively on JEV answers. Positions are observations, never branch conditions.
export async function prepare(pair: ReturnType<typeof view>, ask: Ask) {
  const questions: {
    state: Record<string, string>;
    instructions: string;
    criteria: Record<string, string>;
  }[] = [
    {
      state: { cornerPosition: pair.corner.position },
      instructions:
        'Inspect the target corner in the local frame. Its home is DRF. Decide whether it must be lifted out of another bottom slot before preparing the pair.',
      criteria: {
        'extract-corner': 'The corner is in DBR, DLB or DFL.',
        continue: 'The corner is in UFR, URB, UBL, ULF or DRF.',
      },
    },
    {
      state: { edgePosition: pair.edge.position },
      instructions:
        'The preceding decision allowed us to inspect the edge. Its home is FR. Decide whether it must be lifted out of another middle slot.',
      criteria: {
        'extract-edge': 'The edge is in BR, BL or FL.',
        continue: 'The edge is in UF, UR, UB, UL or FR.',
      },
    },
    {
      state: { cornerPosition: pair.corner.position },
      instructions:
        'Extraction checks are finished. Decide whether the target corner needs an upper-layer rotation to reach the routine reference.',
      criteria: {
        'align-corner': 'The corner is in URB, UBL or ULF.',
        continue: 'The corner is in UFR or DRF.',
      },
    },
    {
      state: { cornerPosition: pair.corner.position, edgePosition: pair.edge.position },
      instructions:
        'Choose the final preparation. A corner at UFR accepts any upper edge or FR. A corner at DRF requires the edge at UF or FR.',
      criteria: {
        'align-edge': 'Corner is DRF and edge is UR, UB or UL.',
        routine:
          'Corner is UFR with edge UF, UR, UB, UL or FR; or corner is DRF with edge UF or FR.',
      },
    },
  ];
  const decisions: string[] = [];
  for (const q of questions) {
    const request: JevRequest = {
      model: 'jev-1.13.0',
      state: { ...q.state, precedingDecisions: [...decisions] },
      questions: {
        preparation: {
          type: 'choice',
          instructions: q.instructions,
          criteria: {
            ...q.criteria,
            reconsider: 'The observed position is outside the listed alternatives.',
          } as Record<string, string>,
        },
      },
    };
    const response = await ask(request),
      choice = response.answers.preparation.choice;
    if (choice !== 'continue') return response;
    decisions.push(choice);
  }
  throw Error('No terminal preparation decision');
}
