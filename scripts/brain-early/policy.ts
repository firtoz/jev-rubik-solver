import {pieces,mapAlg} from '../../src/lib/cube';
import type {CubeData,JevRequest} from '../../src/lib/types';
import {observe,aggregate,measuredChecks,planning,situation,type Answers,type Memory} from '../observation-boundary/policy';
import {preconditionObservation,preconditionRequest} from '../../src/server/action-preconditions';
import reference from './routine-reference.json';
export type Ask=(request:JevRequest)=>Promise<Answers>;
const request=(state:unknown,key:string,instructions:string,criteria:Record<string,string>):JevRequest=>({model:'jev-1.13.0',state,questions:{[key]:{type:'choice',instructions,criteria}}});
const uOptions={U:'UF→UL, UL→UB, UB→UR, UR→UF',"U'":'UF→UR, UR→UB, UB→UL, UL→UF',U2:'UF↔UB, UR↔UL'};
export async function decide(state:CubeData,ask:Ask,memory:Memory={target:null,recentActions:[]}){
 const observation=observe(state,memory), summary=aggregate(measuredChecks(observation));
 const plan=await ask(planning(observation,summary,'player'));
 if(plan.goal==='first-layer')return {plan,target:null,front:null,routine:null,preparation:null,alg:''};
 const target=plan.goal==='daisy'?plan.gatherTarget:plan.transferTarget;
 if(target==='none')return {plan,target,front:null,routine:null,preparation:null,alg:''};
 const recognised=await ask(situation(observation,plan.goal,target,'player')),front=recognised.reference;
 let routine:string,preparation:string,alg:string,plannedRoutine:string|undefined;
 if(plan.goal==='cross'){
  const obs=preconditionObservation(state,target,front,'daisy-to-cross');
  preparation=(await ask(preconditionRequest(obs,'transfer','rule'))).decision;
  if(preparation==='insert'){routine='daisy-to-cross';alg=mapAlg('F2',front);}
  else {
   const requiredPosition='U'+Object.entries(obs.centers).find(([f,c])=>f!=='U'&&f!=='D'&&c===obs.target.sideColor)![0];
   routine=(await ask(request({currentPosition:obs.target.position,requiredPosition},'setup','The model chose to align a yellow-up petal. Choose the U rotation that puts currentPosition at requiredPosition using the fixed cycles. These are current geometric positions, not simulated action outcomes.',uOptions))).setup;
   alg=mapAlg(routine,front);
  }
 }else{
  const sample=preconditionObservation(state,target,front,'lift-bottom');
  const ring=['F','R','B','L'],offset=ring.indexOf(front);
  const rename=(f:string)=>ring.includes(f)?ring[(ring.indexOf(f)-offset+4)%4]:f;
  const protectedBottomSlots=pieces(state).filter(p=>p.kind==='edge'&&p.piece.includes('D')&&p.solved).map(p=>[...p.position].map(rename).join(''));
  routine=(await ask(request({target:sample.target,protectedBottomSlots},'routine',
   'Choose a learned routine whose starting position AND yellow direction match target exactly. Avoid any routine whose affectedBottomSlots contains a protectedBottomSlot. This requirement matters even if its starting case matches. Ignore landing occupancy for now: the next question handles it. Prefer a lift over staging if both fit. Do not infer current position from a piece identity.',
   {...Object.fromEntries(reference.map(r=>[r.id,JSON.stringify(r)])),reconsider:'No known routine matches these starting conditions and preserves solved bottom edges.'}))).routine;
  plannedRoutine=routine;
  if(routine==='reconsider')return {plan,target,front,routine,preparation:null,alg:''};
  const selected=reference.find(r=>r.id===routine);
  if(!selected)throw new Error('Unknown routine');
  const obs=preconditionObservation(state,target,front,routine);
  obs.selectedRoutine.requiredFreeSlots=selected.requiredFreeSlots;
  preparation=(await ask(preconditionRequest(obs,'landing','rule'))).decision;
  if(preparation==='execute')alg=mapAlg(selected.sequence,front);
  else if(preparation==='lower'){routine='lower-top-edge';alg=mapAlg('F',front);}
  else {
   routine=(await ask(request({yellowUpPetals:obs.yellowUpPetals,requiredFreeSlots:selected.requiredFreeSlots},'setup','The model chose to clear space while the target remains below U. Choose a U rotation that leaves ALL requiredFreeSlots without yellow-up petals. Use the static cycles. Do not move a petal into another required slot. If no rotation works, choose reconsider.',{...uOptions,reconsider:'No single U rotation clears the required slots.'}))).setup;
   alg=routine==='reconsider'?'':mapAlg(routine,front);
  }
 }
 return {plan,target,front,routine,preparation,recognised,plannedRoutine,alg};
}
