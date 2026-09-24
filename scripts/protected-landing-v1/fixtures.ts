import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {observe} from './policy';
import {apply,pieces,mapAlg} from '../../src/lib/cube';
const sources=['stage-comparison','stage-validation'];
const cases:any[]=[];const seen=new Set<string>();
for(const source of sources){const data=JSON.parse(readFileSync(`experiments/daisy-efficiency-v1/${source}/results.json`,'utf8'));
 for(const row of data.rows)for(const step of row.steps)for(const e of step.exchanges){
  const s=e.request.state;if(!e.request.questions.decision||!s.selectedRoutine?.requiredFreeSlots||!step.decision?.front||!e.request.questions.decision.criteria.lower)continue;
  const state=observe(step.before,step.decision.front,s);
  const blocked=state.selectedRoutine.requiredFreeSlots.some((slot:string)=>state.yellowUpPetals[slot]);
  const expected=!blocked?'execute':state.target.layer!=='top'?'clear':state.protectedBottomSlots.includes('DF')?'reorient':'lower';
  const key=JSON.stringify(state);if(seen.has(key))continue;seen.add(key);
  // Independently check the factual protection claim against the cube transformation.
  const protectedIds=pieces(step.before).filter(p=>p.kind==='edge'&&p.piece.includes('D')&&p.solved).map(p=>p.piece);
  const after=await apply(step.before,mapAlg('F',step.decision.front));
  const harmed=pieces(after).some(p=>protectedIds.includes(p.piece)&&!p.solved);
  if(harmed!==state.protectedBottomSlots.includes('DF'))throw Error('Protection mapping mismatch');
  cases.push({id:`landing-${cases.length+1}`,source,runId:row.runId,before:step.before,front:step.decision.front,state,expected});
 }
}
// Stratified development diagnostic, not a claim of independent held-out coverage.
const selected:any[]=[];for(const answer of ['reorient','lower','clear','execute'])selected.push(...cases.filter(c=>c.expected===answer).slice(0,5));
for(const c of cases)if(selected.length<20&&!selected.includes(c))selected.push(c);
mkdirSync('experiments/protected-landing-v1',{recursive:true});
writeFileSync('experiments/protected-landing-v1/fixtures.json',JSON.stringify(selected,null,2));
console.log({available:cases.length,selected:selected.length,counts:Object.fromEntries(['reorient','lower','clear','execute'].map(k=>[k,selected.filter(c=>c.expected===k).length]))});
