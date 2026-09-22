import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {apply,pieces,hash,mapAlg,facts} from '../../src/lib/cube';
import {preconditionObservation} from '../../src/server/action-preconditions';
import reference from '../brain-early-v3/routine-reference.json';
const dir='experiments/plan-memory-v1';mkdirSync(dir,{recursive:true});
const seen=new Set<string>(),cases:any[]=[];
// Put the known loop in development, then retain distinct recorded setup situations.
for(const study of ['brain-full-v2-transport-validation','brain-full-v2-validation','brain-full-v2']){
 const data=JSON.parse(readFileSync(`experiments/${study}/results.json`,'utf8'));
 for(const run of [...data.rows].reverse())for(let i=1;i<run.steps.length;i++){
  const prior=run.steps[i-1],state=run.steps[i].before,d=prior.decision;
  if(!prior.after||d?.early?.preparation!=='clear'||seen.has(hash(state)))continue;
  const target=d.target,front=d.front,pending={target,front,routine:d.early.plannedRoutine,preparation:'clear',setup:prior.alg};
  const obs=preconditionObservation(state,target,front,pending.routine);
  const ring=['F','R','B','L'],offset=ring.indexOf(front),rename=(f:string)=>ring.includes(f)?ring[(ring.indexOf(f)-offset+4)%4]:f;
  const protectedBottomSlots=pieces(state).filter(p=>p.kind==='edge'&&p.piece.includes('D')&&p.solved).map(p=>[...p.position].map(rename).join(''));
  const accepted=[];
  for(const routine of reference){
   if(routine.position!==obs.target.position||routine.yellowDirection!==obs.target.yellowDirection)continue;
   if(routine.affectedBottomSlots.some(s=>protectedBottomSlots.includes(s))||routine.requiredFreeSlots.some(s=>obs.yellowUpPetals[s]))continue;
   const after=await apply(state,mapAlg(routine.sequence,front));
   const p=pieces(after).find(p=>p.kind==='edge'&&p.piece===target)!;
   if(facts(after).daisy>=facts(state).daisy&&(p.stickers.yellow==='U'||p.position!==pieces(state).find(p=>p.kind==='edge'&&p.piece===target)!.position))accepted.push(routine.id);
  }
  // This suite measures finishing a successful setup. Incomplete setups remain out of scope.
  if(!accepted.length)continue;
  seen.add(hash(state));
  const question=prior.exchanges.find((e:any)=>e.request.questions.routine).request.questions.routine;
  cases.push({id:`case-${cases.length+1}`,origin:{study,runId:run.runId,step:i},state,stateHash:hash(state),target,front,pending,accepted,request:{model:'jev-1.13.0',state:{target:obs.target,protectedBottomSlots,previouslyRejectedByModel:[]},questions:{routine:question}}});
 }
}
if(cases.length<24)throw new Error('Not enough recorded setups: '+cases.length);
writeFileSync(`${dir}/development-fixtures.json`,JSON.stringify(cases.slice(0,20),null,2),{flag:'wx'});
const validation=cases.slice(20);
for(const c of validation.slice(0,6)){
 const guard=structuredClone(c);guard.id+='-stale-memory';
 guard.pending.routine=reference.find(r=>r.position!==c.request.state.target.position)!.id;
 guard.memoryPerturbation='Counterfactual stale or mistaken previous routine; current observation and offline acceptable moves unchanged.';
 validation.push(guard);
}
writeFileSync(`${dir}/validation-fixtures.json`,JSON.stringify(validation,null,2),{flag:'wx'});
console.log({development:20,validation:validation.length});
