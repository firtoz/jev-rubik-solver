import {readFileSync,writeFileSync} from 'node:fs';
import {pieces,hash,apply,mapAlg} from '../../src/lib/cube';
import {preconditionObservation} from '../../src/server/action-preconditions';
import {observe} from './policy';
import reference from '../brain-early-v3/routine-reference.json';
const used=new Set(JSON.parse(readFileSync('experiments/protected-landing-v1/fixtures.json','utf8')).map((f:any)=>hash(f.before)));
const selected:any[]=[];const counts:Record<string,number>={execute:0,clear:0,lower:0,reorient:0};
// Evaluator-only construction. Matching the reference here never enters policy requests.
for(const source of ['stage-comparison','stage-validation']){
 const rows=JSON.parse(readFileSync(`experiments/daisy-efficiency-v1/${source}/results.json`,'utf8')).rows;
 for(const row of rows)for(const step of row.steps){
  if(used.has(hash(step.before)))continue;
  let added=false;
  for(const p of pieces(step.before).filter(p=>p.kind==='edge'&&p.piece.includes('D')&&!p.solved)){
   if(added)break;
   const front=['F','R','B','L'].includes(p.stickers.yellow)?p.stickers.yellow:p.position.replace(/[UD]/g,'');
   if(!['F','R','B','L'].includes(front))continue;
   for(const routine of reference){
    const obs=preconditionObservation(step.before,p.piece,front,routine.id);obs.selectedRoutine.requiredFreeSlots=routine.requiredFreeSlots;
    const state=observe(step.before,front,obs);
    // Static requirements are strings in this catalog; verify shape separately below.
    if(state.target.position!==(routine as any).position||state.target.yellowDirection!==(routine as any).yellowDirection)continue;
    if(routine.affectedBottomSlots.some(s=>state.protectedBottomSlots.includes(s)))continue;
    const blocked=state.selectedRoutine.requiredFreeSlots.some(s=>state.yellowUpPetals[s]);
    const expected=!blocked?'execute':state.target.layer!=='top'?'clear':state.protectedBottomSlots.includes('DF')?'reorient':'lower';
    if(counts[expected]>=5)continue;
    const protectedIds=pieces(step.before).filter(p=>p.kind==='edge'&&p.piece.includes('D')&&p.solved).map(p=>p.piece);
    const after=await apply(step.before,mapAlg('F',front));
    if(pieces(after).some(p=>protectedIds.includes(p.piece)&&!p.solved)!==state.protectedBottomSlots.includes('DF'))throw Error('Protection mapping');
    counts[expected]++;selected.push({id:`fresh-landing-${selected.length+1}`,before:step.before,front,state,expected});used.add(hash(step.before));added=true;break;
   }
  }
 }
}
writeFileSync('experiments/protected-landing-v1/validation-fixtures.json',JSON.stringify(selected,null,2));console.log({n:selected.length,counts});
