import {readFileSync,writeFileSync} from 'node:fs';
import {solved,apply,pieces} from '../../src/lib/cube';
const dir='experiments/alignment-efficiency-v1/full-integration',d=JSON.parse(readFileSync(dir+'/results.json','utf8')),base=await solved(),rows=[];
for(const r of d.rows)for(const s of r.steps){
 if(s.decision?.goal!=='f2l'||!s.decision?.f2l?.preparation?.startsWith('align'))continue;
 const x=s.exchanges.at(-1),state=x.request.state,choice=x.response.answers.turn.choice;
 const after=await apply(base,choice==='reconsider'?'':choice);
 rows.push({id:r.id,source:state.currentPosition,destination:state.requiredPosition,choice,correct:pieces(after).find(p=>p.piece===state.currentPosition)!.position===state.requiredPosition});
}
writeFileSync(dir+'/alignment-audit.json',JSON.stringify({rows,correct:rows.filter(r=>r.correct).length,n:rows.length},null,2));console.log({correct:rows.filter(r=>r.correct).length,n:rows.length});
