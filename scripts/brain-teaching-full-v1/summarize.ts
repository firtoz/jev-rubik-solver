import {readFileSync,writeFileSync} from 'node:fs';
import {budget} from '../../src/server/jev';
const dir=process.argv[2]||'experiments/brain-teaching-full-v1-final';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const result=read(`${dir}/results.json`),verification=read(`${dir}/verification.json`),freshness=read(`${dir}/freshness-verification.json`);
if(verification.partial||!verification.allAttemptsPresent||verification.expected!==100||verification.verified!==100)throw Error('Full final verification required');
if(freshness.starts!==100||freshness.unique!==100||freshness.overlaps.length)throw Error('Freshness');
const validation=read('experiments/brain-teaching-full-v1-validation/verification.json');
const ledger=budget();
const rows=result.rows.map((r:any)=>read(`${dir}/${r.record}`));
const classify=(r:any)=>r.status==='solved'?'solved':r.error?.includes('Study/project cap')?'study budget':r.error?.includes('Attempt cap')||r.error?.includes('Request limit')?'attempt ceiling':r.status==='abstained'?'abstention':r.status==='error'?'provider/execution error':r.status;
const categories=Object.fromEntries([...new Set(rows.map(classify))].map(k=>[k,rows.filter((r:any)=>classify(r)===k).length]));
const failures=rows.filter((r:any)=>r.status!=='solved').map((r:any)=>({id:r.id,status:r.status,category:classify(r),error:r.error??null,goal:r.steps.at(-1)?.decision?.goal??r.steps.filter((s:any)=>s.decision).at(-1)?.decision.goal??null,requests:verification.rows.find((v:any)=>v.id===r.id).requests}));
const solvedRows=verification.rows.filter((r:any)=>r.solved),range=(key:string)=>solvedRows.length?`${Math.min(...solvedRows.map((r:any)=>r[key]))}–${Math.max(...solvedRows.map((r:any)=>r[key]))}`:'n/a';
const passed=verification.solved>=95;
const report={passed,solved:verification.solved,total:100,categories,failures,studyCost:verification.study.cost,globalBudget:ledger,validationSolves:validation.solved,sourceDigest:read(`${dir}/started.json`).digest};
writeFileSync(`${dir}/summary.json`,JSON.stringify(report,null,2));
const text=`# Full-cube integration of the examples-based middle policy

**${verification.solved}/100 held-out full random-state scrambles solved autonomously.** The target was 95/100. ${passed?'The predefined sample acceptance target passed.':'The target remains unmet; all failures and budget-capped attempts remain in the denominator.'}

The preliminary gate passed ${validation.solved}/10. One development version was used; no final-test tuning or retries were performed. Both batches used the same frozen source digest. The original proven solver remains unchanged. Only the middle-layer policy was substituted.

## Scope and assistance

JEV chooses goals, targets, preparation, frames, fixed routines and recovery. Code supplies reliable measurements, routes on JEV answers and executes its selected moves. It does not rank simulated outcomes, correct tactical mistakes or use a solver fallback. Scramble generation is outside the solving policy.

The new middle sequence uses four contrast examples and generic routine effects. The other stages still use the original explicit applicability teaching, fixed algorithms and model-confirmed pending plans. This is not a less-assisted replacement for every stage, an independently discovered cube strategy or proof of a globally minimal prompt.

## Results and limits

- Final outcome categories: ${Object.entries(categories).map(([k,v])=>`${k}: ${v}`).join('; ')}.
- Successful attempts: ${range('requests')} requests, ${range('turns')} face turns, ${range('elapsedMs')}ms elapsed.
- Limits: 500 requests, 1,000 face turns, 10 minutes per attempt; four concurrent attempts; zero retries.
- Total study commitment: $${verification.study.cost.toFixed(8)} of $1, including reservations. Project commitment: $${ledger.reservedAndSpent.toFixed(8)} of $9.
- Freshness: 100 unique starting states, no overlap with archived fixtures or prior recorded starts. This is a finite sampled evaluation, not a guarantee of population reliability.

${failures.length?'## Preserved failures\n\n| Start | Category | Last selected goal | Requests |\n|---|---|---|---:|\n'+failures.map((r:any)=>`|${r.id}|${r.category}|${r.goal??'none'}|${r.requests}|`).join('\n'):'All 100 attempts solved within their ceilings.'}

The budget check includes reservations for in-flight requests. Some reservations settled to smaller actual charges after attempts had already been capped, leaving a small unused balance. Capped attempts were not restarted. Three budget-capped attempts had dispatched calls; three had not started. No terminal provider or solving error was recorded. The six capped cases remain in the planned denominator, so this is not a 95/100 acceptance pass.

## Verification and records

The verifier reconstructs cubes from recorded scrambles and actions using cubing, independently checks raw solved predicates, replays the exact request sequence using native answers, checks chosen routine execution and pending-plan provenance, and audits ledger counts and interactive intervention. The full source snapshot is preserved in sources.json. Freshness is independently reconstructed against fixture archives and prior run starts.

A pre-existing mutable request-array defect can change a later in-memory snapshot after dispatch. Immutable SQLite dispatch events preserve the actual request. The verifier exports those authoritative copies to wire-requests.json and reports every drift without overwriting the original record. No solver choices were repaired.

Commands: \`bun scripts/brain-teaching-full-v1/verify.ts ${dir}\`, \`bun scripts/brain-full-v3/freshness.ts ${dir}\`, and \`bun scripts/brain-teaching-full-v1/summarize.ts ${dir}\`. These are offline audits and do not call JEV. Full per-run requests, responses, actions, timing, failures and usage are in [the final records](../${dir}/results.json). Teaching development and its earlier failures are documented in [the middle-layer report](minimum-teaching-results.md).

## Article implications

The progression matters: test an isolated decision, then autonomous stage completion, then integration with the surrounding controller. The earlier 38/40 decision score coexisted with 2/10 stage solves. A focused representation and four explicit contrasts subsequently passed 39/40 decisions and 10/10 stage solves, earning this full-cube test.

This integration measures whether that substitution works in context. Different samples and simultaneous representation/wording changes do not isolate a causal benefit. Other stages retain substantial teaching. Further capability claims need their own controlled tests, not a reinterpretation of this result.
`;
writeFileSync('docs/full-teaching-integration-results.md',text);console.log(JSON.stringify(report));
