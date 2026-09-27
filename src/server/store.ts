import { PROJECT_BUDGET_CAP } from '../lib/budget';
import { Database } from 'bun:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { Run, Event } from '../lib/types';
const path = process.env.RUBIK_DB || resolve('.data/lab.sqlite');
mkdirSync(dirname(path), { recursive: true });
export const db = new Database(path);
db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
CREATE TABLE IF NOT EXISTS runs(id TEXT PRIMARY KEY,json TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY AUTOINCREMENT,run_id TEXT,kind TEXT,created_at TEXT,payload TEXT);
CREATE INDEX IF NOT EXISTS events_run_id_id ON events(run_id,id);
CREATE TABLE IF NOT EXISTS ledger(id TEXT PRIMARY KEY,run_id TEXT,amount REAL,status TEXT,created_at TEXT);
CREATE TABLE IF NOT EXISTS locks(run_id TEXT PRIMARY KEY,owner TEXT,expires INTEGER);
CREATE TABLE IF NOT EXISTS commands(id TEXT PRIMARY KEY,run_id TEXT);
CREATE TABLE IF NOT EXISTS benchmarks(id TEXT PRIMARY KEY,json TEXT);
CREATE TRIGGER IF NOT EXISTS immutable_events_update BEFORE UPDATE ON events BEGIN SELECT RAISE(ABORT,'immutable events'); END;
CREATE TRIGGER IF NOT EXISTS immutable_events_delete BEFORE DELETE ON events BEGIN SELECT RAISE(ABORT,'immutable events'); END;`);
export function getRun(id: string): Run {
  const row = db.query('SELECT json FROM runs WHERE id=?').get(id) as any;
  if (!row) throw new Error('Run not found');
  return JSON.parse(row.json);
}
export function saveRun(r: Run) {
  db.query('INSERT OR REPLACE INTO runs VALUES (?,?)').run(r.id, JSON.stringify(r));
}
export function listRuns(): Run[] {
  return (
    db
      .query("SELECT json FROM runs ORDER BY json_extract(json,'$.createdAt') DESC LIMIT 200")
      .all() as any[]
  ).map((r) => JSON.parse(r.json));
}
export function event(runId: string, kind: string, payload: unknown) {
  db.query('INSERT INTO events(run_id,kind,created_at,payload) VALUES (?,?,?,?)').run(
    runId,
    kind,
    new Date().toISOString(),
    JSON.stringify(payload),
  );
}
export function events(runId: string, after = 0): Event[] {
  return (
    db.query('SELECT * FROM events WHERE run_id=? AND id>? ORDER BY id').all(runId, after) as any[]
  ).map((e) => ({
    id: e.id,
    runId: e.run_id,
    kind: e.kind,
    createdAt: e.created_at,
    payload: JSON.parse(e.payload),
  }));
}
export function spend() {
  return (db.query('SELECT COALESCE(SUM(amount),0) total FROM ledger').get() as any)
    .total as number;
}
const configuredCap = Number(process.env.RUBIK_BUDGET_USD ?? PROJECT_BUDGET_CAP);
if (!Number.isFinite(configuredCap) || configuredCap <= 0)
  throw new Error('RUBIK_BUDGET_USD must be a positive finite number');
export const CAP = configuredCap,
  PRICE = 0.042 / 1e6;
export function reserve(id: string, runId: string, amount: number) {
  db.transaction(() => {
    if (spend() + amount > CAP) throw new Error(`Project $${CAP} budget exhausted`);
    db.query('INSERT INTO ledger VALUES (?,?,?,?,?)').run(
      id,
      runId,
      amount,
      'reserved',
      new Date().toISOString(),
    );
  }).immediate();
}
export function settle(id: string, amount: number) {
  db.query("UPDATE ledger SET amount=?,status='settled' WHERE id=?").run(amount, id);
}
export function lock(id: string, revision: number, command: string) {
  const owner = crypto.randomUUID();
  db.transaction(() => {
    const r = getRun(id);
    if (r.revision !== revision) throw new Error('Stale revision; refresh the run');
    if (db.query('SELECT id FROM commands WHERE id=?').get(command))
      throw new Error('Duplicate command');
    const l = db.query('SELECT expires FROM locks WHERE run_id=?').get(id) as any;
    if (l && l.expires > Date.now()) throw new Error('A decision is already in progress');
    db.query('INSERT OR REPLACE INTO locks VALUES (?,?,?)').run(id, owner, Date.now() + 120000);
    event(id, 'step-start', { owner, startedAt: Date.now() });
    db.query('INSERT INTO commands VALUES (?,?)').run(command, id);
  }).immediate();
  return owner;
}
export function renew(id: string, owner: string) {
  const r = db
    .query('UPDATE locks SET expires=? WHERE run_id=? AND owner=?')
    .run(Date.now() + 120000, id, owner);
  if (!r.changes) throw new Error('Decision lease lost');
}
export function unlock(id: string, owner: string) {
  db.query('DELETE FROM locks WHERE run_id=? AND owner=?').run(id, owner);
}
export function assertOwner(id: string, owner: string) {
  const l = db.query('SELECT owner,expires FROM locks WHERE run_id=?').get(id) as any;
  if (!l || l.owner !== owner || l.expires < Date.now()) throw new Error('Decision lease lost');
}
export function recover() {
  for (const r of listRuns()) {
    const lease = db.query('SELECT owner,expires FROM locks WHERE run_id=?').get(r.id) as {
      owner: string;
      expires: number;
    } | null;
    if (lease && lease.expires > Date.now()) continue;
    if (lease) {
      const row = db
        .query(
          "SELECT payload FROM events WHERE run_id=? AND kind='step-start' ORDER BY id DESC LIMIT 1",
        )
        .get(r.id) as { payload: string } | null;
      if (row) {
        const start = JSON.parse(row.payload);
        r.activeMs += Math.max(0, Math.min(600000 - r.activeMs, Date.now() - start.startedAt));
      }
      db.query('DELETE FROM locks WHERE run_id=?').run(r.id);
    }
    if (r.status === 'running' || (lease && r.status === 'ready')) {
      r.status = 'paused';
      r.reason = 'Execution interrupted; resume explicitly.';
      saveRun(r);
      event(r.id, 'interrupted', { reason: r.reason });
    }
  }
}
