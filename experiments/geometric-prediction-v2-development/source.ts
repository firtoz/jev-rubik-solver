import {mkdirSync,writeFileSync,existsSync,readFileSync} from 'node:fs';
import { fixtures } from './move-prediction';
import {names} from '../../src/lib/cube';
import {evaluate,budget,MODEL} from '../../src/server/jev';
import {createRun} from '../../src/server/runner';
import {getRun,saveRun} from '../../src/server/store';
import type {JevRequest} from '../../src/lib/types';
export const vectors:Record<string,number[]>={R:[1,0,0],L:[-1,0,0],U:[0,1,0],D:[0,-1,0],F:[0,0,1],B:[0,0,-1]};
export const coordinate=(slot:string)=>[...slot].reduce((v,f)=>v.map((x,i)=>x+vectors[f][i]),[0,0,0]);
const frame='Fixed right-handed axes: x points right, y up, z toward the front. Face directions: R=+x L=-x U=+y D=-y F=+z B=-z. A turn affects only pieces in its outer layer. Clockwise is viewed from outside looking inward at that face. Apply the rotation to the point and its sticker normal; a piece outside the layer stays unchanged.';
export function requestFor(source:JevRequest,variant:string,membership?:string):JevRequest {
 const s=source.state as any, face=s.proposedTurn[0], direction=s.proposedTurn.includes('2')?'half turn (180 degrees)':s.proposedTurn.includes("'")?'counterclockwise quarter turn':'clockwise quarter turn';
 const target={id:'selected-piece',kind:s.target.kind,touchingFaces:[...s.target.position],trackedStickerFacing:s.target.stickers[s.trackedSticker]};
 const coordinates={...target,center:coordinate(s.target.position),stickerNormal:vectors[s.target.stickers[s.trackedSticker]]};
 const state:any={target:variant==='neutral'?target:coordinates,turn:{face,outwardNormal:vectors[face],direction}};
 if(membership!==undefined)state.previousModelAnswer={affectedByTurn:membership};
 const criteria=Object.fromEntries((target.kind==='edge'?names.EDGES:names.CORNERS).map(p=>[p,variant==='neutral'?`Faces ${[...p].join(', ')}`:`Center [${coordinate(p)}], faces ${[...p].join(', ')}`]));
 if(variant==='membership')return {model:MODEL,state,questions:{affected:{type:'choice',instructions:frame+' Is the selected piece in the layer being turned? Compare its current center with the face normal. Choose yes or no. Do not predict a new position yet.',criteria:{yes:'The piece belongs to the turned layer.',no:'The piece lies outside the turned layer.'}}}};
 return {model:MODEL,state,questions:{position:{type:'choice',instructions:frame+' Predict the selected piece center after this turn. Its neutral ID has no geometric meaning.'+(membership!==undefined?' Your earlier layer-membership answer is provided as your working premise; use it to reason about whether rotation applies.':''),criteria},stickerDirection:{type:'choice',instructions:frame+' Predict the tracked sticker normal after this turn. Keep the distinction between piece position and sticker direction. '+(membership!==undefined?'Use your earlier layer-membership answer as your working premise.':''),criteria:Object.fromEntries(Object.entries(vectors).map(([f,v])=>[f,`Sticker normal [${v}]`]))}}};
}
if(import.meta.main){
 const split=process.argv.includes('--validation')?'validation':'development';
 const variants=split==='validation'?[process.argv.find(a=>a.startsWith('--variant='))?.split('=')[1]??'decomposed']:['neutral','coordinates','decomposed'];
 const dir=`experiments/geometric-prediction-v2-${split}`;
 if(existsSync(`${dir}/started.json`))throw new Error('Suite already started; preserve it.');
 const cases=await fixtures(split==='validation'?314159:271828,split==='validation'?1:0);
 const old=JSON.parse(readFileSync('experiments/move-prediction-v1/fixtures.json','utf8'));
 if(new Set(cases.map(c=>c.stateHash)).size!==20 || (split==='validation' && cases.some(c=>old.some((x:any)=>x.stateHash===c.stateHash))))throw new Error('Overlapping states');
 mkdirSync(dir,{recursive:true});writeFileSync(`${dir}/fixtures.json`,JSON.stringify(cases,null,2));
 writeFileSync(`${dir}/source.ts`,readFileSync(import.meta.path));
 const start=budget();const maxRequests=variants.reduce((n,v)=>n+(v==='decomposed'?40:20),0);
 if(start.cap-start.reservedAndSpent<maxRequests*64000*.042/1e6)throw new Error('Insufficient reserve budget');
 writeFileSync(`${dir}/started.json`,JSON.stringify({split,variants,maxRequests,start,at:new Date().toISOString()},null,2));
 const results:any[]=[];
 for(const variant of variants)for(const c of cases){
  const run=await createRun(c.scramble,'primitive',`geometric-${split}`);const exchanges:any[]=[];let row:any={variant,caseId:c.id,runId:run.id,expected:c.expected,affected:c.affected};
  try{
   let membership:string|undefined;
   if(variant==='decomposed'){
    const d=await evaluate(run.id,requestFor(c.request,'membership'),AbortSignal.timeout(30000),{maxAttempts:1});exchanges.push(d);membership=d.response.answers.affected.choice;row.membershipCorrect=(membership==='yes')===c.affected;
   }
   const d=await evaluate(run.id,requestFor(c.request,variant,membership),AbortSignal.timeout(30000),{maxAttempts:1});exchanges.push(d);
   row.actual=Object.fromEntries(Object.entries(d.response.answers).map(([k,v])=>[k,v.choice]));
   row.positionCorrect=row.actual.position===c.expected.position;row.stickerCorrect=row.actual.stickerDirection===c.expected.stickerDirection;
  }catch(e){row.error=String(e);}
  row.exchanges=exchanges;results.push(row);const saved=getRun(run.id);saved.status='stopped';saved.reason='Prediction probe complete; no solve attempted';saveRun(saved);
  const summary=variants.map(v=>{const a=results.filter(r=>r.variant===v);return {variant:v,completed:a.length,total:20,position:a.filter(r=>r.positionCorrect).length,sticker:a.filter(r=>r.stickerCorrect).length,both:a.filter(r=>r.positionCorrect&&r.stickerCorrect).length,membership:v==='decomposed'?a.filter(r=>r.membershipCorrect).length:undefined,cost:a.flatMap(r=>r.exchanges).reduce((n,d)=>n+d.cost,0),errors:a.filter(r=>r.error).length}});
  writeFileSync(`${dir}/results.json`,JSON.stringify({summary,results},null,2));console.log(JSON.stringify(summary));
 }
}
