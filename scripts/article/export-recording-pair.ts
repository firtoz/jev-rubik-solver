/** Offline export. Usage: bun scripts/article/export-recording-pair.ts SKILLS_ID PRIMITIVE_ID */
import { getRun, events } from '../../src/server/store';
import { apply, solved, isSolved, hash } from '../../src/lib/cube';
import { roundSummary } from '../../src/lib/round-summary';
import { preparationLabel } from '../../src/lib/request-label';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
const policyFiles=(dir:string):string[]=>readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?policyFiles(`${dir}/${e.name}`):[`${dir}/${e.name}`]);
const policyDigest=createHash('sha256');
for(const path of [...policyFiles('src/solver'),'src/lib/cube.ts','src/lib/types.ts'].sort())policyDigest.update(path).update(readFileSync(path));
const sourceDigest=policyDigest.digest('hex');
const [skillsId, primitiveId] = process.argv.slice(2);
if (!skillsId || !primitiveId) throw Error('Supply both saved run IDs; no API calls are made.');
const selection = 'Fresh paired recording from the original featured starting state. One attempt per policy; not selected for outcome or speed.';
const recordings: any[] = [], timings: Record<string, any[]> = {}, details: Record<string, any[]> = {};
let skillsFlow: any, primitiveArchive: any;
for (const [policy,id] of [['primitive',primitiveId],['skills',skillsId]]) {
 const run=getRun(id), log=events(id), sends=log.filter(e=>e.kind==='request');
 if(!['solved','capped','error','stopped'].includes(run.status))throw Error(`Run ${id} is not finished`);
 const origin=Date.parse(sends[0].createdAt), ms=(e:any)=>Date.parse(e.createdAt)-origin;
 const actions=log.filter(e=>e.kind==='action');
 let state=await apply(await solved(),run.scramble);
 for(const action of actions){
  if(hash(state)!==hash(action.payload.before))throw Error('Before-state mismatch');
  state=await apply(state,action.payload.alg);
  if(hash(state)!==hash(action.payload.after))throw Error('After-state mismatch');
 }
 if(hash(state)!==hash(run.state))throw Error('Final state mismatch');
 const verifiedSolved=isSolved(state);
 if((run.status==='solved')!==verifiedSolved)throw Error('Solved status mismatch');
 const rows:any[]=[], archive:any[]=[], steps:any[]=[], costs:any[]=[];
 for(const send of sends){
  const received=log.find(e=>e.id>send.id&&['decision','request-error','invalid-response'].includes(e.kind)&&e.payload.id===send.payload.id);
  if(!received)throw Error('Unfinished request');
  const round=actions.filter(e=>e.id<send.id).length;
  const p=received.payload, failed=received.kind!=='decision';
  const step=rows.filter(r=>r.round===round).length+1;
  const request=send.payload.request;
  const row={round,step,startMs:ms(send),endMs:ms(received),elapsedMs:p.elapsedMs??ms(received)-ms(send),questions:Object.keys(request.questions),failed,total:0,answers:Object.fromEntries(Object.entries(p.response?.answers??{}).map(([k,a]:any)=>[k,a.choice])),...(preparationLabel(request)?{label:preparationLabel(request)}:{})};
  rows.push(row);
  archive.push({round:round+1,step,startMs:row.startMs,endMs:row.endMs,request,response:p.nativeResponse??p.response??null,elapsedMs:row.elapsedMs,cost:p.cost??send.payload.reservation,...(failed?{error:{status:p.status??null,message:p.error??'No valid response'}}:{})});
  costs.push({ms:row.endMs,cost:p.cost??send.payload.reservation});
 }
 for(const row of rows)row.total=rows.filter(r=>r.round===row.round).length;
 for(const [round,action] of actions.entries()){
  const exchanges=rows.filter(r=>r.round===round).map(row=>{
   const send=sends[rows.indexOf(row)], received=log.find(e=>e.id>send.id&&e.kind==='decision'&&e.payload.id===send.payload.id);
   if(!received)throw Error('Transport failures require explicit round mapping before publication');
   const p=received.payload;
   return {request:send.payload.request,response:p.response,nativeResponse:p.nativeResponse,elapsedMs:p.elapsedMs,cost:p.cost};
  });
  const p=action.payload;
  const decision=p.decision??{goal:p.stageBefore,target:p.target,front:p.front,skill:p.skill,intent:p.recognisedCase,alg:p.alg};
  steps.push({before:p.before,after:p.after,pendingPlan:steps.at(-1)?.nextPendingPlan??null,nextPendingPlan:p.nextPendingPlan??null,decision,alg:p.alg,exchanges});
 }
 timings[policy]=rows;
 details[policy]=steps.map(s=>({...roundSummary(s),alg:s.alg}));
 const durationMs=Math.max(...rows.map(r=>r.endMs),...actions.map(ms));
 const recording={policy,runId:id,recordedAt:run.createdAt,scramble:run.scramble,timeline:actions.map(e=>({alg:e.payload.alg,ms:ms(e)})),costs,durationMs,attemptElapsedMs:run.activeMs,result:{verifiedSolved,requests:run.requests,turns:run.turns,cost:costs.reduce((sum,c)=>sum+c.cost,0),status:run.status},firstRequest:sends[0].payload.request};
 recordings.push(recording);
 if(policy==='skills')skillsFlow={previewSetup:run.scramble,id,status:run.status,turns:run.turns,elapsedMs:durationMs,source:`Fresh paired recording · ${run.createdAt}`,policyDigest:sourceDigest,steps};
 else primitiveArchive=archive;
}
if(recordings[0].scramble!==recordings[1].scramble)throw Error('Starting states differ');
if(!recordings[1].result.verifiedSolved)throw Error('Skills attempt did not solve; retain evidence without replacing the successful replay.');
await Bun.write('public/recordings/primitive-requests.json',JSON.stringify(primitiveArchive));
const write=(path:string,value:unknown)=>Bun.write(path,JSON.stringify(value,null,2)+'\n');
await write('src/lib/article-matched-recordings.json',{selection,caseId:'fresh-pair',recordings});
await write('src/lib/article-best-recording.json',{...recordings[1],caseId:'fresh-pair',selection});
await write('src/lib/article-request-timings.json',timings);
await write('src/lib/article-action-details.json',details);
await Bun.write('public/recordings/article-best-flow.json',JSON.stringify(skillsFlow));
console.log(JSON.stringify(recordings.map(({policy,runId,durationMs,result})=>({policy,runId,durationMs,result})),null,2));
