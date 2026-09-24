import {readFileSync,writeFileSync} from 'node:fs';
const dir='experiments/brain-teaching-confirmation-v1-http-resume';
const original='experiments/brain-teaching-confirmation-v1';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const result=read(`${dir}/results.json`),audit=read(`${dir}/verification.json`),resume=read(`${dir}/resume-audit.json`),cost=read(`${dir}/cost-breakdown.json`);
if(audit.partial||audit.verified!==100||!audit.allAttemptsPresent||resume.checked!==100||cost.partial)throw Error('Full audits required');
const rows=result.rows.map((r:any)=>read(`${dir}/${r.record}`));
const category=(r:any)=>r.status==='solved'?'solved':/JEV HTTP/.test(r.error??'')?'transport unresolved':/Study\/project cap/.test(r.error??'')?'budget unresolved':(/Attempt cap|Request limit/.test(r.error??'')||r.elapsedMs>=600000)?'attempt limit':r.status;
const categories:Record<string,number>={};for(const row of rows){const c=category(row);categories[c]=(categories[c]??0)+1;}
const old=read(`${original}/summary.json`),initial=read(`${original}/cost-breakdown.json`);
const passed=audit.solved>=95;
const commitment=cost.current.settled+cost.current.reserved;
const report={passed,solved:audit.solved,total:100,categories,commitment,estimatedSpent:cost.current.settled,reserved:cost.current.reserved,additionalCommitment:commitment-initial.current.settled-initial.current.reserved,originalNoRetrySolves:old.solved,requests:cost.current.requests};
writeFileSync(`${dir}/summary.json`,JSON.stringify(report,null,2));
const remaining=rows.filter((r:any)=>r.status!=='solved');
writeFileSync('docs/frozen-confirmation-resumed-results.md',`# Frozen confirmation with HTTP recovery

**${audit.solved}/100 cubes independently verified solved.** ${passed?'The 95/100 sample target passed.':'The 95/100 sample target was missed.'}

The user amended the transport rule after the original batch: HTTP errors may be retried and are not solver failures. The original no-retry snapshot remains preserved as 62 solves and 38 HTTP interruptions. We resumed the same interrupted cubes, with the same policy, cached successful answers and completed moves. No fresh replacement scrambles or tactical retries were introduced. Transport-unresolved cubes remain in the 100-case accounting and are not presumed solved.

## Outcomes

${Object.entries(categories).map(([key,value])=>`- ${key}: ${value}`).join('\n')}

${remaining.length?'| Cube | Outcome | Recorded reason |\n|---|---|---|\n'+remaining.map((r:any)=>`| ${r.id} | ${category(r)} | ${r.error??r.status} |`).join('\n'):'Every starting cube is verified solved.'}

All six stops concern the cumulative time allowance, not request or turn ceilings. Five pending calls were cancelled at the deadline; one stopped at 585.479 seconds because its next retry delay would exceed the allowance. These are unresolved cubes, not evidence that the policy could never solve them.

## Budget and transport

Total commitment: **$${commitment.toFixed(6)} of $1.25**, comprising **$${cost.current.settled.toFixed(6)} estimated usage** and **$${cost.current.reserved.toFixed(6)} unresolved reservations**. The recovery phase added $${report.additionalCommitment.toFixed(6)} commitment. All original and resumed calls remain in the same ledger. The [cost breakdown](frozen-confirmation-resumed-costs.md) includes stages, request types, recovery questions and separate earlier studies.

The original provider errors reported overload. Recovery used one worker, up to three transport attempts per request and 15/30-second backoff. Cumulative ceilings remained 500 requests and 1,000 face turns per cube. Ten minutes includes original and resumed active execution plus retry backoff, excluding the offline interruption between phases. This timing amendment is disclosed; these results are not a ten-minute uninterrupted wall-clock benchmark. Retained reservations are conservative commitments, not confirmed provider charges.

## Verification and assistance

All 100 records passed independent cube reconstruction, solved-state checking, exact request/controller replay and selected-routine execution checks. The resume audit checks original run IDs, starting states, successful response prefixes and completed actions were preserved. Request snapshot differences: ${audit.snapshotDrift.length}. Policy dependency sources remain frozen. Offline commands: \`bun scripts/brain-teaching-confirmation-v1/verify-resume.ts\`, \`bun scripts/brain-teaching-confirmation-v1/costs.ts ${dir}\`, \`bun scripts/brain-teaching-confirmation-v1/summarize-resume.ts\`.

Code supplies measured observations and executes JEV-selected routines. JEV chooses goals, targets, frames, preparations, routines and recovery. Assistance still includes explicit goal criteria, fixed beginner algorithms, four middle-layer examples and other-stage case guidance. There is no tactical correction, simulated-outcome ranking or solver fallback. This measures the frozen system with that assistance, not independent discovery of cube-solving algorithms.

The earlier 94 solves and six budget stops remain [separate](full-teaching-integration-results.md), as does the [original no-retry snapshot](frozen-confirmation-results.md). No earlier outcomes were replaced. Full records: [results.json](../${dir}/results.json).

## What this tells us

Transport availability and policy ability need separate diagnostics. A provider interruption supplies no evidence about the action the model would have selected. Resuming the exact pending request preserves successful work, but a transport-unresolved cube still cannot be called solved. This evaluation does not establish how the interrupted cubes would perform with unlimited time or retries.
`);
console.log(JSON.stringify(report));
