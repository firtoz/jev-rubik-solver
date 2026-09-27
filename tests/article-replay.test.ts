import { describe, test, expect } from 'bun:test';
import { actionSchedule, actionFrame } from '../src/lib/article-replay';
import requests from '../src/lib/article-request-timings.json';
import recordings from '../src/lib/article-matched-recordings.json';
describe('article request and action playback', () => {
  test('never animates an action before its decision is recorded', () => {
    const schedule = actionSchedule([
      { alg: 'R U', ms: 1000 },
      { alg: 'F', ms: 1200 },
      { alg: 'D', ms: 3000 },
    ]);
    expect(actionFrame(schedule, 999).transition).toBeUndefined();
    expect(actionFrame(schedule, 1000).transition?.progress).toBe(0);
    expect(schedule[1].start).toBe(1600);
    expect(actionFrame(schedule, 1700).transition?.key).toBe(1);
    expect(actionFrame(schedule, 2500).alg).toBe('R U F');
    expect(actionFrame(schedule, 2500).transition).toBeUndefined();
    expect(actionFrame(schedule, 0).index).toBe(-1);
  });
  for (const policy of ['skills', 'primitive'] as const)
    test(`${policy} preserves every request, gap and executed move`, () => {
      const recording = recordings.recordings.find((r) => r.policy === policy)!;
      expect(requests[policy].length).toBe(recording.result.requests);
      for (const [i, request] of requests[policy].entries()) {
        expect(request.endMs).toBeGreaterThanOrEqual(request.startMs);
        if (i) expect(request.startMs).toBeGreaterThanOrEqual(requests[policy][i - 1].endMs);
        const action = recording.timeline[request.round];
        if (action) expect(request.endMs).toBeLessThanOrEqual(action.ms);
      }
      const schedule = actionSchedule(recording.timeline);
      expect(actionFrame(schedule, schedule.at(-1)!.end).alg).toBe(
        recording.timeline.map((a) => a.alg).join(' '),
      );
    });
});

import flow from '../public/recordings/article-best-flow.json';
import { preparationLabel } from '../src/lib/request-label';
test('preparation labels describe the exact recorded question', () => {
  const labels = new Set<string>();
  for (const row of requests.skills) {
    const request = flow.steps[row.round].exchanges[row.step - 1].request;
    expect(Object.keys(request.questions)).toEqual(row.questions);
    const label = preparationLabel(request);
    if (label) {
      expect('label' in row && row.label).toBe(label);
      labels.add(label);
    }
  }
  expect(labels.size).toBe(4);
});

import { requestMetadata, nextRequestEnd, requestLink } from '../src/lib/replay-requests';
import primitiveRequests from '../public/recordings/primitive-requests.json';
test('replay metadata appears only at response boundaries and resets for the next round', () => {
  for (const policy of ['skills','primitive'] as const) {
    const rows=requests[policy];
    for(const row of rows.filter(r=>r.questions.includes('goal') && !r.failed)) {
      const earlierGoal=rows.filter(r=>r.round===row.round && r.endMs<=row.startMs && !r.failed && r.questions.includes('goal')).at(-1);
      expect(requestMetadata(policy,row.startMs).goal).toBe(earlierGoal?.answers.goal);
      expect(requestMetadata(policy,row.endMs).goal).toBe(row.answers.goal);
    }
    const first=rows[0];
    expect(nextRequestEnd(policy,first.endMs-1,Infinity)).toBe(first.endMs);
    expect(nextRequestEnd(policy,first.endMs,Infinity)).toBe(rows[1].endMs);
    expect(nextRequestEnd(policy,0,first.endMs-1)).toBeUndefined();
  }
});
test('every permalink identifies its corresponding saved request',()=>{
  for(const policy of ['skills','primitive'] as const) {
    for(const [index,row] of requests[policy].entries()) {
      const url=new URL(requestLink(policy,row.round,row.step),'https://example.com');
      expect(url.searchParams.get('recording')).toBe(policy);
      expect(Number(url.searchParams.get('round'))).toBe(row.round+1);
      expect(Number(url.searchParams.get('request'))).toBe(row.step);
      const saved=policy==='skills'?flow.steps[row.round].exchanges[row.step-1]:primitiveRequests[index];
      expect(Object.keys(saved.request.questions)).toEqual(row.questions);
      if(policy==='primitive')expect(primitiveRequests[index].endMs).toBe(row.endMs);
    }
  }
});
