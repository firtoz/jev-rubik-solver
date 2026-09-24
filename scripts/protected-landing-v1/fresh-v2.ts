import {readFileSync,writeFileSync} from 'node:fs';
import {pieces,hash,apply,mapAlg,solved} from '../../src/lib/cube';
import {preconditionObservation} from '../../src/server/action-preconditions';
import {observe} from './policy';
import reference from '../brain-early-v3/routine-reference.json';
const gate=JSON.parse(readFileSync('experiments/protected-landing-v1/dispatch-v2/verification.json','utf8'));if(gate.scores[0].passed!==36)throw Error('Development gate');
const used=new Set(['fixtures','validation-fixtures'].flatMap(n=>JSON.parse(readFileSync(`experiments/protected-landing-v1/${n}.json`,'utf8')).map((f:any)=>hash(f.before))));
const selected:any[]=[];const counts:Record<string,number>={execute:0,clear:0,lower:0,reorient:0};
let seed=Date.now()>>>0;const initialSeed=seed;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const turns=['U',"U'",'U2','F',"F'",'F2','R',"R'",'R2','B',"B'",'B2','L',"L'",'L2','D',"D'",'D2'];
for(let attempt=0;attempt<10000&&selected.length<20;attempt++){
 const scramble=Array.from({length:2+Math.floor(rand()*12)},()=>turns[Math.floor(rand()*turns.length)]).join(' ');
 const before=await apply(await solved(),scramble);if(used.has(hash(before)))continue;let added=false;
 for(const p of pieces(before).filter(p=>p.kind==='edge'&&p.piece.includes('D')&&!p.solved)){
  if(added)break;
  const front=['F','R','B','L'].includes(p.stickers.yellow)?p.stickers.yellow:p.position.replace(/[UD]/g,'');if(!['F','R','B','L'].includes(front))continue;
  for(const routine of reference){
   const obs=preconditionObservation(before,p.piece,front,routine.id);obs.selectedRoutine.requiredFreeSlots=routine.requiredFreeSlots;
   const state=observe(before,front,obs);
   if(state.target.position!==routine.position||state.target.yellowDirection!==routine.yellowDirection||routine.affectedBottomSlots.some(s=>state.protectedBottomSlots.includes(s)))continue;
   const blocked=state.selectedRoutine.requiredFreeSlots.some(s=>state.yellowUpPetals[s]);
   const expected=!blocked?'execute':state.target.layer!=='top'?'clear':state.protectedBottomSlots.includes('DF')?'reorient':'lower';if(counts[expected]>=5)continue;
   const protectedIds=pieces(before).filter(p=>p.kind==='edge'&&p.piece.includes('D')&&p.solved).map(p=>p.piece);
   const after=await apply(before,mapAlg('F',front));if(pieces(after).some(p=>protectedIds.includes(p.piece)&&!p.solved)!==state.protectedBottomSlots.includes('DF'))throw Error('Frame mismatch');
   if(expected==='execute'){
    const afterRoutine=await apply(before,mapAlg(routine.sequence,front));
    if(pieces(afterRoutine).some(p=>protectedIds.includes(p.piece)&&!p.solved))throw Error('Routine protection failed');
   }
   counts[expected]++;selected.push({id:`new-landing-${selected.length+1}`,scramble,before,front,state,expected});used.add(hash(before));added=true;break;
  }
 }
}
if(selected.length!==20)throw Error('Coverage incomplete');
writeFileSync('experiments/protected-landing-v1/fresh-v2-fixtures.json',JSON.stringify(selected,null,2),{flag:'wx'});
writeFileSync('experiments/protected-landing-v1/fresh-v2-generation.json',JSON.stringify({initialSeed,counts},null,2),{flag:'wx'});console.log(counts);
