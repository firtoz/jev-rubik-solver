import {readFileSync,writeFileSync} from 'node:fs';
import {withPlanMemory} from './policy';
import {createRun} from '../../src/server/runner';
import {evaluate,budget} from '../../src/server/jev';
import {db,getRun,saveRun} from '../../src/server/store';
const dir='experiments/plan-memory-v1',phase=process.argv[2];
if(!['development','validation'].includes(phase))throw new Error('Phase');
const variant=process.argv[3] as 'structured'|'narrative';
if(phase==='validation'&&!['structured','narrative'].includes(variant))throw new Error('Select a frozen variant');
const variants=phase==='development'?['baseline','structured','narrative'] as const:[variant];
const cases=JSON.parse(readFileSync(`${dir}/${phase}-fixtures.json`,'utf8'));
writeFileSync(`${dir}/${phase}-started.json`,JSON.stringify({at:new Date().toISOString(),variants,caseCount:cases.length,requestLimit:80,dollars:0.02,retries:0,concurrency:3}),{flag:'wx'});
writeFileSync(`${dir}/${phase}-policy.ts`,readFileSync('scripts/plan-memory/policy.ts'));
const rows:any[]=[];
const usage=()=>db.query("SELECT COUNT(*) requests,COALESCE(SUM(amount),0) committed FROM ledger l JOIN runs r ON r.id=l.run_id WHERE json_extract(r.json,'$.split')='plan-memory-v1'").get() as {requests:number;committed:number};
const persist=()=>writeFileSync(`${dir}/${phase}-results.json`,JSON.stringify({rows,usage:usage()},null,2));
await Promise.all(variants.map(async v=>{for(const c of cases){
 const r=await createRun('','skills','plan-memory-v1');r.state=c.state;saveRun(r);
 const row:any={caseId:c.id,variant:v,runId:r.id,expected:c.accepted};rows.push(row);
 try{const u=usage(),b=budget(),headroom=3*0.002688;if(u.requests>=80||u.committed+headroom>0.02||b.reservedAndSpent+headroom>b.cap)throw new Error('Budget');
 row.exchange=await evaluate(r.id,withPlanMemory(c.request,c.target,c.front,c.pending,v),AbortSignal.timeout(30000),{maxAttempts:1});row.actual=row.exchange.response.answers.routine.choice;row.correct=c.accepted.includes(row.actual);
 }catch(e){row.error=String(e);row.correct=false;}
 const saved=getRun(r.id);saved.status='stopped';saved.reason='Prepared-routine memory component';saveRun(saved);persist();
}}));
console.log(JSON.stringify({usage:usage(),scores:variants.map(v=>({variant:v,correct:rows.filter(r=>r.variant===v&&r.correct).length,total:cases.length}))}));
