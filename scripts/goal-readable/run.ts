import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {request} from './policy';
import {createRun} from '../../src/server/runner';
import {evaluate,budget} from '../../src/server/jev';
import {db,getRun,saveRun} from '../../src/server/store';
const dir='experiments/goal-readable-v1',split='goal-readable-v1';
const variants=['fields','sentences'] as const;
const goals=['daisy','cross','first-layer','middle-layer','top-cross','top-orientation','top-corners','top-edges'];
const mode=process.argv[2];
if(mode==='prepare'){
 mkdirSync(dir,{recursive:true});
 const development=JSON.parse(readFileSync('experiments/goal-contract-v1/development-fixtures.json','utf8'));
 const validation=JSON.parse(readFileSync('experiments/goal-contract-v1/validation-fixtures.json','utf8'));
 const cases=[...development.map((c:any,i:number)=>({...c,id:`batch-a-${i+1}`,phase:'batch-a',memory:{previousGoal:goals[i%8],recentActions:['U']}})),...validation.map((c:any,i:number)=>({...c,id:`batch-b-${i+1}`,phase:'batch-b',memory:{previousGoal:goals[(i+3)%8],recentActions:["U'"]}}))];
 writeFileSync(`${dir}/fixtures.json`,JSON.stringify(cases,null,2),{flag:'wx'});
 writeFileSync(`${dir}/protocol.json`,JSON.stringify({model:'jev-1.13.0',variants,limits:{requests:128,dollars:0.02,concurrency:4,retries:0},comparison:'Identical current measurements, memory, instructions and criteria. Change state serialization only. Identifiers retained in English to preserve explicit links to fixed criteria. Both forms frozen before either batch. No tuning between batches.',fixtureLimit:'64 distinct legal routine-generated states from the existing goal-contract development and validation suites, balanced four per goal per batch. Reused evaluation cases, not a new held-out validation. Neither format is revised between batches. Synthetic previousGoal and one-turn memory are controlled irrelevant-context stress tests, not recorded solving history. This is component accuracy, not solve reliability.',pricing:{verified:'2026-09-22',source:'https://docs.typesafe.ai/models',inputPerMillion:0.042},budgetBefore:budget()},null,2),{flag:'wx'});
 writeFileSync(`${dir}/frozen-policy.ts`,readFileSync(import.meta.dirname+'/policy.ts'));
 console.log('Prepared 64 reused distinct states; both formats frozen.');
}else if(mode==='run'){
 const cases=JSON.parse(readFileSync(`${dir}/fixtures.json`,'utf8'));
 if(readFileSync(`${dir}/frozen-policy.ts`,'utf8')!==readFileSync(import.meta.dirname+'/policy.ts','utf8'))throw new Error('Policy changed after freeze');
 writeFileSync(`${dir}/started.json`,JSON.stringify({at:new Date().toISOString()}),{flag:'wx'});
 const rows:any[]=[];
 const usage=()=>db.query("SELECT COUNT(*) requests,COALESCE(SUM(l.amount),0) cost FROM ledger l JOIN runs r ON r.id=l.run_id WHERE json_extract(r.json,'$.split')=?").get(split) as {requests:number;cost:number};
 const persist=()=>writeFileSync(`${dir}/results.json`,JSON.stringify({rows,usage:usage()},null,2));
 for(const phase of ['batch-a','batch-b']){
  const tasks=cases.filter((c:any)=>c.phase===phase).flatMap((c:any,i:number)=>(i%2?[...variants].reverse():variants).map(variant=>({c,variant})));
  let cursor=0;
  await Promise.all(Array.from({length:4},async()=>{
   while(cursor<tasks.length){
    const {c,variant}=tasks[cursor++];const r=await createRun(c.scramble,'skills',split);
    r.stage=c.memory.previousGoal;r.history=c.memory.recentActions;saveRun(r);
    const row:any={id:c.id,phase,variant,expected:c.expected,runId:r.id};rows.push(row);
    try{
     const u=usage(),b=budget();
     if(u.requests>=128||u.cost+0.002688>0.02||b.reservedAndSpent+0.002688>b.cap)throw new Error('Study/project cap');
     row.exchange=await evaluate(r.id,request(r,variant),AbortSignal.timeout(30000),{maxAttempts:1});
     row.actual=row.exchange.response.answers.goal.choice;row.correct=row.actual===row.expected;
    }catch(e){row.error=String(e);row.correct=false;}
    finally{const end=getRun(r.id);end.status='stopped';end.reason='Isolated representation comparison; no moves executed';saveRun(end);persist();}
   }
  }));
  console.log(JSON.stringify({phase,usage:usage(),scores:variants.map(variant=>({variant,correct:rows.filter(r=>r.phase===phase&&r.variant===variant&&r.correct).length,total:32}))}));
 }
}else throw new Error('Use prepare or run');
