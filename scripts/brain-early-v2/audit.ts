import { readFileSync, writeFileSync } from 'node:fs';
import { cube3x3x3 } from 'cubing/puzzles';
import { KPattern } from 'cubing/kpuzzle';
import { score } from './run';
const root='experiments/brain-early-v2';
const data=JSON.parse(readFileSync(`${root}/integration-results.json`,'utf8'));
const fixtures=JSON.parse(readFileSync(`${root}/development-fixtures.json`,'utf8'));
const puzzle=await cube3x3x3.kpuzzle();
const same=(a:any,b:any)=>JSON.stringify(a)===JSON.stringify(b);
const rows=[];
for(const row of data.rows){
 let state=new KPattern(puzzle,fixtures.find((c:any)=>c.id===row.caseId).state),turns=0;
 const steps=[];
 for(const [index,step] of row.steps.entries()){
  if(!same(state.patternData,step.before))throw new Error(`${row.caseId}/${index}: before mismatch`);
  const judged=step.decision?await score(step.before,step.decision):null;
  if(step.after){
   state=state.applyAlg(step.decision.alg);
   turns+=step.decision.alg.split(/\s+/).filter(Boolean).length;
   if(!same(state.patternData,step.after))throw new Error(`${row.caseId}/${index}: after mismatch`);
  }
  steps.push({index,alg:step.decision?.alg,score:judged,requests:step.exchanges.length});
 }
 if(!same(state.patternData,row.after)||turns!==row.turns)throw new Error('Final mismatch');
 // Fixed cubing edge coordinates DF, DR, DB, DL. No stage predicate from the policy.
 const cross=[4,5,6,7].every(i=>state.patternData.EDGES.pieces[i]===i&&state.patternData.EDGES.orientation[i]===0);
 if((row.status==='complete')!==cross)throw new Error('Cross status mismatch');
 rows.push({caseId:row.caseId,status:row.status,cross,turns,requests:steps.reduce((n,s)=>n+s.requests,0),steps});
}
writeFileSync(`${root}/integration-audit.json`,JSON.stringify({method:'Independent cubing replay and fixed bottom edge coordinates; diagnostic cycle scores use the offline evaluator only.',rows},null,2));
console.log(JSON.stringify(rows.map(r=>({...r,steps:r.steps.filter(s=>s.score&&!s.score.correct)})),null,2));
