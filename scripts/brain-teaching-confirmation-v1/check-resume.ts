import {readFileSync} from 'node:fs';
import {decide} from '../brain-teaching-full-v1/policy';
import {getRun} from '../../src/server/store';
import {hash,facts} from '../../src/lib/cube';
const dir='experiments/brain-teaching-confirmation-v1';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
let checked=0;
for(const summary of read(`${dir}/results.json`).rows){
 const row=read(`${dir}/${summary.record}`);
 if(row.status!=='error'||!row.error.includes('JEV HTTP'))continue;
 const step=row.steps.at(-1),history=row.steps.filter((s:any)=>s.after);
 const run=getRun(row.runId);run.state=row.after;run.history=history.map((s:any)=>s.alg);
 const same=history.filter((s:any)=>hash(s.before)===hash(run.state));
 let cursor=step.exchanges[0]?.request.questions.recovery?1:0;
 const boundary=Symbol('next unpaid request');
 try{
  await decide(run,async(request:any)=>{
   if(cursor===step.exchanges.length)throw boundary;
   const recorded=step.exchanges[cursor++];
   if(JSON.stringify(request)!==JSON.stringify(recorded.request))throw Error(`Resume mismatch ${row.id}`);
   return recorded.response;
  },same.slice(-3).map((s:any)=>({action:s.alg,target:s.decision?.target,factsBefore:facts(s.before),factsAfter:facts(s.after)})),step.recovery==='retarget'?run.target:null,step.pendingPlan);
  throw Error('Expected interrupted request');
 }catch(e){if(e!==boundary)throw e;}
 checked++;
}
console.log({checked,calls:0});
