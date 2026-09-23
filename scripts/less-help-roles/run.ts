import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {decide} from './policy';
import {createRun} from '../../src/server/runner';
import {evaluate,budget} from '../../src/server/jev';
import {db,getRun,saveRun} from '../../src/server/store';
const dir='experiments/less-help-roles-v1',split='less-help-roles-v1';
const usage=()=>db.query("SELECT COUNT(*) requests,COALESCE(SUM(l.amount),0) cost FROM ledger l JOIN runs r ON r.id=l.run_id WHERE json_extract(r.json,'$.split')=?").get(split) as {requests:number;cost:number};
if(process.argv[2]==='prepare'){
 mkdirSync(dir,{recursive:true});const cases=JSON.parse(readFileSync('experiments/less-help-v2/fixtures.json','utf8')).filter((c:any)=>c.split==='development');writeFileSync(`${dir}/fixtures.json`,JSON.stringify(cases,null,2),{flag:'wx'});
 for(const name of ['policy','run'])writeFileSync(`${dir}/${name}.ts`,readFileSync(`${import.meta.dirname}/${name}.ts`),{flag:'wx'});
 writeFileSync(`${dir}/protocol.json`,JSON.stringify({limits:{requests:180,cost:0.05,concurrency:4,retries:0},design:'Reused 20 development inputs. Both arms name side-facing vs upward stickers; omit the irrelevant up-center comparison from intention. Destination query receives only side-facing sticker and centers. Roles keeps earlier intention teaching; effects offers generic physical operation effects without conditional case-to-action mapping. Routing solely follows model intention. Score requires correct intention and accepted action. No held-out claim.',budgetBefore:budget()},null,2),{flag:'wx'});
 console.log('Prepared');
}else if(process.argv[2]==='run'){
 for(const name of ['policy','run'])if(readFileSync(`${dir}/${name}.ts`,'utf8')!==readFileSync(`${import.meta.dirname}/${name}.ts`,'utf8'))throw Error('Source changed');
 writeFileSync(`${dir}/started.json`,JSON.stringify({at:new Date().toISOString()}),{flag:'wx'});const cases=JSON.parse(readFileSync(`${dir}/fixtures.json`,'utf8')),tasks=cases.flatMap((c:any)=>['roles','effects'].map(variant=>({c,variant}))),rows:any[]=[];let cursor=0;
 await Promise.all(Array.from({length:4},async()=>{while(cursor<tasks.length){const {c,variant}=tasks[cursor++],r=await createRun(c.scramble,'skills',split);const row:any={id:c.id,family:c.family,variant,expected:c.expected,accepted:c.accepted,runId:r.id,exchanges:[]};rows.push(row);
 try{const answers=await decide(c.state,c.target,variant as 'roles'|'effects',async request=>{const u=usage(),b=budget();if(u.requests>=180||u.cost+0.002688>0.05||b.reservedAndSpent+0.002688>b.cap)throw Error('Budget');const exchange=await evaluate(r.id,request,AbortSignal.timeout(30000),{maxAttempts:1});row.exchanges.push(exchange);return Object.fromEntries(Object.entries(exchange.response.answers).map(([k,a])=>[k,a.choice]));});row.answers=answers;row.actionCorrect=c.accepted.includes(answers.action);row.intentCorrect=answers.intention===c.expected;row.correct=row.actionCorrect&&row.intentCorrect;}catch(e){row.error=String(e);row.correct=false;}finally{const end=getRun(r.id);end.status='stopped';end.reason='Less-help composition development';saveRun(end);writeFileSync(`${dir}/results.json`,JSON.stringify({rows,usage:usage(),budget:budget()},null,2));}
 }}));console.log(JSON.stringify({usage:usage(),scores:['roles','effects'].map(variant=>{const rs=rows.filter(r=>r.variant===variant);return{variant,correct:rs.filter(r=>r.correct).length,intention:rs.filter(r=>r.intentCorrect).length,total:rs.length}})}));
}else throw Error('prepare or run');
