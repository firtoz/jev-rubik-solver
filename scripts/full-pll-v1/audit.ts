// Evaluator-only: never imported by any live policy.
import {readFileSync,writeFileSync} from 'node:fs';
import {pieces,apply,isSolved} from '../../src/lib/cube';
const catalog=JSON.parse(readFileSync('experiments/full-pll-v1/catalog.json','utf8'));
const records=[];
for(const path of ['experiments/diagonal-corners-v1/fresh-development/results.json','experiments/protected-landing-v1/full-integration/results.json']){
 for(const row of JSON.parse(readFileSync(path,'utf8')).rows){
  const index=row.steps.findIndex((s:any)=>s.decision?.goal==='top-corners');if(index<0)continue;
  const before=row.steps[index].before;
  const pattern=Object.fromEntries(pieces(before).filter(p=>p.position.includes('U')&&(p.kind==='corner'||p.kind==='edge')).map(p=>[p.position,p.destination]));
  const routine=catalog.illustrations.find((r:any)=>JSON.stringify(r.pattern)===JSON.stringify(pattern));if(!routine)throw Error('Missing reference');
  if(!isSolved(await apply(before,routine.alg)))throw Error('Reference failed');
  const spent=row.steps.slice(0,index).reduce((n:number,s:any)=>n+(s.alg?.split(/\s+/).filter(Boolean).length??0),0);
  records.push({source:path,id:row.id,recordedStatus:row.status,recordedTurns:row.turns,turnsBeforePLL:spent,reference:routine.id,referenceTurns:routine.turns,counterfactualTotal:spent+routine.turns});
 }
}
writeFileSync('experiments/full-pll-v1/offline-audit.json',JSON.stringify({warning:'Reference coverage only, not JEV choices or new solves. Not a live-policy candidate ranking.',records},null,2));console.log(records);
