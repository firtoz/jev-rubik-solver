import {readFileSync,writeFileSync,existsSync} from 'node:fs';
const source='experiments/brain-early-v1 + experiments/brain-early-v2';
const phases=['brain-early-v1','brain-early-v2','brain-early-v3'].flatMap(version=>['development','validation'].filter(phase=>existsSync(`experiments/${version}/${phase}-results.json`)).map(phase=>{
 const source=`experiments/${version}`;
 const data=JSON.parse(readFileSync(`${source}/${phase}-results.json`,'utf8'));
 return {phase:`${version}/${phase}`,rows:data.rows.map((r:any)=>({caseId:r.caseId,variant:'separated',family:r.category,correct:!!r.score?.correct,expected:'Correct goal, target, situation/reference and useful executed action (or correct cross handoff).',actual:{decision:r.decision,score:r.score},error:r.error,runId:r.runId,before:r.before,after:r.after,exchanges:r.exchanges.map((d:any)=>({id:d.id,request:d.request,response:d.nativeResponse??d.response,elapsedMs:d.elapsedMs,cost:d.cost}))}))};
}));
const transfers=JSON.parse(readFileSync('experiments/top-slot-transfer-v1/results.json','utf8'));
phases.push({phase:'top-slot-transfer-v1',rows:transfers.rows.map((r:any)=>({caseId:`${r.variant}:${r.source}→${r.destination}`,variant:r.variant,family:'top-slot transfer',correct:r.correct,expected:r.expected,actual:r.actual,error:r.error,runId:r.runId,exchanges:[r.exchange].filter(Boolean).map((d:any)=>({id:d.id,request:d.request,response:d.nativeResponse??d.response,elapsedMs:d.elapsedMs,cost:d.cost}))}))});
for(const phase of ['development','validation']){
 const data=JSON.parse(readFileSync(`experiments/goal-contract-v1/${phase}-results.json`,'utf8'));
 phases.push({phase:`goal-contract/${phase}`,rows:data.rows.map((r:any)=>({caseId:`${r.variant}:${r.id}`,variant:r.variant,family:'goal',correct:r.correct,expected:r.expected,actual:r.actual,error:r.error,runId:r.runId,exchanges:[r.exchange].filter(Boolean).map((d:any)=>({id:d.id,request:d.request,response:d.nativeResponse??d.response,elapsedMs:d.elapsedMs,cost:d.cost}))}))});
}
for(const phase of ['development','validation','commit-check','commit-validation']){
 const data=JSON.parse(readFileSync(`experiments/plan-memory-v1/${phase}-results.json`,'utf8'));
 phases.push({phase:`plan-memory/${phase}`,rows:data.rows.map((r:any)=>({caseId:r.caseId,variant:r.variant??'explicit commitment',family:r.category??'pending plan',correct:r.correct,expected:r.expected,actual:r.actual,error:r.error,runId:r.runId,exchanges:[r.exchange].filter(Boolean).map((d:any)=>({id:d.id,request:d.request,response:d.nativeResponse??d.response,elapsedMs:d.elapsedMs,cost:d.cost}))}))});
}
writeFileSync('src/lib/brain-early.json',JSON.stringify({source,phases},null,2));
