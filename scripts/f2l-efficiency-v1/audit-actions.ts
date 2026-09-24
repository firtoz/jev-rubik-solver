import {readFileSync,writeFileSync} from 'node:fs';
import {facts,pieces} from '../../src/lib/cube';
const input='experiments/last-layer-efficiency-v1/full-integration/results.json';
const data=JSON.parse(readFileSync(input,'utf8'));
const rows=data.rows.map((r:any)=>{
 const steps=r.steps.filter((s:any)=>s.alg&&s.decision?.goal==='f2l');
 const groups:Record<string,{actions:number;turns:number}>={};
 const actions=steps.map((s:any)=>{
  const prep=s.decision.f2l.preparation;
  groups[prep]??={actions:0,turns:0};groups[prep].actions++;groups[prep].turns+=s.alg.split(' ').length;
  const newlySolved=pieces(s.after).filter(p=>!p.piece.includes('U')&&p.solved&&!pieces(s.before).find(b=>b.piece===p.piece)!.solved).map(p=>p.piece);
  return {target:s.decision.target,preparation:prep,routine:s.decision.skill,alg:s.alg,turns:s.alg.split(' ').length,newlySolved,middleAfter:facts(s.after).middle};
 });
 return {id:r.id,groups,actions};
});
writeFileSync('experiments/f2l-efficiency-v1/action-audit.json',JSON.stringify({input,rows},null,2));
console.log(JSON.stringify(rows.map((r:any)=>({id:r.id,groups:r.groups})),null,2));
