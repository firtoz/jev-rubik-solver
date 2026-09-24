import {observe as protectedObservation,destinationRequest,turnRequest} from './policy';
import {readinessRequest,preparationRequest} from './sequential-v2';
import {request as costRequest} from '../daisy-efficiency-v1/policy-v2';
import {pieces,mapAlg} from '../../src/lib/cube';
import type {CubeData,JevRequest} from '../../src/lib/types';
import {observe,aggregate,measuredChecks,planning,situationOptions,type Answers,type Memory} from '../observation-boundary/policy';
import {preconditionObservation,preconditionRequest} from '../../src/server/action-preconditions';
import reference from '../brain-early-v3/routine-reference.json';
export type Ask=(request:JevRequest)=>Promise<Answers>;
const request=(state:unknown,key:string,instructions:string,criteria:Record<string,string>):JevRequest=>({model:'jev-1.13.0',state,questions:{[key]:{type:'choice',instructions,criteria}}});
const uOptions={U:'UF→UL, UL→UB, UB→UR, UR→UF',"U'":'UF→UR, UR→UB, UB→UL, UL→UF',U2:'UF↔UB, UR↔UL'};
const directionNames:Record<string,string>={UF:'front',UR:'right',UB:'back',UL:'left'};
const directionOptions={U:'Quarter turn: front to left; left to back; back to right; right to front.',"U'":'Quarter turn: front to right; right to back; back to left; left to front.',U2:'Half turn: front to back, back to front, left to right, or right to left.'};
export function rotationRequest(currentPosition:string,requiredPosition:string){
 return request({currentPosition:directionNames[currentPosition],requiredPosition:directionNames[requiredPosition]},'setup','Choose the upper-face turn carrying the empty space from its current position to the required position. Read source and destination as an ordered pair. A half turn goes to the opposite side; a quarter turn goes to a neighbouring side. This fixed reference applies to any cube.',directionOptions);
}
export function planRequest(state:CubeData,memory:Memory){
 const o=observe(state,memory),summary=aggregate(measuredChecks(o)),r=planning(o,summary,'player');
 const uncollected=o.edges.filter(p=>summary.checks[`petal_${p.id}`]==='no'&&summary.checks[`bottom_${p.id}`]==='no').length;
 r.state={...r.state as object,uncollectedYellowEdges:uncollected};
 r.questions.goal.instructions='Follow the daisy-first method. uncollectedYellowEdges counts yellow edges that are neither yellow-up petals nor solved bottom edges. If this is greater than zero, choose daisy. If it is zero and counts.bottom is four, choose first-layer. If it is zero and counts.bottom is less than four, choose cross. These are current measurements, not a supplied goal. Preserve existing petals and solved bottom edges.';
 return r;
}
export function focusRequest(state:CubeData,target:string):JevRequest{
 const p=pieces(state).find(p=>p.kind==='edge'&&p.piece===target);
 if(!p)throw new Error('Unknown target');
 return {model:'jev-1.13.0',state:{currentPosition:p.position,yellowDirection:p.stickers.yellow},questions:{
  situation:{type:'choice',instructions:'Classify this selected edge using ONLY currentPosition and yellowDirection. First check yellowDirection=U (petal). Otherwise currentPosition starting D is bottom; starting U is top; all other edge positions are middle. The piece identity is deliberately omitted.',criteria:situationOptions},
  reference:{type:'choice',instructions:'Choose the reference front. If yellowDirection is F/R/B/L, choose that face. If yellowDirection is U or D, choose the other letter of currentPosition. Use current position only.',criteria:{F:'Front F',R:'Front R',B:'Front B',L:'Front L'}},
 }};
}
export async function decide(state:CubeData,ask:Ask,memory:Memory={target:null,recentActions:[]}){
 const plan=await ask(planRequest(state,memory));
 if(plan.goal==='first-layer')return {plan,target:null,front:null,routine:null,preparation:null,alg:''};
 const target=plan.goal==='daisy'?plan.gatherTarget:plan.transferTarget;
 if(target==='none')return {plan,target,front:null,routine:null,preparation:null,alg:''};
 const recognised=await ask(focusRequest(state,target)),front=recognised.reference;
 let routine:string,preparation:string,alg:string,plannedRoutine:string|undefined;
 const recovery:Answers[]=[];
 if(plan.goal==='cross'){
  const obs=preconditionObservation(state,target,front,'daisy-to-cross');
  preparation=(await ask(preconditionRequest(obs,'transfer','rule'))).decision;
  if(preparation==='insert'){routine='daisy-to-cross';alg=mapAlg('F2',front);}
  else {
   const requiredPosition='U'+Object.entries(obs.centers).find(([f,c])=>f!=='U'&&f!=='D'&&c===obs.target.sideColor)![0];
   routine=(await ask(request({currentPosition:obs.target.position,requiredPosition},'setup','Choose the U rotation moving currentPosition to requiredPosition using the fixed cycles. These are present geometric locations, not predicted outcomes.',uOptions))).setup;
   alg=mapAlg(routine,front);
  }
 }else{
  const sample=preconditionObservation(state,target,front,'lift-bottom');
  const ring=['F','R','B','L'],offset=ring.indexOf(front),rename=(f:string)=>ring.includes(f)?ring[(ring.indexOf(f)-offset+4)%4]:f;
  const protectedBottomSlots=pieces(state).filter(p=>p.kind==='edge'&&p.piece.includes('D')&&p.solved).map(p=>[...p.position].map(rename).join(''));
  const rejectedRoutines:string[]=[];
  for(let attempt=0;;attempt++){
   plannedRoutine=(await ask(costRequest(request({target:sample.target,protectedBottomSlots,previouslyRejectedByModel:rejectedRoutines},'routine','Choose a routine whose position AND yellow direction match the current target, with no affectedBottomSlot in protectedBottomSlots. Ignore landing occupancy for now. Prefer a lift over staging initially. If a previous routine was rejected by the model, choose a different matching routine, including a staging routine. Do not repeat a rejected routine.',{...Object.fromEntries(reference.map(r=>[r.id,JSON.stringify(r)])),reconsider:'No matching routine remains.'})))).routine;
   routine=plannedRoutine;preparation='unassessed';alg='';
   if(routine!=='reconsider'){
    const selected=reference.find(r=>r.id===routine);if(!selected)throw new Error('Unknown routine');
    const obs=preconditionObservation(state,target,front,routine);obs.selectedRoutine.requiredFreeSlots=selected.requiredFreeSlots;
    const protectedObs=protectedObservation(state,front,obs);
    const readiness=(await ask(readinessRequest(protectedObs))).readiness;
    // Dispatch JEV's execute answer directly; code does not assess slot readiness.
    preparation=readiness==='execute'?'execute':(await ask(preparationRequest(protectedObs))).decision;
    if(preparation==='reorient'){
     const destination=(await ask(destinationRequest(protectedObs))).destination;
     if(destination==='none'){routine='reconsider';alg='';break;}
     routine=(await ask(turnRequest(protectedObs.target.position,destination))).setup;
     alg=mapAlg(routine,front);break;
    }
    if(preparation==='execute'){alg=mapAlg(selected.sequence,front);break;}
    if(preparation==='lower'){routine='lower-top-edge';alg=mapAlg('F',front);break;}
    const freeSlots=Object.entries(obs.yellowUpPetals).filter(([,v])=>!v).map(([s])=>s);
    if(selected.requiredFreeSlots.length===1){
     const freeSlot=(await ask(request({freeSlots},'freeSlot','Choose any currently free slot from freeSlots. This chooses an empty space to bring to the required landing position, not a turn.',Object.fromEntries(['UF','UR','UB','UL'].map(s=>[s,`Choose ${s} only if it occurs in freeSlots`]))))).freeSlot;
     routine=(await ask(rotationRequest(freeSlot,selected.requiredFreeSlots[0]))).setup;
    }else{
     routine=(await ask(request({freeSlots,requiredFreeSlots:selected.requiredFreeSlots},'setup','Choose a U rotation that moves the current freeSlots onto ALL requiredFreeSlots. Track empty spaces, not occupied petals. Rotating preserves the shape of the empty pattern: opposite empties cannot become adjacent empties. Choose reconsider if no rotation works.',{...uOptions,reconsider:'No U rotation makes all required slots free.'}))).setup;
    }
    if(routine!=='reconsider'){alg=mapAlg(routine,front);break;}
   }
   if(attempt>=1)break;
   const decision=await ask(request({selectedRoutine:plannedRoutine,setupAnswer:routine,target:sample.target},'recovery','The selected plan produced no executable move. Decide whether to try a different learned routine for the same target or stop this cycle. Do not invent a move.',{another:'Choose a different routine, possibly staging this edge first',stop:'Stop this cycle for inspection'}));
   recovery.push(decision);
   if(decision.recovery!=='another')break;
   rejectedRoutines.push(plannedRoutine);
  }
 }
 return {plan,target,front,routine,preparation,recognised,plannedRoutine,recovery,alg};
}
