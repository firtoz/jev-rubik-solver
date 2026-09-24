import {Database} from 'bun:sqlite';
import {readFileSync,writeFileSync} from 'node:fs';
const dir=process.argv.find(arg=>arg.startsWith('experiments/'))||'experiments/brain-teaching-confirmation-v1';
const reportPath=dir.endsWith('-http-resume')?'docs/frozen-confirmation-resumed-costs.md':'docs/frozen-confirmation-costs.md';
const split='brain-teaching-confirmation-v1';
const partial=process.argv.includes('--partial');
const result=JSON.parse(readFileSync(`${dir}/results.json`,'utf8'));
if(!partial&&(result.rows.length!==100||result.rows.some((r:any)=>r.status==='running')))throw Error('Wait for all 100 terminal attempts');
const database=new Database(process.env.RUBIK_DB||'.data/lab.sqlite',{readonly:true});
type Total={requests:number;inputTokens:number;settled:number;reserved:number;latencyMs:number};
const empty=():Total=>({requests:0,inputTokens:0,settled:0,reserved:0,latencyMs:0});
const stages:Record<string,Total>={},families:Record<string,Total>={},studies:Record<string,Total>={};
const stageById=new Map<string,string>();
for(const row of result.rows){
 const record=JSON.parse(readFileSync(`${dir}/${row.record}`,'utf8'));
 for(const step of record.steps){
  const goal=step.decision?.goal??step.exchanges.find((e:any)=>e.response?.answers?.goal)?.response.answers.goal.choice;
  for(const e of step.exchanges)stageById.set(e.id,goal??'incomplete / recovery-only');
 }
}
const add=(total:Total,row:any,decision:any)=>{
 total.requests++;total[row.status==='settled'?'settled':'reserved']+=row.amount;
 total.inputTokens+=decision?.response?.usage?.input_tokens??0;
 total.latencyMs+=decision?.elapsedMs??0;
};
const recovery=empty(),current=empty();
database.transaction(()=>{
 const events=database.query("SELECT kind,payload FROM events WHERE kind IN ('request','decision') ORDER BY id").all() as any[];
 const requests=new Map<string,any>(),decisions=new Map<string,any>();
 for(const event of events){const data=JSON.parse(event.payload);(event.kind==='request'?requests:decisions).set(data.id,data);}
 const ledger=database.query("SELECT l.*,json_extract(r.json,'$.split') split FROM ledger l LEFT JOIN runs r ON r.id=l.run_id").all() as any[];
 for(const row of ledger){
  const decision=decisions.get(row.id),request=requests.get(row.id)?.request;
  add(studies[row.split??'unlabelled']??=empty(),row,decision);
  if(row.split!==split)continue;
  if(!request)throw Error('Missing dispatch record: '+row.id);
  if(row.status==='settled'&&(!decision||Math.abs(row.amount-decision.cost)>1e-12))throw Error('Ledger/response cost mismatch');
  const keys=Object.keys(request.questions).sort();
  const family=keys.join(' + ');
  add(current,row,decision);
  add(families[family]??=empty(),row,decision);
  add(stages[stageById.get(row.id)??'incomplete / unassigned']??=empty(),row,decision);
  if(keys.includes('recovery'))add(recovery,row,decision);
 }
})();
database.close();
const sorted=(groups:Record<string,Total>)=>Object.entries(groups).sort((a,b)=>(b[1].settled+b[1].reserved)-(a[1].settled+a[1].reserved));
for(const groups of [stages,families]){
 const sum=Object.values(groups).reduce((a,v)=>a+v.settled+v.reserved,0);
 if(Math.abs(sum-current.settled-current.reserved)>1e-9)throw Error('Breakdown does not reconcile');
}
const report={partial,at:new Date().toISOString(),current,stages,families,recovery,studies};
writeFileSync(`${dir}/${partial?'partial-cost-breakdown':'cost-breakdown'}.json`,JSON.stringify(report,null,2));
const table=(groups:Record<string,Total>)=>'| Group | Calls | Input tokens | Estimated spent | Reserved |\n|---|---:|---:|---:|---:|\n'+sorted(groups).map(([name,t])=>`| ${name} | ${t.requests} | ${t.inputTokens.toLocaleString('en-US')} | $${t.settled.toFixed(6)} | $${t.reserved.toFixed(6)} |`).join('\n');
if(!partial)writeFileSync(reportPath,`# Where the API budget went

The new confirmation used **${current.requests.toLocaleString('en-US')} calls**, **${current.inputTokens.toLocaleString('en-US')} input tokens**, **$${current.settled.toFixed(6)} estimated spent** and **$${current.reserved.toFixed(6)} unresolved reservations**. These are local ledger estimates from native token usage, not an account invoice.

Input tokens cost $0.042 per million; output tokens are free. Each dispatch first reserves $0.002688 (the full 64,000-token ceiling). A valid response replaces that reservation with its reported input-token cost. Failed or uncertain requests retain their reservation. Reservations are not additional confirmed charges.

## By solving stage

${table(stages)}

Stage attribution uses the goal selected in that action cycle. Incomplete cycles without a selected goal and recovery-only actions are labelled separately.

## By request type

${table(families)}

Names are the actual question keys. A row with several keys is one batched API call and is counted once. Goal selection is requested repeatedly as the cube changes. Multi-turn routines are one execution, but choosing their goal, target, frame and routine can require several calls.

Explicit repeated-state recovery questions used ${recovery.requests} calls and $${recovery.settled.toFixed(6)} estimated spent, with $${recovery.reserved.toFixed(6)} reserved. This is a subset of the tables, not an extra charge. It does not measure all work spent correcting earlier tactical errors.

## Separate project studies

${table(studies)}

These ledger groups include earlier experiments and the current confirmation separately. Unlabelled entries are retained rather than guessed. Historical uncertain reservations remain visible. Latency totals and per-group numeric values are available in [the machine-readable breakdown](../${dir}/cost-breakdown.json); summed latency is not wall-clock duration because four attempts run concurrently.
`);
console.log(JSON.stringify({partial,current,recovery,topStages:sorted(stages).slice(0,3),topFamilies:sorted(families).slice(0,3)}));
