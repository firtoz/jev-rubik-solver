import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {request} from './policy';
import {createRun} from '../../src/server/runner';
import {evaluate,budget} from '../../src/server/jev';
import {db,getRun,saveRun} from '../../src/server/store';
const dir='experiments/less-help-compose-v1',split='less-help-compose-v1';
const usage=()=>db.query("SELECT COUNT(*) requests,COALESCE(SUM(l.amount),0) cost FROM ledger l JOIN runs r ON r.id=l.run_id WHERE json_extract(r.json,'$.split')=?").get(split) as {requests:number;cost:number};
if(process.argv[2]==='prepare'){
 mkdirSync(dir,{recursive:true});const cases=JSON.parse(readFileSync('experiments/less-help-v2/fixtures.json','utf8')).filter((c:any)=>c.split==='development');writeFileSync(`${dir}/fixtures.json`,JSON.stringify(cases,null,2),{flag:'wx'});
 for(const name of ['policy','run'])writeFileSync(`${dir}/${name}.ts`,readFileSync(`${import.meta.dirname}/${name}.ts`),{flag:'wx'});
 writeFileSync(`${dir}/protocol.json`,JSON.stringify({limits:{requests:80,cost:0.03,concurrency:4,retries:0},design:'Reused 20 development observations. Direct one-call action vs relations -> intention -> action, latter three sequential calls, model answers copied unchanged. Same universal action effects; explicit slot-to-action decision rules absent. Effects mechanically verified. Target supplied, no target selection/full integration claim. Criterion: final action is accepted offline; report intention separately.',budgetBefore:budget()},null,2),{flag:'wx'});
 console.log('Prepared');
}else if(process.argv[2]==='run'){
 for(const name of ['policy','run'])if(readFileSync(`${dir}/${name}.ts`,'utf8')!==readFileSync(`${import.meta.dirname}/${name}.ts`,'utf8'))throw Error('Source changed');
 writeFileSync(`${dir}/started.json`,JSON.stringify({at:new Date().toISOString()}),{flag:'wx'});const cases=JSON.parse(readFileSync(`${dir}/fixtures.json`,'utf8')),tasks=cases.flatMap((c:any)=>['direct','composed'].map(variant=>({c,variant}))),rows:any[]=[];let cursor=0;
 await Promise.all(Array.from({length:4},async()=>{while(cursor<tasks.length){const {c,variant}=tasks[cursor++],r=await createRun(c.scramble,'skills',split);const row:any={id:c.id,family:c.family,variant,expected:c.expected,accepted:c.accepted,runId:r.id,exchanges:[]};rows.push(row);
 try{const answers:any={};for(const kind of (variant==='direct'?['action']:['relations','intention','action']) as ('relations'|'intention'|'action')[]){const u=usage(),b=budget();if(u.requests>=80||u.cost+0.002688>0.03||b.reservedAndSpent+0.002688>b.cap)throw Error('Budget');const exchange=await evaluate(r.id,request(c.state,c.target,kind,Object.keys(answers).length?{...answers}:undefined),AbortSignal.timeout(30000),{maxAttempts:1});row.exchanges.push(exchange);Object.assign(answers,Object.fromEntries(Object.entries(exchange.response.answers).map(([k,a])=>[k,a.choice])));}row.answers=answers;row.correct=c.accepted.includes(answers.action);row.intentCorrect=variant==='direct'?null:answers.intention===c.expected;}catch(e){row.error=String(e);row.correct=false;}finally{const end=getRun(r.id);end.status='stopped';end.reason='Less-help composition development';saveRun(end);writeFileSync(`${dir}/results.json`,JSON.stringify({rows,usage:usage(),budget:budget()},null,2));}
 }}));console.log(JSON.stringify({usage:usage(),scores:['direct','composed'].map(variant=>{const rs=rows.filter(r=>r.variant===variant);return{variant,correct:rs.filter(r=>r.correct).length,intention:rs.filter(r=>r.intentCorrect).length,total:rs.length}})}));
}else throw Error('prepare or run');
