import {writeFileSync,mkdirSync,readFileSync} from 'node:fs';
import {crossAlignmentRequest} from '../../src/server/cross-intention';
import {getRun,saveRun,event} from '../../src/server/store';
import {evaluate,MODEL,budget} from '../../src/server/jev';
const dir='experiments/cross-alignment-exhaustive-v1';mkdirSync(dir,{recursive:true});
const cases=['F','R','B','L'].flatMap(current=>['F','R','B','L'].map(home=>({currentPosition:'U'+current,destination:'D'+home,expected:current===home?'insert':'align'})));
const frozen={cases,sources:readFileSync('src/server/cross-intention.ts','utf8'),note:'Exhaustive 16 possible slot pairs. Abstract geometry inputs, not full-cube solve cases.'};
writeFileSync(dir+'/frozen.json',JSON.stringify(frozen,null,2),{flag:'wx'});
const template=getRun('cdb19e3c-d4eb-46e6-b7db-ef9bfada0447'),start=budget(),results:any[]=[];
for(const c of cases){const r={...template,id:crypto.randomUUID(),createdAt:new Date().toISOString(),status:'stopped' as const,requests:0,tokens:0,cost:0,split:'probe',benchmarkId:null};saveRun(r);event(r.id,'abstract-geometry-probe',{case:c});
const d=await evaluate(r.id,crossAlignmentRequest(MODEL,{position:c.currentPosition,destination:c.destination}),AbortSignal.timeout(30000),{maxAttempts:1});const actual=d.response.answers.alignment.choice;results.push({...c,actual,correct:actual===c.expected,runId:r.id});writeFileSync(dir+'/results.json',JSON.stringify({results,start,end:budget()},null,2));}
console.log(JSON.stringify({correct:results.filter(r=>r.correct).length,total:16,cost:budget().usage-start.usage,failures:results.filter(r=>!r.correct)}));
