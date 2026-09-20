import { test, expect } from 'bun:test';
import { fixtures } from '../scripts/request-eval/cases';
import {
  observationRequest,
  decisionRequest,
  expectedFacts,
} from '../scripts/request-eval/recognition';
test('recognition asks for observations and passes actual model answers without correcting them', async () => {
  const f = (await fixtures())[0];
  const target = 'DF';
  const observed = observationRequest(f.request, target, 'facts-first');
  expect(Object.keys(observed.questions)).toEqual([
    'yellowDirection',
    'layer',
    'solved',
    'aboveHome',
  ]);
  expect(observed.state).not.toHaveProperty('accepted');
  expect(observed.state).not.toHaveProperty('scramble');
  expect(expectedFacts(f.request, target).yellowDirection).not.toBe('U');
  const deliberatelyWrong = { yellowDirection: 'U', layer: 'top', solved: 'no', aboveHome: 'yes' };
  const req = decisionRequest(f.request, target, 'facts-only', deliberatelyWrong);
  expect((req.state as any).modelReportedObservations).toEqual(deliberatelyWrong);
  expect(req.state).not.toHaveProperty('target');
  expect(req.state).not.toHaveProperty('stagePieces');
  expect(req.questions.intention.criteria).toEqual(f.request.questions.intent_DF.criteria);
  expect(Object.keys(observationRequest(f.request, target, 'direction-first').questions)).toEqual([
    'yellowDirection',
  ]);
});

test('wording-only control adds the same reminder without a preceding observation call', async () => {
  const f = (await fixtures())[0];
  const base = decisionRequest(f.request, 'DF', 'direct');
  const cue = decisionRequest(f.request, 'DF', 'direct-cue');
  expect(cue.state).toEqual(base.state);
  expect(cue.state).not.toHaveProperty('modelReportedObservations');
  expect(String(cue.questions.intention.instructions)).toContain('yellow facing sideways');
});
