import { existsSync,mkdirSync,readFileSync,writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { evaluate,budget } from '../../src/server/jev';
import { db,getRun,saveRun } from '../../src/server/store';
import { createRun } from '../../src/server/runner';
import { preconditionRequest,type PreconditionVariant } from '../../src/server/action-preconditions';
import { makeFixtures } from './fixtures';
const dir='experiments/action-preconditions-v1',splitId='action-preconditions-v1';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const write=(p:string,v:unknown)=>writeFileSync(p,JSON.stringify(v,null,2));
function usage(){return db.query("SELECT COUNT(*) requests,COALESCE(SUM(amount),0) committed FROM ledger l JOIN runs r ON r.id=l.run_id WHERE json_extract(r.json,'$.split')=?").get(splitId) as {requests:number;committed:number};}
const digest=()=>createHash('sha256').update(readFileSync('src/server/action-preconditions.ts')).digest('hex');
function summary(rows:any[]){return [...new Set(rows.map(r=>r.variant))].flatMap(variant=>['transfer','landing'].map(family=>{
 const rs=rows.filter(r=>r.variant===variant&&r.family===family),ex=rs.flatMap(r=>r.exchanges);
 return {variant,family,cases:rs.length,correct:rs.filter(r=>r.correct).length,errors:rs.filter(r=>r.error).length,requests:ex.length,cost:ex.reduce((n,d)=>n+d.cost,0),latencyMs:ex.reduce((n,d)=>n+d.elapsedMs,0)};
}));}
async function main(){
 const phase=process.argv[2];
 if(phase==='prepare'){
  if(existsSync(`${dir}/manifest.json`))throw new Error('Already prepared');
  mkdirSync(dir,{recursive:true});
  const development=await makeFixtures('development'),validation=await makeFixtures('validation',development.map(c=>c.stateHash));
  write(`${dir}/development-fixtures.json`,development);write(`${dir}/validation-fixtures.json`,validation);
  write(`${dir}/manifest.json`,{model:'jev-1.13.0',digest:digest(),limits:{requests:260,dollars:0.04,concurrency:3},scope:'Isolated precondition choices. Prior target, reference and routine supplied. Not integration or full action correctness.',start:budget()});
  for(const p of ['src/server/action-preconditions.ts','scripts/preconditions/fixtures.ts','scripts/preconditions/run.ts'])writeFileSync(`${dir}/${p.split('/').at(-1)}`,readFileSync(p));
  console.log('Prepared 40 development and 40 fresh cases; no API calls.');return;
 }
 if(!['development','validation'].includes(phase))throw new Error('Use prepare, development or validation');
 if(read(`${dir}/manifest.json`).digest!==digest())throw new Error('Frozen source changed');
 const variants:PreconditionVariant[]=phase==='development'?['rule','criteria','check-then-choice']: [...new Set(Object.values(read(`${dir}/selection.json`)))] as PreconditionVariant[];
 writeFileSync(`${dir}/${phase}-started.json`,JSON.stringify({at:new Date().toISOString(),variants,usage:usage()}),{flag:'wx'});
 const fixtures=read(`${dir}/${phase}-fixtures.json`),rows:any[]=[];
 await Promise.all(variants.map(async variant=>{
  for(const c of fixtures){
   if(phase==='validation'&&read(`${dir}/selection.json`)[c.family]!==variant)continue;
   const run=await createRun(c.scramble,'skills',splitId);run.version=splitId;saveRun(run);
   const row:any={caseId:c.id,variant,family:c.family,expected:c.expected,runId:run.id,exchanges:[]};rows.push(row);
   const ask=async(request:any)=>{
    const u=usage(),g=budget(),reserve=64000*0.042/1e6;
    if(u.requests>=260||u.committed+reserve>0.04||g.reservedAndSpent+reserve>g.cap)throw new Error('Budget/request cap');
    const d=await evaluate(run.id,request,AbortSignal.timeout(30000),{maxAttempts:1});row.exchanges.push(d);
    return Object.values(d.response.answers)[0].choice;
   };
   try{
    if(variant==='check-then-choice')row.ready=await ask(preconditionRequest(c.observation,c.family,variant));
    row.actual=await ask(preconditionRequest(c.observation,c.family,variant,row.ready));row.correct=row.actual===c.expected;
   }catch(e){row.error=String(e);row.correct=false;}
   const saved=getRun(run.id);saved.status='stopped';saved.reason='Isolated precondition study';saveRun(saved);
   write(`${dir}/${phase}-results.json`,{summary:summary(rows),rows,usage:usage()});
  }
 }));
 const summaries=summary(rows);console.log(JSON.stringify(summaries,null,2));
 if(phase==='development')write(`${dir}/selection.json`,Object.fromEntries(['transfer','landing'].map(family=>[family,summaries.filter(s=>s.family===family).sort((a,b)=>b.correct-a.correct||a.requests-b.requests||a.cost-b.cost||a.variant.localeCompare(b.variant))[0].variant])));
}
if(import.meta.main)await main();
