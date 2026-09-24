import {readFileSync,writeFileSync} from 'node:fs';
const dir='experiments/brain-teaching-confirmation-v1-http-resume';
const original='experiments/brain-teaching-confirmation-v1';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const same=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
if(readFileSync(`${dir}/resume-source.ts`,'utf8')!==readFileSync('scripts/brain-teaching-confirmation-v1/resume-http.ts','utf8'))throw Error('Resume source changed');
const results=read(`${dir}/results.json`);
let checked=0;
for(const summary of results.rows){
 if(summary.status==='running')continue;
 const row=read(`${dir}/${summary.record}`),prior=read(`${original}/${summary.record}`);
 if(row.runId!==prior.runId||!same(row.before,prior.before))throw Error('Starting state/run changed');
 if(prior.status==='solved'&&!same(row,prior))throw Error('Original solved record changed');
 for(let i=0;i<prior.steps.length;i++){
  const old=prior.steps[i],now=row.steps[i];
  if(!now)throw Error('Original step missing');
  if(old.after&&!same(old,now))throw Error('Completed action changed');
  for(let j=0;j<old.exchanges.length;j++)if(!same(old.exchanges[j],now.exchanges[j]))throw Error('Successful response prefix changed');
 }
 if(row.elapsedMs<prior.elapsedMs)throw Error('Original active time omitted');
 checked++;
}
// Existing verifier reconstructs all moves, exact requests, native selections,
// solved states, cumulative ledger requests and the unchanged source closure.
process.argv=[process.argv[0],process.argv[1],dir,...(process.argv.includes('--partial')?['--partial']:[])];
await import('./verify');
writeFileSync(`${dir}/${process.argv.includes('--partial')?'partial-resume-audit':'resume-audit'}.json`,JSON.stringify({checked,originalSuccessfulPrefixesPreserved:true,originalActionsPreserved:true,originalRunIdsPreserved:true,sourceUnchanged:true},null,2));
