import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {apply,facts,hash,pieces} from '../../src/lib/cube';
import {evaluate,budget} from '../../src/server/jev';
import {db,event,getRun,saveRun} from '../../src/server/store';
import {createRun} from '../../src/server/runner';
import {preconditionObservation} from '../../src/server/action-preconditions';
import {fixtures,expected,acceptableAction,expectedSituation} from '../observation-boundary/evaluator';
import {decide} from './policy';
import reference from './routine-reference.json';
const dir='experiments/brain-early-v3',split='brain-early-v3';
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const write=(p:string,v:unknown)=>writeFileSync(p,JSON.stringify(v,null,2));
const sources=['scripts/brain-early-v3/policy.ts','scripts/brain-early-v3/routine-reference.json','src/server/action-preconditions.ts','scripts/observation-boundary/policy.ts'];
const digest=()=>createHash('sha256').update(sources.map(p=>readFileSync(p,'utf8')).join('\n')).digest('hex');
function usage(){return db.query("SELECT COUNT(*) requests,COALESCE(SUM(amount),0) cost FROM ledger l JOIN runs r ON r.id=l.run_id WHERE json_extract(r.json,'$.split')=?").get(split) as {requests:number;cost:number};}
async function newRun(scramble:string){const run=await createRun(scramble,'skills',split);run.version=split;saveRun(run);return run;}
function askFor(runId:string,exchanges:any[],deadline=Date.now()+120000,attemptLimit=60){return async(request:any)=>{
 const u=usage(),g=budget(),reservation=64000*0.042/1e6;
 if(u.requests>=400||u.cost+reservation>0.08||g.reservedAndSpent+reservation>g.cap)throw new Error('Study/project cap');
 if(Date.now()>=deadline||getRun(runId).requests>=attemptLimit)throw new Error('Attempt cap');
 const d=await evaluate(runId,request,AbortSignal.timeout(Math.max(1,Math.min(30000,deadline-Date.now()))),{maxAttempts:1});exchanges.push(d);
 return Object.fromEntries(Object.entries(d.response.answers).map(([k,a])=>[k,a.choice]));
};}
export async function score(state:any,r:Awaited<ReturnType<typeof decide>>){
 const e=expected(state),goal=r.plan.goal===e.goal,target=e.goal==='first-layer'?r.target===null:(e.goal==='daisy'?e.gatherTargets:e.transferTargets).includes(r.target!);
 if(e.goal==='first-layer')return {goal,target,action:r.alg==='',correct:goal&&target&&r.alg===''};
 let action=false;
 if(r.target&&r.front&&r.routine&&r.alg){
  const op=['U',"U'",'U2'].includes(r.routine)?`turn:${r.routine}`:`none:${r.routine}`;
  action=await acceptableAction(state,e.goal,r.target,r.front,op);
  if(!action&&r.preparation==='clear'&&r.plannedRoutine){
   const before=preconditionObservation(state,r.target,r.front,r.plannedRoutine),afterState=await apply(state,r.alg),after=preconditionObservation(afterState,r.target,r.front,r.plannedRoutine),required=reference.find(x=>x.id===r.plannedRoutine)!.requiredFreeSlots;
   action=required.some(s=>before.yellowUpPetals[s])&&required.every(s=>!after.yellowUpPetals[s])&&before.target.position===after.target.position&&before.target.yellowDirection===after.target.yellowDirection&&facts(state).daisy===facts(afterState).daisy&&pieces(state).filter(p=>p.kind==='edge'&&p.piece.includes('D')&&p.solved).every(p=>pieces(afterState).some(a=>a.kind==='edge'&&a.piece===p.piece&&a.solved));
  }
 }
 const s=r.target&&['DF','DR','DB','DL'].includes(r.target)?expectedSituation(state,r.target):null;
 const recognition=!!s&&r.recognised?.situation===s.situation&&r.front===s.reference;
 return {goal,target,recognition,action,correct:goal&&target&&recognition&&action};
}
async function main(){
 const phase=process.argv[2];
 if(phase==='prepare'){
  if(existsSync(`${dir}/manifest.json`))throw new Error('Already prepared');mkdirSync(dir,{recursive:true});
  const dev=read('experiments/observation-boundary-v1/development-fixtures.json'),old=read('experiments/observation-boundary-v1/validation-fixtures.json');
  const retired=[...read('experiments/brain-early-v1/validation-fixtures.json'),...read('experiments/brain-early-v2/validation-fixtures.json')];
  const validation=await fixtures('validation',[...dev,...old,...retired].map(c=>c.stateHash));
  write(`${dir}/development-fixtures.json`,dev);write(`${dir}/validation-fixtures.json`,validation);
  write(`${dir}/manifest.json`,{digest:digest(),limits:{requests:400,dollars:0.08,concurrency:2},pricing:{date:'2026-09-22',url:'https://docs.typesafe.ai/models',perMillion:0.042},scope:'V2 with only single-empty-slot clearance rotation wording changed to validated direction descriptions. Fresh validation followed by four trajectories on its states, capped at 120 requests/200 turns/two minutes. No runtime search.'});
  write(`${dir}/sources.json`,Object.fromEntries(sources.map(p=>[p,readFileSync(p,'utf8')])));return;
 }
 if(digest()!==read(`${dir}/manifest.json`).digest)throw new Error('Frozen source changed');
 if(!['development','validation','integration'].includes(phase))throw new Error('Unknown phase');
 if(phase==='integration'&&read(`${dir}/validation-results.json`).correct<19)throw new Error('Integration gate requires 19/20');
 writeFileSync(`${dir}/${phase}-started.json`,JSON.stringify({at:new Date().toISOString(),usage:usage()}),{flag:'wx'});
 const rows:any[]=[];
 const persist=()=>write(`${dir}/${phase}-results.json`,{correct:rows.filter(r=>r.score?.correct||r.status==='complete').length,total:rows.length,rows,usage:usage()});
 if(phase!=='integration'){
  const cases=read(`${dir}/${phase}-fixtures.json`);let index=0;
  await Promise.all([0,1].map(async()=>{while(index<cases.length){
   const c=cases[index++],run=await newRun(c.scramble),row:any={caseId:c.id,category:c.category,runId:run.id,before:c.state,exchanges:[]};rows.push(row);persist();
   try{row.decision=await decide(c.state,askFor(run.id,row.exchanges));row.after=await apply(c.state,row.decision.alg);row.score=await score(c.state,row.decision);event(run.id,'brain-cycle',row);}catch(e){row.error=String(e);}
   const saved=getRun(run.id);saved.status='stopped';saved.reason='Brain early one-cycle probe';saveRun(saved);persist();
  }}));
 }else{
  const dev=read(`${dir}/validation-fixtures.json`),cases=['zero','one','full-daisy','partial-transfer'].map(category=>dev.find((c:any)=>c.category===category));
  for(const c of cases){
   const run=await newRun(c.scramble),row:any={caseId:c.id,runId:run.id,steps:[],status:'capped'},deadline=Date.now()+120000;rows.push(row);
   let state=c.state,history:string[]=[],target:string|null=null,turns=0;
   try{while(true){
    const step:any={before:state,exchanges:[]};row.steps.push(step);
    const d=await decide(state,askFor(run.id,step.exchanges,deadline,120),{target,recentActions:history.slice(-2)});step.decision=d;
    if(d.plan.goal==='first-layer'){row.status=facts(state).cross?'complete':'false-handoff';break;}
    if(!d.alg){row.status='abstained';break;}
    const count=d.alg.split(/\s+/).filter(Boolean).length;
    if(turns+count>200||Date.now()>=deadline)break;
    state=await apply(state,d.alg);step.after=state;history.push(d.alg);target=d.target;turns+=count;
    event(run.id,'brain-action',step);persist();
   }}catch(e){row.error=String(e);}
   row.after=state;row.turns=turns;const saved=getRun(run.id);saved.state=state;saved.status='stopped';saved.reason='Brain early integration: '+row.status;saveRun(saved);persist();
  }
 }
 console.log(JSON.stringify({phase,correct:rows.filter(r=>r.score?.correct||r.status==='complete').length,total:rows.length,usage:usage()},null,2));
}
if(import.meta.main)await main();
