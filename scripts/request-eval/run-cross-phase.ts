import { writeFileSync,mkdirSync,readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fixtures as prior } from './separate';
import { fixtures as old } from './cases';
import { pieces,hash } from '../../src/lib/cube';
import { events,getRun,saveRun,event,db } from '../../src/server/store';
import { evaluate,budget,MODEL } from '../../src/server/jev';
import { decideCrossIntention,crossPhaseRequest,crossAlignmentRequest } from '../../src/server/cross-intention';
const split=process.argv.includes('--validation')?'validation':'development';
const all=await prior({validationSeed:838153,excludeValidation:[...(await prior()),...(await old())].filter(f=>f.split==='validation').map(f=>hash(f.run.state))});
const fs=all.filter(f=>f.split===split);
if(split==='development'){
 const source=getRun('cdb19e3c-d4eb-46e6-b7db-ef9bfada0447');
 const decision=events(source.id).filter(e=>e.kind==='decision'&&e.payload.request.questions.intention).at(-1)!;
 fs[19]={...fs[19],run:{...source,id:'',status:'stopped',requests:0,tokens:0,cost:0,activeMs:0},request:decision.payload.request,evidence:{fixedTarget:'DF'},accepted:{intent_DF:['extract']}};
}
const cases=fs.map(f=>{const target=(f.evidence as any).fixedTarget??f.run.target??(f.request.state as any).stagePieces[0].piece;const p=pieces(f.run.state).find(p=>p.piece===target)!;return {f,target,p,accepted:f.accepted['intent_'+target]};});
if(new Set(cases.map(c=>hash(c.f.run.state))).size!==20)throw new Error('Duplicate cases');
const dir='experiments/cross-phase-v1-'+split;mkdirSync(dir,{recursive:true});
const frozen={split,cases,sources:Object.fromEntries(['src/server/cross-intention.ts','scripts/request-eval/run-cross-phase.ts'].map(p=>[p,readFileSync(p,'utf8')])),ceiling:{requests:40,cost:.05},requestTemplates:cases.map(c=>({phase:crossPhaseRequest(MODEL,c.p),alignment:crossAlignmentRequest(MODEL,c.p)}))};
const fingerprint=createHash('sha256').update(JSON.stringify(frozen)).digest('hex');
if(!process.argv.includes('--live')){writeFileSync(dir+'/preview.json',JSON.stringify(frozen,null,2));console.log('20 offline cases prepared');process.exit(0);}
if((db.query('SELECT count(*) n FROM locks WHERE expires>?').get(Date.now()) as any).n)throw new Error('Active solve');
writeFileSync(dir+'/live.lock',fingerprint,{flag:'wx'});writeFileSync(dir+'/frozen.json',JSON.stringify({...frozen,fingerprint},null,2));
const start=budget(),results:any[]=[];
for(const c of cases){
 if(budget().reservedAndSpent-start.reservedAndSpent+.002688>.05)throw new Error('Local cap');
 const r={...c.f.run,id:crypto.randomUUID(),createdAt:new Date().toISOString(),status:'stopped' as const,requests:0,tokens:0,cost:0,split:'probe',benchmarkId:null};saveRun(r);event(r.id,'probe-created',{state:r.state,fingerprint,target:c.target});
 const result:any={case:c.f.id,runId:r.id,expected:c.accepted};
 try{const answer=await decideCrossIntention(MODEL,c.p,async req=>(await evaluate(r.id,req,AbortSignal.timeout(30000),{maxAttempts:1})).response);Object.assign(result,{choice:answer.choice,correct:c.accepted.includes(answer.choice)});}catch(e){Object.assign(result,{correct:false,error:String(e)});}
 results.push(result);event(r.id,'cross-phase-result',result);writeFileSync(dir+'/results.json',JSON.stringify({fingerprint,start,end:budget(),results,correct:results.filter(r=>r.correct).length,planned:20,unattempted:20-results.length},null,2));
 if(result.error)break;
}
console.log(JSON.stringify({correct:results.filter(r=>r.correct).length,total:results.length,cost:budget().usage-start.usage,failures:results.filter(r=>!r.correct)}));
