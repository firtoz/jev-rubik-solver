import { test, expect } from 'bun:test';
import { measuredSkillDecision } from '../src/server/measured-policy';
import { fixtures } from '../scripts/request-eval/cases';
import type { JevRequest } from '../src/lib/types';
test('measured policy routes model phase into the skill pipeline without correcting it', async () => {
  const f = (await fixtures()).find((f) => f.id === 'development/case-16')!;
  const run = { ...f.run, stage: 'cross' };
  const requests: JevRequest[] = [];
  const d = await measuredSkillDecision(
    run,
    'jev-1.13.0',
    async (req) => {
      requests.push(req);
      const answers = Object.fromEntries(
        Object.entries(req.questions).map(([id, q]) => {
          const choice = (
            {
              target: 'DR',
              phase: 'extract',
              reference: 'R',
              operation: 'cross-flip-bottom',
            } as any
          )[id];
          expect(choice in q.criteria).toBe(true);
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
  expect(d.skill).toBe('cross-flip-bottom');
  expect(d.front).toBe('R');
  expect(requests.map((r) => Object.keys(r.questions))).toEqual([
    ['target'],
    ['phase'],
    ['reference'],
    ['operation'],
  ]);
  expect(requests[0].state).not.toHaveProperty('scramble');
});

test('middle intention follows model answer even when it incorrectly says done', async () => {
  const f=(await fixtures())[0];
  const run={...f.run,stage:'middle-layer',target:null};
  const requests:JevRequest[]=[];
  await expect(measuredSkillDecision(run,'jev-1.13.0',async req=>{
    requests.push(req);
    const key=Object.keys(req.questions)[0];
    const choice=key==='target'?Object.keys(req.questions.target.criteria)[0]:'done';
    return {model:req.model,usage:{input_tokens:0,output_tokens:0},answers:{[key]:{type:'choice',choice,confidence:1,probabilities:{[choice]:1}}}};
  },[])).rejects.toThrow('selected completed target');
  expect(requests.map(r=>Object.keys(r.questions))).toEqual([['target'],['intention']]);
  expect(Object.keys(requests[1].state as object).sort()).toEqual(['currentLayer','sideStickersMatchingCenters','solved']);
});
