// Re-export the current pair from the local ledger. No API calls.
import pair from '../../src/lib/article-matched-recordings.json';
const id = (policy: string) => pair.recordings.find(r => r.policy === policy)!.runId;
const result = Bun.spawnSync(['bun', 'scripts/article/export-recording-pair.ts', id('skills'), id('primitive')], { stdout: 'inherit', stderr: 'inherit' });
if (result.exitCode) process.exit(result.exitCode);
