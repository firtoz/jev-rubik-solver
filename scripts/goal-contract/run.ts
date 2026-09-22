import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {fixtures} from './fixtures';
import {fullGoalRequest} from './policy';
import {createRun} from '../../src/server/runner';
import {evaluate,budget} from '../../src/server/jev';
import {getRun,saveRun} from '../../src/server/store';
const phase=process.argv[2];if(!['development','validation'].includes(phase))throw new Error('Phase');
const dir='experiments/goal-contract-v1';mkdirSync(dir,{recursive:true});
writeFileSync(`${dir}/${phase}-started.json`,JSON.stringify({at:new Date().toISOString(),maxRequests:phase==='development'?64:32,maxDollars:0.02,retries:0}),{flag:'wx'});
const previous=phase==='validation'?JSON.parse(readFileSync(`${dir}/development-fixtures.json`,'utf8')):[];
const cases=await fixtures(previous.map((c:any)=>c.stateHash),phase==='validation'?99:0);writeFileSync(`${dir}/${phase}-fixtures.json`,JSON.stringify(cases,null,2));
writeFileSync(`${dir}/${phase}-policy.ts`,readFileSync('scripts/goal-contract/policy.ts'));
const variants:('compact'|'detailed')[]=phase==='development'?['compact','detailed']:['compact'];
const rows:any[]=[];let cost=0;
for(const variant of variants)for(const c of cases){
 const r=await createRun(c.scramble,'skills','goal-contract-v1');r.stage='cross';r.history=['U'];
 const row:any={id:c.id,expected:c.expected,variant,runId:r.id};rows.push(row);
 try{const b=budget();if(cost+0.002688>0.02||b.reservedAndSpent+0.002688>b.cap)throw new Error('Budget');
 row.exchange=await evaluate(r.id,fullGoalRequest(r,variant),AbortSignal.timeout(30000),{maxAttempts:1});cost+=row.exchange.cost;row.actual=row.exchange.response.answers.goal.choice;row.correct=row.actual===row.expected;
 }catch(e){row.error=String(e);throw e;}finally{const run=getRun(r.id);run.status='stopped';run.reason='Goal contract isolated probe';saveRun(run);writeFileSync(`${dir}/${phase}-results.json`,JSON.stringify({rows,cost},null,2));}
}
console.log(JSON.stringify({cost,scores:variants.map(variant=>({variant,correct:rows.filter(r=>r.variant===variant&&r.correct).length,total:32}))}));
