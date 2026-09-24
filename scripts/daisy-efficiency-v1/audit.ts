// Evaluator-only counterfactual audit. Never imported by a live policy.
import {readFileSync,writeFileSync} from 'node:fs';
import {pieces,apply,mapAlg} from '../../src/lib/cube';
import reference from '../brain-early-v3/routine-reference.json';
const data=JSON.parse(readFileSync('experiments/diagonal-corners-v1/fresh-development/results.json','utf8')),rows=[];
for(const run of data.rows)for(const [index,s] of run.steps.entries()){
 if(s.decision?.goal!=='daisy'||!s.alg)continue;
 const before=pieces(s.before),target=s.decision.target,front=s.decision.front;
 const protectedPetals=before.filter(p=>p.kind==='edge'&&p.stickers.yellow==='U').map(p=>p.piece);
 const protectedBottom=before.filter(p=>p.kind==='edge'&&p.piece.includes('D')&&p.solved).map(p=>p.piece);
 const feasible=[];
 for(const r of reference){
  const alg=mapAlg(r.sequence,front),after=pieces(await apply(s.before,alg));
  if(after.find(p=>p.piece===target)?.stickers.yellow!=='U')continue;
  if(!protectedPetals.every(id=>after.find(p=>p.piece===id)?.stickers.yellow==='U')||!protectedBottom.every(id=>after.find(p=>p.piece===id)?.solved))continue;
  feasible.push({id:r.id,alg,turns:alg.split(' ').length});
 }
 const chosenTurns=s.alg.split(' ').length,min=feasible.length?Math.min(...feasible.map(r=>r.turns)):null;
 if(min!==null&&min<chosenTurns)rows.push({run:run.id,round:index,chosen:s.alg,chosenSkill:s.decision.skill,chosenTurns,minimumInFixedVocabulary:min,alternatives:feasible.filter(r=>r.turns===min),protectedPetals,protectedBottom});
}
writeFileSync('experiments/daisy-efficiency-v1/audit.json',JSON.stringify(rows,null,2));console.log(rows);
