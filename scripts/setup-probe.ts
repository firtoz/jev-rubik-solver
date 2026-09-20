import { createRun, observation } from '../src/server/runner';
import { evaluate, MODEL } from '../src/server/jev';
import { inverse, setupDescription, referenceObservation } from '../src/lib/cube';
import { getRun, saveRun } from '../src/server/store';
const r = await createRun(inverse("F' U' F") + ' U', 'skills', 'probe');
r.target = 'DRF';
const view = referenceObservation(observation(r), 'F');
const result = await evaluate(
  r.id,
  {
    model: MODEL,
    state: { target: view.target, centers: view.frame.centers },
    questions: {
      setup: {
        type: 'choice',
        instructions:
          'The target corner belongs in DRF (bottom-right-front). Before insertion it must be at UFR (top-front-right), directly above that slot. Which U-layer rotation moves it from its current position to UFR? Use the position mappings provided. Choose none only if it is already at UFR.',
        criteria: Object.fromEntries(
          ['none', 'U', "U'", 'U2'].map((m) => [m, setupDescription(m)]),
        ),
      },
    },
  },
  AbortSignal.timeout(30000),
);
console.log(JSON.stringify(result, null, 2));
const end = getRun(r.id);
end.status = 'stopped';
end.reason = 'Setup capability probe';
saveRun(end);
