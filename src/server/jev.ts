import { readFileSync } from 'node:fs';
import { z } from 'zod';
import { CAP, PRICE, db, event, getRun, reserve, saveRun, settle, spend } from './store';
import { LIMITS, type JevRequest, type JevResponse, type Decision } from '../lib/types';
export const MODEL = 'jev-1.13.0';
function apiKey() {
  if (process.env.TYPESAFE_API_KEY) return process.env.TYPESAFE_API_KEY;
  try {
    const text = readFileSync('/home/frtn/work/2026/laya/.env', 'utf8');
    const line = text.split('\n').find((l) => /^TYPESAFE_API_KEY=/.test(l));
    return line
      ?.slice(line.indexOf('=') + 1)
      .trim()
      .replace(/^['"]|['"]$/g, '');
  } catch {
    return undefined;
  }
}
export function configured() {
  return Boolean(apiKey());
}
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
export async function evaluate(
  runId: string,
  request: JevRequest,
  signal: AbortSignal,
  options: { maxAttempts?: number } = {},
): Promise<Decision> {
  const maxAttempts = options.maxAttempts ?? 3;
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 3)
    throw new Error('maxAttempts must be between 1 and 3');
  const key = apiKey();
  if (!key) throw new Error('Missing TYPESAFE_API_KEY');
  const body = JSON.stringify(request);
  // Reserve the entire documented 64k request ceiling for every network attempt.
  const reservation = 64000 * PRICE;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    signal.throwIfAborted();
    const run = getRun(runId);
    if (run.requests >= LIMITS.requests) throw new Error('Request limit reached');
    const id = crypto.randomUUID();
    db.transaction(() => {
      reserve(id, runId, reservation);
      const current = getRun(runId);
      if (current.requests >= LIMITS.requests) throw new Error('Request limit reached');
      current.requests++;
      saveRun(current);
      event(runId, 'request', { id, attempt, request, reservation });
    }).immediate();
    const start = performance.now();
    let http: Response;
    try {
      http = await fetch('https://api.typesafe.ai/v1/systemone', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body,
        signal: AbortSignal.any([signal, AbortSignal.timeout(30000)]),
      });
    } catch {
      event(runId, 'request-error', {
        id,
        error: 'Network failure or cancellation; reservation retained',
      });
      throw new Error(signal.aborted ? 'Execution cancelled' : 'JEV network timeout/failure');
    }
    if (!http.ok) {
      const text = (await http.text()).replaceAll(key, '[redacted credential]');
      let raw: unknown = text;
      try {
        raw = JSON.parse(text);
      } catch {}
      event(runId, 'request-error', {
        id,
        status: http.status,
        raw,
        error: 'Reservation retained',
      });
      if ([429, 529].includes(http.status) && attempt + 1 < maxAttempts) {
        const retry = Math.min(
          10000,
          Math.max(1000 * 2 ** attempt, Number(http.headers.get('retry-after') || 0) * 1000),
        );
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(resolve, retry);
          signal.addEventListener(
            'abort',
            () => {
              clearTimeout(timer);
              reject(new Error('Execution cancelled'));
            },
            { once: true },
          );
        });
        continue;
      }
      throw new Error(`JEV HTTP ${http.status}`);
    }
    const responseText = (await http.text()).replaceAll(key, '[redacted credential]');
    let raw: unknown;
    try {
      raw = JSON.parse(responseText);
    } catch {
      event(runId, 'invalid-response', { id, raw: responseText });
      throw new Error('Malformed JEV JSON; reservation retained');
    }
    let result: JevResponse;
    try {
      result = validateResponse(raw, request);
    } catch {
      event(runId, 'invalid-response', { id, raw });
      throw new Error('Malformed JEV response; reservation retained');
    }
    const cost = result.usage.input_tokens * PRICE;
    const decision = {
      id,
      request,
      response: result,
      nativeResponse: raw,
      elapsedMs: performance.now() - start,
      cost,
    };
    db.transaction(() => {
      settle(id, cost);
      const latest = getRun(runId);
      latest.tokens += result.usage.input_tokens;
      latest.cost += cost;
      saveRun(latest);
      event(runId, 'decision', decision);
    }).immediate();
    return decision;
  }
  throw new Error('JEV retries exhausted');
}
export function budget() {
  const totals = db
    .query(
      "SELECT COALESCE(SUM(CASE WHEN status='settled' THEN amount ELSE 0 END),0) usage,COALESCE(SUM(CASE WHEN status='reserved' THEN amount ELSE 0 END),0) reserved,COUNT(*) attempts FROM ledger",
    )
    .get() as { usage: number; reserved: number; attempts: number };
  return {
    cap: CAP,
    reservedAndSpent: totals.usage + totals.reserved,
    usage: totals.usage,
    reserved: totals.reserved,
    attempts: totals.attempts,
    pricePerMillion: PRICE * 1e6,
    configured: configured(),
  };
}
