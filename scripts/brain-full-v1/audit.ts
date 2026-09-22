import {readFileSync,writeFileSync} from 'node:fs';
import {cube3x3x3} from 'cubing/puzzles';
import {KPattern} from 'cubing/kpuzzle';
const dir='experiments/brain-full-v1';
const rows=JSON.parse(readFileSync(`${dir}/results.json`,'utf8')).rows;
const fixtures=JSON.parse(readFileSync(`${dir}/fixtures.json`,'utf8'));
const puzzle=await cube3x3x3.kpuzzle();
const same=(a:any,b:any)=>JSON.stringify(a)===JSON.stringify(b);
const audit=[];
for(const row of rows){
 let state=puzzle.defaultPattern().applyAlg(fixtures.find((f:any)=>f.id===row.id).scramble);
 if(!same(state.patternData,row.before))throw new Error('Starting state mismatch');
 for(const step of row.steps){
  if(!same(state.patternData,step.before))throw new Error('Before mismatch');
  if(step.after){state=state.applyAlg(step.alg);if(!same(state.patternData,step.after))throw new Error('Action mismatch');}
 }
 if(!same(state.patternData,row.after))throw new Error('Final mismatch');
 const solved=['EDGES','CORNERS'].every(o=>state.patternData[o].pieces.every((p:number,i:number)=>p===i&&state.patternData[o].orientation[i]===0));
 if((row.status==='solved')!==solved)throw new Error('Outcome mismatch');
 audit.push({id:row.id,status:row.status,solved,movesVerified:row.steps.filter((s:any)=>s.after).length});
}
writeFileSync(`${dir}/audit.json`,JSON.stringify(audit,null,2));console.log(audit);
