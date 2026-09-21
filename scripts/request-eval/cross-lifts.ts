import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {apply,solved,pieces,hash,referenceObservation,focusedObservation} from '../../src/lib/cube';
import {measuredSkillDecision} from '../../src/server/measured-policy';
import {getRun,saveRun,event} from '../../src/server/store';
import {evaluate,budget,MODEL} from '../../src/server/jev';
const split=process.argv.includes('--validation')?'validation':'development';
let seed=split==='development'?567423:246581;const random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296;};
const template=getRun('cdb19e3c-d4eb-46e6-b7db-ef9bfada0447'),seen=new Set<string>(),counts:Record<string,number>={},cases:any[]=[];
while(cases.length<20){
 const ms:string[]=[];while(ms.length<(cases.length<10?5:10)){const f='UDFBRL'[Math.floor(random()*6)];if(ms.at(-1)?.[0]!==f)ms.push(f+['',"'",'2'][Math.floor(random()*3)]);}
 const scramble=ms.join(' '),state=await apply(await solved(),scramble);if(seen.has(hash(state)))continue;
 for(const p of pieces(state).filter(p=>p.kind==='edge'&&p.destination.includes('D')&&!p.solved&&p.stickers.yellow!=='U')){
  const expectedFront=p.stickers.yellow==='D'?p.position[1]:p.stickers.yellow;
  const run={...template,state,scramble,target:null,stage:'cross',history:[],requests:0,cost:0,tokens:0,turns:0,activeMs:0,status:'stopped' as const,reason:'Cross lift probe',version:'cross-lifts-v1',split:'probe',benchmarkId:null};
  const local=referenceObservation(focusedObservation({...run,target:p.piece}),expectedFront).target as any;
  const kind=local.stickers.yellow==='D'?'bottom-down':local.position==='DF'?'bottom-side':local.position==='UF'?'top-side':local.position==='FR'?'middle-right':'middle-left';
  if((counts[kind]??0)>=4)continue;
  counts[kind]=(counts[kind]??0)+1;seen.add(hash(state));cases.push({run,target:p.piece,expectedFront,kind});break;
 }
}
const dir='experiments/cross-lifts-'+(process.env.EXPERIMENT_VERSION||'v1')+'-'+split;mkdirSync(dir,{recursive:true});
writeFileSync(dir+'/frozen.json',JSON.stringify({cases,counts,sources:Object.fromEntries(['src/server/measured-policy.ts','src/lib/skills.ts','scripts/request-eval/cross-lifts.ts'].map(p=>[p,readFileSync(p,'utf8')]))},null,2),{flag:'wx'});
const start=budget(),results:any[]=[];
for(const c of cases){
 if(budget().reservedAndSpent-start.reservedAndSpent+.002688>.05)throw new Error('Local cap');
 const run={...c.run,id:crypto.randomUUID(),createdAt:new Date().toISOString()};saveRun(run);event(run.id,'probe-created',{state:run.state,kind:c.kind});
 let row:any={kind:c.kind,runId:run.id};
 try{
 const d=await measuredSkillDecision(run,MODEL,async req=>{
  const key=Object.keys(req.questions)[0];
  if(key==='target'||key==='phase'){const choice=key==='target'?c.target:'extract';return{model:req.model,usage:{input_tokens:0,output_tokens:0},answers:{[key]:{type:'choice',choice,confidence:1,probabilities:Object.fromEntries(Object.keys(req.questions[key].criteria).map(k=>[k,k===choice?1:0]))}}};}
  return(await evaluate(run.id,req,AbortSignal.timeout(30000),{maxAttempts:1})).response;
 },[]);
 const after=pieces(await apply(run.state,d.alg));
 const preserved=pieces(run.state).filter(p=>p.kind==='edge'&&p.destination.includes('D')&&p.solved).every(p=>after.find(q=>q.piece===p.piece)!.solved);
 row={...row,referenceCorrect:d.front===c.expectedFront,expectedFront:c.expectedFront,front:d.front,skill:d.skill,alg:d.alg,preserved,yellowUp:after.find(p=>p.piece===c.target)!.stickers.yellow==='U'};row.correct=row.referenceCorrect&&row.preserved&&row.yellowUp;
 }catch(e){row={...row,correct:false,error:String(e)};}
 results.push(row);event(run.id,'cross-lift-result',row);writeFileSync(dir+'/results.json',JSON.stringify({start,end:budget(),results,correct:results.filter(r=>r.correct).length,planned:20,unattempted:20-results.length},null,2));if(row.error)break;
}
console.log(JSON.stringify({correct:results.filter(r=>r.correct).length,total:results.length,cost:budget().usage-start.usage,failures:results.filter(r=>!r.correct)}));
