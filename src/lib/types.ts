export type Policy = 'skills' | 'primitive';
export type Status = 'ready' | 'running' | 'paused' | 'solved' | 'stopped' | 'capped' | 'error';
export type CubeData = Record<
  string,
  { pieces: number[]; orientation: number[]; orientationMod?: number[] }
>;
export type Choice = {
  type: 'choice';
  choice: string;
  probabilities: Record<string, number>;
  confidence: number;
};
export type Question = { type: 'choice'; instructions: unknown; criteria: Record<string, string> };
export type JevRequest = { model: string; state: unknown; questions: Record<string, Question> };
export type JevResponse = {
  model: string;
  answers: Record<string, Choice>;
  usage: { input_tokens: number; output_tokens: number };
};
export type Decision = {
  id: string;
  request: JevRequest;
  response: JevResponse;
  nativeResponse?: unknown;
  elapsedMs: number;
  cost: number;
};
export type Run = {
  id: string;
  createdAt: string;
  policy: Policy;
  scramble: string;
  state: CubeData;
  status: Status;
  revision: number;
  stage: string;
  target: string | null;
  history: string[];
  requests: number;
  turns: number;
  activeMs: number;
  tokens: number;
  cost: number;
  reason: string | null;
  version: string;
  split: string;
  benchmarkId: string | null;
};
export type Event = { id: number; runId: string; kind: string; createdAt: string; payload: any };
export const VERSION = 'rubik-v26';
export const LIMITS = { requests: 500, turns: 1000, ms: 600000 };
