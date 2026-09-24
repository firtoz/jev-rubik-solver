import {readFileSync,writeFileSync} from 'node:fs';
import {facts,hash} from '../../src/lib/cube';
const dir='experiments/diagonal-corners-v1/fresh-development';
const data=JSON.parse(readFileSync(dir+'/results.json','utf8')),verified=JSON.parse(readFileSync(dir+'/verification.json','utf8'));
if(verified.partial||verified.checked!==8||data.rows.length!==8||data.rows.some((r:any)=>r.status==='running'))throw Error('Eight verified terminal records required');
const rows=data.rows.map((r:any)=>{
 const v=verified.rows.find((v:any)=>v.id===r.id),seen=new Set<string>();let repeats=0,diagonal=0,recoveries=0,transport=0;
 for(const s of r.steps){
  if(seen.has(hash(s.before)))repeats++;seen.add(hash(s.before));
  if(s.alg&&s.decision?.skill?.startsWith('diagonal@'))diagonal++;
  if(s.recovery)recoveries++;
  transport+=s.transportErrors?.length??0;
 }
 return {...v,repeatedStates:repeats,diagonalRoutines:diagonal,recoveries,transportErrors:transport,lastDecision:r.steps.at(-1)?.decision,unexecutedRoutine:r.steps.at(-1)?.selectedAlg&&!r.steps.at(-1)?.alg?r.steps.at(-1).selectedAlg:null};
});
const successful=rows.filter((r:any)=>r.status==='solved'),turns=successful.map((r:any)=>r.turns).sort((a:number,b:number)=>a-b);
const summary={attempted:8,solved:successful.length,capped:rows.filter((r:any)=>r.status==='capped').length,other:rows.filter((r:any)=>!['solved','capped'].includes(r.status)).map((r:any)=>({id:r.id,status:r.status})),successfulTurns:turns,successfulMean:turns.length?turns.reduce((a:number,b:number)=>a+b,0)/turns.length:null,usage:data.usage,projectCommitment:verified.projectCommitment,rows};
writeFileSync(dir+'/report.json',JSON.stringify(summary,null,2));console.log(JSON.stringify(summary,null,2));
