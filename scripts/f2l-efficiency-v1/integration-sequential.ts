import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import type {CubeData} from '../../src/lib/types';
import {randomInt} from 'node:crypto';
import {apply,solved,inverse,facts,mapAlg,hash} from '../../src/lib/cube';
import {createRun} from '../../src/server/runner';
import {evaluate,budget} from '../../src/server/jev';
import {db,saveRun,getRun} from '../../src/server/store';
import {decide} from './preparation-sequential';
import {routines} from './policy';
const phase=process.argv[2]??'development';if(!['development','validation'].includes(phase))throw Error('Bad phase');
const dir=`experiments/f2l-efficiency-v1/integration-sequential-${phase}`,split='f2l-integration-sequential';mkdirSync(dir,{recursive:true});
const usage=()=>db.query("SELECT COUNT(*) requests,COALESCE(SUM(amount),0) cost FROM ledger l JOIN runs r ON l.run_id=r.id WHERE json_extract(r.json,'$.split')=?").get(split) as {requests:number;cost:number};
const sources=Object.fromEntries(['scripts/f2l-efficiency-v1/controller.ts','scripts/f2l-efficiency-v1/policy.ts','scripts/f2l-efficiency-v1/preparation-sequential.ts','scripts/f2l-efficiency-v1/integration-sequential.ts','experiments/f2l-efficiency-v1/catalog.json','src/lib/cube.ts'].map(p=>[p,readFileSync(p,'utf8')]));
writeFileSync(`${dir}/started.json`,JSON.stringify({at:new Date().toISOString(),sources,limits:{requests:500,dollars:.06,caseRequests:120,caseTurns:60,caseMs:120000,concurrency:2},budgetBefore:budget()},null,2),{flag:'wx'});
// Paired development replay, not new held-out evidence.
const fixtures=JSON.parse(readFileSync('experiments/f2l-efficiency-v1/integration-development/fixtures.json','utf8'));
writeFileSync(`${dir}/fixtures.json`,JSON.stringify(fixtures,null,2));const rows:any[]=[];const persist=()=>writeFileSync(`${dir}/results.json`,JSON.stringify({phase,usage:usage(),rows},null,2));let cursor=0;
async function attempt(f:any){const run=await createRun('','skills',split);run.state=f.state;run.status='ready';saveRun(run);const row:any={id:f.id,runId:run.id,before:f.state,steps:[],status:'running',turns:0};rows.push(row);persist();let state=f.state,target:string|null=null;const recent:string[]=[];const start=Date.now();
 try{while(!facts(state).middle){
  if(row.turns>=60||Date.now()-start>=120000)throw Error('Attempt cap');const step:any={before:state,exchanges:[]};row.steps.push(step);
  const d=await decide(state,async request=>{
   for(let retry=0;retry<3;retry++){
    const u=usage();if(u.requests>=500||u.cost+.002688>.06||budget().reservedAndSpent+.002688>9)throw Error('Budget cap');if(getRun(run.id).requests>=120||Date.now()-start>=120000)throw Error('Attempt cap');
    try{const e=await evaluate(run.id,structuredClone(request),AbortSignal.timeout(Math.max(1,120000-(Date.now()-start))),{maxAttempts:1});step.exchanges.push(e);persist();return e.response;}
    catch(e){step.transportErrors??=[];step.transportErrors.push(String(e));persist();if(retry===2||!/(HTTP (429|5\d\d)|network)/i.test(String(e)))throw e;await new Promise(r=>setTimeout(r,1000*2**retry));}
   }throw Error('Transport exhausted');
  },target,recent);step.decision=d;target=d.target;step.selectedAlg=d.alg;
  if(!d.alg){row.status='abstained';break;}const count=d.alg.split(/\s+/).length;if(row.turns+count>60||Date.now()-start>=120000)throw Error('Attempt cap');
  state=await apply(state,d.alg);row.turns+=count;step.after=state;step.alg=d.alg;recent.push(d.alg);if(!facts(state).cross)throw Error('Cross preservation failed');saveRun({...getRun(run.id),state,target,turns:row.turns,history:recent});persist();
 }if(facts(state).middle)row.status='solved';
 }catch(e){row.error=String(e);row.status=String(e).includes('cap')?'capped':'error';}
 row.after=state;row.elapsedMs=Date.now()-start;saveRun({...getRun(run.id),state,turns:row.turns,status:row.status==='solved'?'solved':'stopped',reason:`F2L ${phase}: ${row.status}`});persist();console.log(f.id,row.status,row.turns);
}
await Promise.all(Array.from({length:2},async()=>{while(cursor<fixtures.length)await attempt(fixtures[cursor++]);}));console.log({usage:usage(),solved:rows.filter(r=>r.status==='solved').length,n:rows.length});
