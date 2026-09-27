import type { Ask } from './controller';
import { routines } from './reference';
import type { CubeData } from '../../lib/types';
type View = {
  corner: {
    position: string;
    downColorDirection: string;
    frontColorDirection: string;
    rightColorDirection: string;
  };
  edge: { position: string; frontColorDirection: string; rightColorDirection: string };
};
const groups = [...new Set(routines.map((r) => r.group))];
// Same isolated grouped requests, receiving the existing controller's local observations.
export async function choose(view: View, ask: Ask) {
  const group = await ask({
    model: 'jev-1.13.0',
    state: { corner: view.corner },
    questions: {
      group: {
        type: 'choice',
        instructions:
          'Recognise the corner part of this learned F2L case. Match CURRENT corner.position and downColorDirection to a reference group. Down-color means the sticker color that belongs on D, even when it currently points elsewhere.',
        criteria: Object.fromEntries(
          groups.map((g) => {
            const [p, d] = g.split('-');
            return [g, `corner.position=${p} AND corner.downColorDirection=${d}.`];
          }),
        ),
      },
    },
  });
  const selected = routines.filter((r) => r.group === group.answers.group.choice);
  return ask({
    model: 'jev-1.13.0',
    state: {
      corner: view.corner,
      edge: view.edge,
      frame: 'Local front F, right R, down D. Target pair belongs at DRF corner and FR edge.',
    },
    questions: {
      routine: {
        type: 'choice',
        instructions:
          'Choose a learned F2L routine whose reference illustration matches BOTH observed pieces: their current positions and sticker directions. Read current position, not the destination slot. These routines solve this corner and edge together, preserving the cross and other three pairs. Do not simulate candidate outcomes. If no reference matches choose reconsider.',
        criteria: {
          ...Object.fromEntries(selected.map((r) => [r.id, r.description])),
          reconsider: 'No listed illustration matches both pieces.',
        },
      },
    },
  });
}
