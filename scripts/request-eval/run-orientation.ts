import {orientationFixtures,pattern} from './orientation-fixtures';
import {apply,facts} from '../../src/lib/cube';
import {measuredSkillDecision} from '../../src/server/measured-policy';
import {getRun,saveRun,event} from '../../src/server/store';
import {evaluate,budget,MODEL} from '../../src/server/jev';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
const cases=(await orientationFixtures()).slice(1),dir='experiments/orientation-'+(process.argv[2]||'v1')+'-development';
mkdirSync(dir,{recursive:true});writeFileSync(dir+'/frozen.json',JSON.stringify({cases,sources:Object.fromEntries(['src/server/measured-policy.ts','scripts/request-eval/orientation-fixtures.ts','scripts/request-eval/run-orientation.ts'].map(p=>[p,readFileSync(p,'utf8')]))}),{flag:'wx'});
const template=getRun('9f03bd10-c759-40d1-8a95-796de06a6d3c'),start=budget(),results:any[]=[];
for(const c of cases){
 const run={...template,id:crypto.randomUUID(),state:c.state,scramble:c.scramble,history:[],target:null,stage:'top-orientation',status:'stopped' as const,requests:0,turns:0,cost:0,tokens:0,activeMs:0,version:'orientation-v1',reason:'Orientation capability probe',split:'probe',benchmarkId:null,createdAt:new Date().toISOString()};saveRun(run);event(run.id,'probe-created',{state:c.state});
 let row:any={runId:run.id,pattern:pattern(c.state)};
 try{
 const d=await measuredSkillDecision(run,MODEL,async req=>{
 if(req.questions.target)return{model:MODEL,usage:{input_tokens:0,output_tokens:0},answers:{target:{type:'choice',choice:'whole',probabilities:{whole:1},confidence:1},intent_whole:{type:'choice',choice:'orient',probabilities:{orient:1},confidence:1}}};
 if(budget().usage-start.usage>.03)throw Error('Local budget');
 return(await evaluate(run.id,req,AbortSignal.timeout(30000),{maxAttempts:1})).response;
 },[]);
 const after=await apply(c.state,d.alg),f=facts(after),n=Object.values(pattern(c.state)).filter(x=>x==='U').length,m=Object.values(pattern(after)).filter(x=>x==='U').length;
 row={...row,front:d.front,skill:d.skill,alg:d.alg,after:pattern(after),correct:f.middle&&f.topCross&&(n===1?(m===1||m===4):m===1)};
 }catch(e){row={...row,correct:false,error:String(e)};}
 results.push(row);writeFileSync(dir+'/results.json',JSON.stringify({start,end:budget(),results,correct:results.filter(r=>r.correct).length,total:cases.length},null,2));
}
console.log(JSON.stringify({correct:results.filter(r=>r.correct).length,total:cases.length,cost:budget().usage-start.usage,failures:results.filter(r=>!r.correct)}));
