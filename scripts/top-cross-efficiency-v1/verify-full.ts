import {readFileSync,writeFileSync} from 'node:fs';
import {Database} from 'bun:sqlite';
import {apply,hash,facts,inverse,solved,isSolved} from '../../src/lib/cube';
import {decide as baseline} from '../brain-teaching-full-v1/policy';
import {decide as candidate} from './full-policy';
import {validateResponse} from '../../src/server/jev';
import type {PendingPlan} from '../plan-memory/policy';
const dir='experiments/top-cross-efficiency-v1/full-integration',data=JSON.parse(readFileSync(`${dir}/results.json`,'utf8')),fixtures=JSON.parse(readFileSync(`${dir}/fixtures.json`,'utf8'));
const partial=process.argv.includes('--partial');if(!partial&&(data.rows.length!==4||data.rows.some((r:any)=>r.status==='running')))throw Error('Wait for four terminal attempts');
const start=JSON.parse(readFileSync(`${dir}/started.json`,'utf8'));for(const [p,s] of Object.entries(start.sources))if(readFileSync(p,'utf8')!==s)throw Error('Frozen source changed '+p);
const db=new Database('.data/lab.sqlite',{readonly:true});const checked=[];
for(const row of data.rows.filter((r:any)=>r.status!=='running')){
 const fixture=fixtures.find((f:any)=>f.id===row.id);let state=await apply(await solved(),fixture.scramble);if(hash(state)!==hash(row.before))throw Error('Wrong start');
 const run:any={state,stage:'',target:null,history:[],turns:0};let pending:PendingPlan|null=null;
 const history:any[]=[];
 for(const step of row.steps){
  if(hash(step.before)!==hash(state))throw Error('Discontinuous action');let index=0;let alg='';let excluded:string|null=null;
  const ask=async(request:any)=>{const e=step.exchanges[index++];if(!e||JSON.stringify(request)!==JSON.stringify(e.request))throw Error(`Request drift ${row.id}:${row.variant}`);
   const event=db.query("SELECT payload FROM events WHERE run_id=? AND kind='request' AND json_extract(payload,'$.id')=?").get(row.runId,e.id) as any;if(!event||JSON.stringify(JSON.parse(event.payload).request)!==JSON.stringify(e.request))throw Error('Wire mismatch');validateResponse(e.nativeResponse,e.request);return e.response;};
  if(step.recovery){const e=step.exchanges[index++];if(e.response.answers.recovery.choice!==step.recovery)throw Error('Recovery mismatch');if(step.recovery==='undo')alg=inverse(run.history.at(-1));if(step.recovery==='retarget')excluded=run.target;}
  if(step.decision){const same=history.filter(s=>hash(s.before)===hash(state));const d:any=await (row.variant==='baseline'?baseline:candidate)(run,ask,same.slice(-3).map(s=>({action:s.alg,target:s.decision?.target,factsBefore:facts(s.before),factsAfter:facts(s.after)})),excluded,pending);if(JSON.stringify(d)!==JSON.stringify(step.decision))throw Error('Decision mismatch');alg=d.alg;run.stage=d.goal;run.target=d.target;}
  if(index!==step.exchanges.length)throw Error('Unreplayed response');
  if(step.after){if(alg!==step.alg)throw Error('Algorithm mismatch');state=await apply(state,alg);if(hash(state)!==hash(step.after))throw Error('State mismatch');run.turns+=alg.split(/\s+/).filter(Boolean).length;if(run.turns>100)throw Error('Turn cap exceeded');run.history.push(alg);run.state=state;history.push(step);pending=step.decision?.early?.preparation==='clear'?{target:step.decision.target,front:step.decision.front,routine:step.decision.early.plannedRoutine,preparation:'clear',setup:alg}:null;}
 }
 if(hash(state)!==hash(row.after)||row.turns!==run.turns||(row.status==='solved')!==isSolved(state))throw Error('Final outcome mismatch');
 const ledger=db.query('SELECT COUNT(*) n,SUM(amount) cost FROM ledger WHERE run_id=?').get(row.runId) as any;if(ledger.n>500)throw Error('Request cap');
 const stages:Record<string,number>={};for(const s of history)stages[s.decision?.goal??'recovery']=(stages[s.decision?.goal??'recovery']??0)+s.alg.split(/\s+/).length;
 checked.push({id:row.id,variant:row.variant,status:row.status,turns:row.turns,requests:ledger.n,cost:ledger.cost,elapsedMs:row.elapsedMs,stages,finalFacts:facts(state)});
}
const commitment=(db.query('SELECT SUM(amount) total FROM ledger').get() as any).total;if(commitment>9||data.usage.cost>.06)throw Error('Budget exceeded');db.close();
const result={partial,checked:checked.length,projectCommitment:commitment,rows:checked};writeFileSync(`${dir}/${partial?'partial-verification':'verification'}.json`,JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
