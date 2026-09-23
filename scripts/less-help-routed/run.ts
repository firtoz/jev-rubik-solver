import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {decide} from './policy';
import {createRun} from '../../src/server/runner';
import {evaluate,budget} from '../../src/server/jev';
import {db,getRun,saveRun} from '../../src/server/store';
const dir='experiments/less-help-routed-v1',split='less-help-routed-v1';
const usage=()=>db.query("SELECT COUNT(*) requests,COALESCE(SUM(l.amount),0) cost FROM ledger l JOIN runs r ON r.id=l.run_id WHERE json_extract(r.json,'$.split')=?").get(split) as {requests:number;cost:number};
if(process.argv[2]==='prepare'){
 mkdirSync(dir,{recursive:true});const cases=JSON.parse(readFileSync('experiments/less-help-v2/fixtures.json','utf8')).filter((c:any)=>c.split==='development');writeFileSync(`${dir}/fixtures.json`,JSON.stringify(cases,null,2),{flag:'wx'});
 for(const name of ['policy','run'])writeFileSync(`${dir}/${name}.ts`,readFileSync(`${import.meta.dirname}/${name}.ts`),{flag:'wx'});
 writeFileSync(`${dir}/protocol.json`,JSON.stringify({limits:{requests:160,cost:0.04,concurrency:4,retries:0},design:'Reused 20 development observations. Shared self-contained color questions and attached model comparison results; compare full action menu vs routing on model intention into setup or insertion or extraction questions. Setup uses model-selected destination followed by turn; insertion model chooses frame then one of two routines. No code state classifier chooses tactics. Generic action effects unchanged. Complete score requires both intention and accepted action. No held-out claim.',budgetBefore:budget()},null,2),{flag:'wx'});
 console.log('Prepared');
}else if(process.argv[2]==='run'){
 for(const name of ['policy','run'])if(readFileSync(`${dir}/${name}.ts`,'utf8')!==readFileSync(`${import.meta.dirname}/${name}.ts`,'utf8'))throw Error('Source changed');
 writeFileSync(`${dir}/started.json`,JSON.stringify({at:new Date().toISOString()}),{flag:'wx'});const cases=JSON.parse(readFileSync(`${dir}/fixtures.json`,'utf8')),tasks=cases.flatMap((c:any)=>['attached','routed'].map(variant=>({c,variant}))),rows:any[]=[];let cursor=0;
 await Promise.all(Array.from({length:4},async()=>{while(cursor<tasks.length){const {c,variant}=tasks[cursor++],r=await createRun(c.scramble,'skills',split);const row:any={id:c.id,family:c.family,variant,expected:c.expected,accepted:c.accepted,runId:r.id,exchanges:[]};rows.push(row);
 try{const answers=await decide(c.state,c.target,variant as 'attached'|'routed',async request=>{const u=usage(),b=budget();if(u.requests>=160||u.cost+0.002688>0.04||b.reservedAndSpent+0.002688>b.cap)throw Error('Budget');const exchange=await evaluate(r.id,request,AbortSignal.timeout(30000),{maxAttempts:1});row.exchanges.push(exchange);return Object.fromEntries(Object.entries(exchange.response.answers).map(([k,a])=>[k,a.choice]));});row.answers=answers;row.actionCorrect=c.accepted.includes(answers.action);row.intentCorrect=answers.intention===c.expected;row.correct=row.actionCorrect&&row.intentCorrect;}catch(e){row.error=String(e);row.correct=false;}finally{const end=getRun(r.id);end.status='stopped';end.reason='Less-help composition development';saveRun(end);writeFileSync(`${dir}/results.json`,JSON.stringify({rows,usage:usage(),budget:budget()},null,2));}
 }}));console.log(JSON.stringify({usage:usage(),scores:['attached','routed'].map(variant=>{const rs=rows.filter(r=>r.variant===variant);return{variant,correct:rs.filter(r=>r.correct).length,intention:rs.filter(r=>r.intentCorrect).length,total:rs.length}})}));
}else throw Error('prepare or run');
