// Evaluator only: identify already aligned petals in recorded cross decisions.
import {readFileSync,writeFileSync} from 'node:fs';
import {pieces} from '../../src/lib/cube';
const d=JSON.parse(readFileSync('experiments/diagonal-corners-v1/fresh-development/results.json','utf8')),rows=[];
for(const r of d.rows)for(const [round,s] of r.steps.entries()){
 if(s.decision?.goal!=='cross'||s.decision?.intent!=='align')continue;
 const aligned=pieces(s.before).filter(p=>p.kind==='edge'&&p.stickers.yellow==='U'&&p.position==='U'+p.piece.slice(1)).map(p=>p.piece);
 if(aligned.length)rows.push({id:r.id,round,chosenTarget:s.decision.target,alignedPetals:aligned,move:s.alg});
}
writeFileSync('experiments/daisy-efficiency-v1/transfer-audit.json',JSON.stringify(rows,null,2));console.log(rows);
