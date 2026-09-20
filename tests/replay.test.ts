import { test, expect } from 'bun:test';
import { recordedTimeline, frameAt, transitionAt } from '../src/lib/replay';
import type { Event } from '../src/lib/types';
test('recorded replay preserves waits, pause gaps and event ordering without stretching moves', () => {
  const origin = Date.parse('2026-09-20T00:00:00Z');
  const event = (id: number, kind: string, ms: number): Event => ({
    id,
    kind,
    createdAt: new Date(origin + ms).toISOString(),
    runId: 'test',
    payload: {},
  });
  const timeline = recordedTimeline([
    event(1, 'created', 0),
    event(2, 'step-start', 10000),
    event(3, 'request', 10005),
    event(4, 'decision', 11200),
    event(5, 'action', 11202),
    event(6, 'control', 12000),
    event(7, 'request', 30000),
    event(8, 'decision', 30400),
    event(9, 'action', 30402),
  ]);
  expect(timeline.map((f) => f.ms)).toEqual([5, 1200, 1202, 2000, 20000, 20400, 20402]);
  expect(frameAt(timeline, 0)).toBeUndefined();
  expect(frameAt(timeline, 1199)?.event.kind).toBe('request');
  expect(frameAt(timeline, 1201)?.event.kind).toBe('decision');
  expect(frameAt(timeline, 1202)?.event.kind).toBe('action');
  expect(frameAt(timeline, 19000)?.event.kind).toBe('control');
  expect(frameAt(timeline, 20402)?.event.id).toBe(9);
});
test('animation reaches each cube state at its recorded timestamp and rewinds correctly', () => {
  const frame = (id: number, ms: number, alg: string) => ({
    ms,
    event: { id, kind: 'action', createdAt: '', runId: 'test', payload: { alg } },
  });
  const timeline = [frame(1, 2000, 'R U'), frame(2, 7000, "F'")];
  expect(transitionAt(timeline, 0)).toEqual({ key: 1, beforeAlg: '', alg: 'R U', progress: 0 });
  expect(transitionAt(timeline, 1000)?.progress).toBe(0.5);
  expect(transitionAt(timeline, 2000)).toEqual({
    key: 2,
    beforeAlg: 'R U',
    alg: "F'",
    progress: 0,
  });
  expect(transitionAt(timeline, 4500)?.progress).toBe(0.5);
  expect(transitionAt(timeline, 7000)).toBeUndefined();
  expect(transitionAt(timeline, 500)?.progress).toBe(0.25);
});
