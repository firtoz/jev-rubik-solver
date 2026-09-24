import {readFileSync,writeFileSync} from 'node:fs';
import {budget} from '../../src/server/jev';
const dir=process.argv[2]||'experiments/brain-teaching-confirmation-v1';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const result=read(`${dir}/results.json`),verification=read(`${dir}/verification.json`),freshness=read(`${dir}/freshness-verification.json`);
if(verification.partial||!verification.allAttemptsPresent||verification.expected!==100||verification.verified!==100)throw Error('Full final verification required');
if(freshness.starts!==100||freshness.unique!==100||freshness.overlaps.length)throw Error('Freshness');
const validation=read('experiments/brain-teaching-full-v1-validation/verification.json');
const ledger=budget();
const rows=result.rows.map((r:any)=>read(`${dir}/${r.record}`));
const classify=(r:any)=>r.status==='solved'?'solved':r.error?.includes('Study/project cap')?'study budget':r.error?.includes('Attempt cap')||r.error?.includes('Request limit')?'attempt ceiling':r.status==='abstained'?'abstention':r.error?.includes('JEV HTTP')?'provider HTTP error':r.status==='error'?'provider/execution error':r.status;
const categories=Object.fromEntries([...new Set(rows.map(classify))].map(k=>[k,rows.filter((r:any)=>classify(r)===k).length]));
const failures=rows.filter((r:any)=>r.status!=='solved').map((r:any)=>({id:r.id,status:r.status,category:classify(r),error:r.error??null,goal:r.steps.at(-1)?.decision?.goal??r.steps.filter((s:any)=>s.decision).at(-1)?.decision.goal??null,requests:verification.rows.find((v:any)=>v.id===r.id).requests}));
const solvedRows=verification.rows.filter((r:any)=>r.solved),range=(key:string)=>solvedRows.length?`${Math.min(...solvedRows.map((r:any)=>r[key]))}–${Math.max(...solvedRows.map((r:any)=>r[key]))}`:'n/a';
const passed=verification.solved>=95;
const report={passed,solved:verification.solved,total:100,categories,failures,studyCost:verification.study.cost,globalBudget:ledger,validationSolves:validation.solved,sourceDigest:read(`${dir}/started.json`).digest};
writeFileSync(`${dir}/summary.json`,JSON.stringify(report,null,2));
const text=`# Fresh confirmation of the frozen full-cube policy

**${verification.solved}/100 held-out full random-state scrambles solved autonomously.** The target was 95/100. ${passed?'The predefined sample acceptance target passed.':'The target remains unmet; all failures and budget-capped attempts remain in the denominator.'}

The preliminary gate passed ${validation.solved}/10. This confirmation study used the unchanged policy with no development, tuning or retries. Its policy dependency sources match the previous frozen snapshot; its separate runner changes only accounting, the authorized budget, recording snapshots and dataset bookkeeping. The original proven solver remains unchanged. Only the middle-layer policy was substituted.

## Scope and assistance

JEV chooses goals, targets, preparation, frames, fixed routines and recovery. Code supplies reliable measurements, routes on JEV answers and executes its selected moves. It does not rank simulated outcomes, correct tactical mistakes or use a solver fallback. Scramble generation is outside the solving policy.

The new middle sequence uses four contrast examples and generic routine effects. The other stages still use the original explicit applicability teaching, fixed algorithms and model-confirmed pending plans. This is not a less-assisted replacement for every stage, an independently discovered cube strategy or proof of a globally minimal prompt.

## Results and limits

- Final outcome categories: ${Object.entries(categories).map(([k,v])=>`${k}: ${v}`).join('; ')}.
- Successful attempts: ${range('requests')} requests, ${range('turns')} face turns, ${range('elapsedMs')}ms elapsed.
- Limits: 500 requests, 1,000 face turns, 10 minutes per attempt; four concurrent attempts; zero retries.
- New confirmation study commitment: $${verification.study.cost.toFixed(8)} of $1.25, including reservations. Project commitment: $${ledger.reservedAndSpent.toFixed(8)} of $9.
- Freshness: 100 unique starting states, no overlap with archived fixtures or prior recorded starts. This is a finite sampled evaluation, not a guarantee of population reliability.

${failures.length?'## Preserved failures\n\n| Start | Category | Recorded error | Last selected goal | Requests |\n|---|---|---|---|---:|\n'+failures.map((r:any)=>`|${r.id}|${r.category}|${r.error??'none'}|${r.goal??'none'}|${r.requests}|`).join('\n'):'All 100 attempts solved within their ceilings.'}

The previous study remains recorded separately as 94 solves and six budget stops, costing $0.99497244 including its ten-start gate. None of those attempts was restarted or replaced. The new set has its own 100-case denominator, including every new failure or cap.

## Verification and records

The verifier reconstructs cubes from recorded scrambles and actions using cubing, independently checks raw solved predicates, replays the exact request sequence using native answers, checks chosen routine execution and pending-plan provenance, and audits ledger counts and interactive intervention. The full source snapshot is preserved in sources.json. Freshness is independently reconstructed against fixture archives and prior run starts.

The new runner clones request data before dispatch, preventing later mutation of recorded requests. The verifier still compares against immutable SQLite dispatch events and exports authoritative wire-requests.json. Recorded snapshot differences: ${verification.snapshotDrift.length}. No solver choices were repaired.

Commands: \`bun scripts/brain-teaching-confirmation-v1/verify.ts ${dir}\`, \`bun scripts/brain-full-v3/freshness.ts ${dir}\`, and \`bun scripts/brain-teaching-confirmation-v1/summarize.ts ${dir}\`. These are offline audits and do not call JEV. Full per-run requests, responses, actions, timing, failures and usage are in [the final records](../${dir}/results.json). Teaching development and its earlier failures are documented in [the middle-layer report](minimum-teaching-results.md).

See [the cost breakdown](frozen-confirmation-costs.md) for spending by request family and stage, recovery calls, unresolved reservations and separate earlier studies.

## Article implications

The earlier budget-capped integration is preserved in [its original report](full-teaching-integration-results.md). This fresh evaluation addresses the previously unproven acceptance target without tuning against earlier outcomes.

The progression matters: test an isolated decision, then autonomous stage completion, then integration with the surrounding controller. The earlier 38/40 decision score coexisted with 2/10 stage solves. A focused representation and four explicit contrasts subsequently passed 39/40 decisions and 10/10 stage solves, earning this full-cube test.

This integration measures whether that substitution works in context. Different samples and simultaneous representation/wording changes do not isolate a causal benefit. Other stages retain substantial teaching. Further capability claims need their own controlled tests, not a reinterpretation of this result.
`;
writeFileSync('docs/frozen-confirmation-results.md',text);console.log(JSON.stringify(report));
