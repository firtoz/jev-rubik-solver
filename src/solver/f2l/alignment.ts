import type { JevRequest } from '../../lib/types';
const cycles = [
  ['UF', 'UL', 'UB', 'UR'],
  ['UFR', 'ULF', 'UBL', 'URB'],
];
export function request(source: string, destination: string): JevRequest {
  const name = (p: string) => p;
  // Static teaching material, identical for every input; never inspect source/destination to select an action.
  const criteria = {
    ...Object.fromEntries(
      [
        ['U', 1],
        ["U'", 3],
        ['U2', 2],
      ].map(([turn, offset]) => [
        turn,
        cycles
          .flatMap((c) =>
            c.map((p, i) => `Moves ${name(p)} to ${name(c[(i + Number(offset)) % 4])}.`),
          )
          .join(' '),
      ]),
    ),
    reconsider:
      'The current and required positions are identical, or no listed move connects them.',
  };
  return {
    model: 'jev-1.13.0',
    state: { currentPosition: name(source), requiredPosition: name(destination) },
    questions: {
      turn: {
        type: 'choice',
        instructions:
          'Choose one turn whose teaching lists the exact movement from currentPosition to requiredPosition. Match both endpoints. Each listed movement describes a single application of that turn. Do not take several quarter-turns when U2 reaches the destination directly.',
        criteria,
      },
    },
  };
}
