import { z } from 'zod';
import type { JevRequest, JevResponse } from './types';
export const MODEL = 'jev-1.13.0';
const answer = z.object({
  type: z.literal('choice'),
  choice: z.string(),
  probabilities: z.record(z.string(), z.number().min(0).max(1)),
  confidence: z.number().min(0).max(1),
});
const response = z.object({
  model: z.literal(MODEL),
  answers: z.record(z.string(), answer),
  usage: z.object({
    input_tokens: z.number().int().min(0).max(64000),
    output_tokens: z.number().int().nonnegative(),
  }),
});
export function validateResponse(raw: unknown, request: JevRequest): JevResponse {
  const r = response.parse(raw);
  for (const [id, q] of Object.entries(request.questions)) {
    const a = r.answers[id];
    if (
      !a ||
      !(a.choice in q.criteria) ||
      Object.keys(q.criteria).sort().join('|') !== Object.keys(a.probabilities).sort().join('|') ||
      Math.abs(Object.values(a.probabilities).reduce((a, b) => a + b, 0) - 1) > 0.025
    )
      throw new Error('Invalid JEV distribution');
  }
  return r;
}
