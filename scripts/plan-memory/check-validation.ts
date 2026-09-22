import {readFileSync,writeFileSync} from 'node:fs';
import {apply,solved,pieces,hash,turns} from '../../src/lib/cube';
import {preconditionObservation} from '../../src/server/action-preconditions';
import reference from '../brain-early-v3/routine-reference.json';
import {planCommitRequest} from './check';
import {createRun} from '../../src/server/runner';
import {evaluate,budget} from '../../src/server/jev';
import {getRun,saveRun} from '../../src/server/store';
const dir='experiments/plan-memory-v1';
writeFileSync(`${dir}/commit-validation-started.json`,JSON.stringify({at:new Date().toISOString(),scope:'24 new physical states, four each valid/changed target/frame/position/yellow direction/protected bottom. Previous plan is synthetic fixture context. No execution or integration claim.',requests:24,dollars:0.01,retries:0}),{flag:'wx'});
if(readFileSync(`${dir}/commit-check-policy.ts`,'utf8')!==readFileSync('scripts/plan-memory/check.ts','utf8'))throw new Error('Commit policy changed');
const seen=new Set([...JSON.parse(readFileSync(`${dir}/development-fixtures.json`,'utf8')),...JSON.parse(readFileSync(`${dir}/validation-fixtures.json`,'utf8'))].map((c:any)=>c.stateHash));
const cases:any[]=[],counts:Record<string,number>={};let seed=654321;const rand=(n:number)=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)%n;};
const base=await solved();
for(let n=0;n<3000&&cases.length<24;n++){
 const scramble=Array.from({length:2+rand(13)},()=>turns[rand(turns.length)]).join(' '),state=await apply(base,scramble),h=hash(state);if(seen.has(h))continue;
 for(const target of ['DF','DR','DB','DL'])for(const front of ['F','R','B','L']){
  if(seen.has(h))continue;
  const obs=preconditionObservation(state,target,front,'lift-bottom'),ring=['F','R','B','L'],offset=ring.indexOf(front),rename=(f:string)=>ring.includes(f)?ring[(ring.indexOf(f)-offset+4)%4]:f;
  const protectedBottomSlots=pieces(state).filter(p=>p.kind==='edge'&&p.piece.includes('D')&&p.solved).map(p=>[...p.position].map(rename).join(''));
  const matching=reference.filter(r=>r.position===obs.target.position&&r.yellowDirection===obs.target.yellowDirection);
  for(const category of ['valid','target','frame','position','direction','protected']){
   if(seen.has(h)||(counts[category]??0)>=4)continue;
   const routine=category==='protected'?matching.find(r=>r.affectedBottomSlots.some(s=>protectedBottomSlots.includes(s))):matching.find(r=>!r.affectedBottomSlots.some(s=>protectedBottomSlots.includes(s)));
   if(!routine)continue;
   const pending={target,front,routine:routine.id,preparation:'clear',setup:'U'};
   if(category==='target')pending.target=['DF','DR','DB','DL'].find(t=>t!==target)!;
   if(category==='frame')pending.front=ring.find(f=>f!==front)!;
   if(category==='position'){const wrong=reference.find(r=>r.position!==routine.position&&r.yellowDirection===routine.yellowDirection);if(!wrong)continue;pending.routine=wrong.id;}
   if(category==='direction'){const wrong=reference.find(r=>r.position===routine.position&&r.yellowDirection!==routine.yellowDirection);if(!wrong)continue;pending.routine=wrong.id;}
   const current={target,front,position:obs.target.position,yellowDirection:obs.target.yellowDirection,protectedBottomSlots};
   cases.push({id:`new-${cases.length+1}`,category,scramble,state,stateHash:h,current,pending,expected:category==='valid'?'resume':'reconsider'});counts[category]=(counts[category]??0)+1;seen.add(h);
  }
 }
}
if(cases.length!==24)throw new Error('Insufficient coverage '+JSON.stringify(counts));
writeFileSync(`${dir}/commit-validation-fixtures.json`,JSON.stringify(cases,null,2));
const rows:any[]=[];let cost=0;
for(const c of cases){
 const run=await createRun(c.scramble,'skills','plan-commit-validation'),row:any={caseId:c.id,category:c.category,runId:run.id,expected:c.expected};rows.push(row);
 try{const b=budget();if(cost+0.002688>0.01||b.reservedAndSpent+0.002688>b.cap)throw new Error('Budget');row.exchange=await evaluate(run.id,planCommitRequest(c.current,c.pending),AbortSignal.timeout(30000),{maxAttempts:1});cost+=row.exchange.cost;row.actual=row.exchange.response.answers.plan.choice;row.correct=row.actual===c.expected;
 }catch(e){row.error=String(e);row.correct=false;}
 const saved=getRun(run.id);saved.status='stopped';saved.reason='Plan commitment fresh component validation';saveRun(saved);writeFileSync(`${dir}/commit-validation-results.json`,JSON.stringify({rows,cost},null,2));
}
console.log(JSON.stringify({correct:rows.filter(r=>r.correct).length,total:24,cost,counts}));
