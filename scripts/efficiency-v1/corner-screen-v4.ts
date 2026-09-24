import {readFileSync,writeFileSync} from 'node:fs';
import {createRun} from '../../src/server/runner';
import {evaluate,budget} from '../../src/server/jev';
import {db,saveRun,getRun} from '../../src/server/store';
import {apply,facts,hash} from '../../src/lib/cube';
import {actions,decide,type Variant} from './corner-policy-v4';
const dir='experiments/efficiency-v1/round4',split='efficiency-corners-v3';
const phase=process.argv[2]??'development';if(!['development','validation'].includes(phase))throw Error('Unknown phase');
const variants:Variant[]=phase==='development'?['explicit','isolated']:[process.argv[3] as Variant];
if(variants.some(v=>!['explicit','isolated'].includes(v)))throw Error('Choose frozen candidate');
const fixtures=JSON.parse(readFileSync('experiments/efficiency-v1/corner-fixtures.json','utf8')).filter((f:any)=>f.split===phase);
const usage=()=>db.query("SELECT COUNT(*) requests,COALESCE(SUM(amount),0) cost FROM ledger l JOIN runs r ON l.run_id=r.id WHERE json_extract(r.json,'$.split')=?").get(split) as {requests:number;cost:number};
writeFileSync(`${dir}/${phase}-started.json`,JSON.stringify({at:new Date().toISOString(),variants,budgetBefore:budget(),limits:{studyDollars:.03,studyRequests:350,concurrency:2,caseMs:120000,caseActions:6,caseTurns:40},sources:Object.fromEntries(['corner-policy','corner-policy-v3','corner-policy-v4','corner-screen-v4','corner-fixtures'].map(f=>[f,readFileSync(`scripts/efficiency-v1/${f}.ts`,'utf8')]))},null,2),{flag:'wx'});
const rows:any[]=[];const persist=()=>writeFileSync(`${dir}/${phase}-results.json`,JSON.stringify({phase,usage:usage(),rows},null,2));
const jobs=variants.flatMap(variant=>fixtures.map((fixture:any)=>({variant,fixture})));let cursor=0;
async function attempt({variant,fixture}:any){
 const run=await createRun('','skills',split);run.state=fixture.state;run.status='ready';saveRun(run);
 const row:any={id:fixture.id,variant,runId:run.id,before:fixture.state,steps:[],status:'running',turns:0,ceiling:fixture.labels.turnCeiling};rows.push(row);persist();
 const start=Date.now();let state=fixture.state;const history:string[]=[];let correctStop=false;
 try{for(let i=0;i<6;i++){
  const step:any={before:state,exchanges:[]};row.steps.push(step);
  const choice=await decide(state,variant,history,async(body)=>{let exchange:any;
  for(let retry=0;retry<3;retry++){
   const u=usage();if(u.cost+.002688>.03||u.requests>=350||budget().reservedAndSpent+.002688>9)throw Error('Budget/request cap');
   if(Date.now()-start>=120000)throw Error('Time cap');
   try{exchange=await evaluate(run.id,structuredClone(body),AbortSignal.timeout(Math.max(1,120000-(Date.now()-start))),{maxAttempts:1});break;}
   catch(e){row.transportErrors??=[];row.transportErrors.push(String(e));persist();if(retry===2||!/(HTTP (429|5\d\d)|network)/i.test(String(e)))throw e;await new Promise(r=>setTimeout(r,1000*2**retry));}
  }
  step.exchanges.push(exchange);persist();return exchange.response;
  });const alg=actions[choice];step.choice=choice;step.alg=alg;
  if(choice==='done'){correctStop=facts(state).cornersPlaced;row.status=correctStop?'done':'premature-done';break;}
  const count=alg.split(/\s+/).length;if(row.turns+count>40){row.status='turn-cap';break;}
  state=await apply(state,alg);row.turns+=count;history.push(choice);step.after=state;
  if(!facts(state).middle||!facts(state).topCross||!facts(state).topOriented)throw Error('Preservation failed');
  run.state=state;run.history=history;saveRun({...getRun(run.id),state,history,turns:row.turns});persist();
 }
 if(row.status==='running')row.status='action-cap';
 }catch(e){row.status='error';row.error=String(e);}
 row.after=state;row.completed=facts(state).cornersPlaced;row.passed=correctStop&&row.turns<=row.ceiling;row.elapsedMs=Date.now()-start;
 saveRun({...getRun(run.id),state,history,turns:row.turns,status:'stopped',reason:`Corner ${phase}: ${row.status}`});persist();
 console.log(variant,fixture.id,row.status,row.turns,'pass',row.passed);
}
await Promise.all(Array.from({length:2},async()=>{while(cursor<jobs.length)await attempt(jobs[cursor++]);}));
console.log(JSON.stringify({usage:usage(),scores:variants.map(v=>({variant:v,passed:rows.filter(r=>r.variant===v&&r.passed).length,n:rows.filter(r=>r.variant===v).length}))}));
