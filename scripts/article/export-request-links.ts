// Offline, allowlisted export from the local study ledger. Never makes API calls.
import { Database } from 'bun:sqlite';
import timings from '../../src/lib/article-request-timings.json';
import flow from '../../public/recordings/article-best-flow.json';
const db = new Database('.data/lab.sqlite', { readonly: true });
const primitiveRun = 'a23311e0-8711-445e-b340-7bb11dc5cb41';
const events = (
  db
    .query('SELECT id,kind,created_at,payload FROM events WHERE run_id=? ORDER BY id')
    .all(primitiveRun) as any[]
).map((e) => ({ ...e, payload: JSON.parse(e.payload) }));
const sends = events.filter((e) => e.kind === 'request');
const origin = Date.parse(sends[0].created_at);
for (const policy of ['skills', 'primitive'] as const) {
  const records = timings[policy].map((row, i) => {
    let exchange: any;
    if (policy === 'skills') exchange = flow.steps[row.round].exchanges[row.step - 1];
    else {
      const send = sends[i];
      if (Date.parse(send.created_at) - origin !== row.startMs) throw Error('Timing mismatch');
      const received = events.find(
        (e) =>
          e.id > send.id &&
          ['decision', 'request-error', 'invalid-response'].includes(e.kind) &&
          e.payload.id === send.payload.id,
      );
      if (!received || Date.parse(received.created_at) - origin !== row.endMs)
        throw Error('Response mismatch');
      const p = received.payload;
      exchange = {
        request: send.payload.request,
        response: p.response ?? null,
        nativeResponse: p.nativeResponse ?? null,
        elapsedMs: p.elapsedMs ?? row.elapsedMs,
        cost: p.cost ?? null,
        ...(received.kind !== 'decision'
          ? { error: { status: p.status ?? null, message: p.error ?? 'Transport failed' } }
          : {}),
      };
    }
    if (JSON.stringify(Object.keys(exchange.request.questions)) !== JSON.stringify(row.questions))
      throw Error('Question mismatch');
    const answers = Object.fromEntries(
      Object.entries(exchange.response?.answers ?? {}).map(([key, value]: any) => [
        key,
        value.choice,
      ]),
    );
    Object.assign(row, { answers });
    return {
      round: row.round + 1,
      step: row.step,
      startMs: row.startMs,
      endMs: row.endMs,
      request: exchange.request,
      response: exchange.nativeResponse ?? exchange.response,
      elapsedMs: exchange.elapsedMs,
      cost: exchange.cost,
      ...(exchange.error ? { error: exchange.error } : {}),
    };
  });
  if (policy === 'primitive')
    await Bun.write(`public/recordings/${policy}-requests.json`, JSON.stringify(records));
}
await Bun.write('src/lib/article-request-timings.json', JSON.stringify(timings, null, 2) + '\n');
db.close();
