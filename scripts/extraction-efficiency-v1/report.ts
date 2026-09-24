import {readFileSync,writeFileSync} from 'node:fs';
import {view} from './controller';
const dir='experiments/extraction-efficiency-v1/full-integration',d=JSON.parse(readFileSync(dir+'/results.json','utf8')),v=JSON.parse(readFileSync(dir+'/verification.json','utf8'));
const old=JSON.parse(readFileSync('experiments/diagonal-corners-v1/fresh-development/results.json','utf8'));
if(v.partial||v.checked!==4)throw Error('Four verified attempts required');
const analyze=(r:any)=>{
 const extractions=r.steps.filter((s:any)=>s.alg&&s.decision?.f2l?.preparation?.startsWith('extract'));
 const trapped=extractions.filter((s:any)=>{
  const {target,front,preparation}=s.decision.f2l,part=preparation==='extract-edge'?'corner':'edge',home=part==='corner'?'DRF':'FR';
  const before=view(s.before,target,front)[part].position,after=view(s.after,target,front)[part].position;
  return (before.includes('U')||before===home)&&!after.includes('U')&&after!==home;
 }).length;
 return {status:r.status,turns:r.turns,f2lTurns:r.steps.filter((s:any)=>s.alg&&s.decision?.goal==='f2l').reduce((n:number,s:any)=>n+s.alg.split(' ').length,0),extractions:extractions.length,partnerTraps:trapped};
};
const rows=d.rows.map((r:any)=>({id:r.id,baseline:analyze(old.rows.find((o:any)=>o.id===r.id)),candidate:analyze(r)}));
writeFileSync(dir+'/comparison.json',JSON.stringify({usage:d.usage,projectCommitment:v.projectCommitment,rows},null,2));console.log(rows);
