import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {fixtures} from './fixtures';
import {request,variants,type Variant} from './policy';
import {createRun} from '../../src/server/runner';
import {evaluate,budget} from '../../src/server/jev';
import {db,getRun,saveRun} from '../../src/server/store';
const dir='experiments/less-help-v1',split='less-help-v1';
const usage=()=>db.query("SELECT COUNT(*) requests,COALESCE(SUM(l.amount),0) cost FROM ledger l JOIN runs r ON r.id=l.run_id WHERE json_extract(r.json,'$.split')=?").get(split) as {requests:number;cost:number};
if(process.argv[2]==='prepare'){
 mkdirSync(dir,{recursive:true});writeFileSync(`${dir}/fixtures.json`,JSON.stringify(await fixtures(),null,2),{flag:'wx'});
 for(const name of ['policy','fixtures','run'])writeFileSync(`${dir}/${name}.ts`,readFileSync(`${import.meta.dirname}/${name}.ts`),{flag:'wx'});
 writeFileSync(`${dir}/protocol.json`,JSON.stringify({variants,model:'jev-1.13.0',limits:{requests:200,cost:0.05,concurrency:4,retries:0},design:'20 distinct legal states per split, four each solved/flipped/trapped/align/insert. Same observations, target supplied, same action menu. 2 sequential calls; uncorrected intention passed downstream. Explicit is a new matched task baseline, not a replay of production requests. Routine actions include fixed frame mapping. Offline mechanics labels allow multiple valid actions. Development selects highest complete-decision reduced-help variant; ties favor minimal. Validate that variant and explicit on 20 states generated before development. No tuning.',budgetBefore:budget(),pricing:'2026-09-22 verified docs.typesafe.ai/models $0.042/M input'},null,2),{flag:'wx'});
 console.log('Prepared and frozen');
}else if(process.argv[2]==='run'){
 for(const name of ['policy','fixtures','run'])if(readFileSync(`${dir}/${name}.ts`,'utf8')!==readFileSync(`${import.meta.dirname}/${name}.ts`,'utf8'))throw Error('Frozen source mismatch');
 writeFileSync(`${dir}/started.json`,JSON.stringify({at:new Date().toISOString()}),{flag:'wx'});
 const cases=JSON.parse(readFileSync(`${dir}/fixtures.json`,'utf8')),rows:any[]=[];
 const persist=()=>writeFileSync(`${dir}/results.json`,JSON.stringify({rows,usage:usage(),budget:budget()},null,2));
 const scores=(phase:string)=>variants.map(variant=>{const rs=rows.filter(r=>r.split===phase&&r.variant===variant);return {variant,total:rs.length,intention:rs.filter(r=>r.intentCorrect).length,action:rs.filter(r=>r.actionCorrect).length,complete:rs.filter(r=>r.correct).length}});
 async function phase(name:string,vs:readonly Variant[]){
  const tasks=cases.filter((c:any)=>c.split===name).flatMap((c:any,i:number)=>(i%2?[...vs].reverse():vs).map(variant=>({c,variant})));let cursor=0;
  await Promise.all(Array.from({length:4},async()=>{while(cursor<tasks.length){
   const {c,variant}=tasks[cursor++];const r=await createRun(c.scramble,'skills',split);const row:any={id:c.id,split:name,family:c.family,variant,runId:r.id,expected:c.expected,accepted:c.accepted,exchanges:[]};rows.push(row);
   try{
    let intention:string|undefined;
    for(let step=0;step<2;step++){
     const u=usage(),b=budget();if(u.requests>=200||u.cost+0.002688>0.05||b.reservedAndSpent+0.002688>b.cap)throw Error('Study/project cap');
     const exchange=await evaluate(r.id,request(c.state,c.target,variant,intention),AbortSignal.timeout(30000),{maxAttempts:1});row.exchanges.push(exchange);
     if(step===0){intention=exchange.response.answers.intention.choice;row.intent=intention;row.intentCorrect=intention===c.expected;}else{row.action=exchange.response.answers.action.choice;row.actionCorrect=c.accepted.includes(row.action);}
    }
    row.correct=row.intentCorrect&&row.actionCorrect;
   }catch(e){row.error=String(e);row.correct=false;}
   finally{const end=getRun(r.id);end.status='stopped';end.reason='Isolated less-help evaluation';saveRun(end);persist();}
  }}));console.log(JSON.stringify({phase:name,scores:scores(name),usage:usage()}));
 }
 await phase('development',variants);
 const selected=scores('development').filter(x=>x.variant!=='explicit').sort((a,b)=>b.complete-a.complete||(a.variant==='minimal'?-1:1))[0].variant;
 writeFileSync(`${dir}/selection.json`,JSON.stringify({selected,scores:scores('development')},null,2));
 await phase('validation',['explicit',selected]);
}else throw Error('Use prepare or run');
