import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {createRun} from '../../src/server/runner';
import {evaluate,budget} from '../../src/server/jev';
import {db,getRun,saveRun} from '../../src/server/store';
import {apply,solved,pieces} from '../../src/lib/cube';
import type {JevRequest} from '../../src/lib/types';
const dir='experiments/less-help-probes-v1',split='less-help-probes-v1';
const colors:Record<string,string>={F:'green',R:'red',B:'blue',L:'orange'};
const words:Record<string,string>={F:'front',R:'right',B:'back',L:'left'};
const jobs:any[]=[];
for(const variant of ['fields','sentence']){
 for(const face of Object.keys(colors))for(const color of Object.values(colors)){
  const state=variant==='fields'?{sideStickerColor:color,adjacentSideCenter:colors[face]}:`The edge's side-facing sticker is ${color}. The center immediately below that sticker is ${colors[face]}.`;
  jobs.push({id:`match-${face}-${color}-${variant}`,family:'match',variant,expected:color===colors[face]?'same':'different',request:{model:'jev-1.13.0',state,questions:{comparison:{type:'choice',instructions:'Compare the two colors. Are they the same color or different colors?',criteria:{same:'The sticker and center are the same color.',different:'The sticker and center are different colors.'}}}}});
 }
 for(const from of Object.keys(colors))for(const to of Object.keys(colors))if(from!==to){
  // Golden labels via authoritative mechanics; never included in requests.
  let expected='';for(const move of ['U',"U'",'U2']){const p=pieces(await apply(await solved(),move)).find(p=>p.piece==='U'+from)!;if(p.position==='U'+to)expected=move;}
  if(!expected)throw Error('No mechanical mapping');
  const criteria=variant==='fields'?{U:'front to left, left to back, back to right, right to front',"U'":'front to right, right to back, back to left, left to front',U2:'front to back, back to front, right to left, left to right'}:{U:'Turn the upper face clockwise as viewed from above.',"U'":'Turn the upper face counterclockwise as viewed from above.',U2:'Turn the upper face halfway around.'};
  const request:JevRequest={model:'jev-1.13.0',state:{currentSide:words[from],requiredSide:words[to]},questions:{turn:{type:'choice',instructions:'Move an upper-layer edge from currentSide to requiredSide. Choose one upper-face turn. Front means the front of the cube, not the top of a drawing.',criteria}}};
  jobs.push({id:`rotation-${from}-${to}-${variant}`,family:'rotation',variant,expected,request});
 }
}
const usage=()=>db.query("SELECT COUNT(*) requests,COALESCE(SUM(l.amount),0) cost FROM ledger l JOIN runs r ON r.id=l.run_id WHERE json_extract(r.json,'$.split')=?").get(split) as {requests:number;cost:number};
if(process.argv[2]==='prepare'){
 mkdirSync(dir,{recursive:true});writeFileSync(`${dir}/fixtures.json`,JSON.stringify(jobs,null,2),{flag:'wx'});writeFileSync(`${dir}/run.ts`,readFileSync(import.meta.filename),{flag:'wx'});writeFileSync(`${dir}/protocol.json`,JSON.stringify({limits:{requests:56,cost:0.02,retries:0,concurrency:4},purpose:'Diagnostic exhaustive small domains: 16 ordered side-color comparisons, 12 nonidentity upper-slot transfers. Two forms each, no held-out claim. Rotation fields includes generic cycles; sentence only conventional notation. Match forms vary serialization only. No action solution provided in state. No tuning during batch.',budgetBefore:budget()},null,2),{flag:'wx'});console.log('Prepared 56 calls');
}else if(process.argv[2]==='run'){
 if(readFileSync(`${dir}/run.ts`,'utf8')!==readFileSync(import.meta.filename,'utf8'))throw Error('Source changed');
 writeFileSync(`${dir}/started.json`,JSON.stringify({at:new Date().toISOString()}),{flag:'wx'});const rows:any[]=[];let cursor=0;
 await Promise.all(Array.from({length:4},async()=>{while(cursor<jobs.length){const j=jobs[cursor++],r=await createRun('','skills',split);const row:any={...j,runId:r.id};rows.push(row);
 try{const u=usage(),b=budget();if(u.requests>=56||u.cost+0.002688>0.02||b.reservedAndSpent+0.002688>b.cap)throw Error('Budget');row.exchange=await evaluate(r.id,j.request,AbortSignal.timeout(30000),{maxAttempts:1});row.actual=Object.values(row.exchange.response.answers).map((a:any)=>a.choice)[0];row.correct=row.actual===j.expected;}catch(e){row.error=String(e);row.correct=false;}finally{const end=getRun(r.id);end.status='stopped';end.reason='Diagnostic isolated probe';saveRun(end);writeFileSync(`${dir}/results.json`,JSON.stringify({rows,usage:usage(),budget:budget()},null,2));}
 }}));console.log(JSON.stringify({usage:usage(),scores:['match','rotation'].flatMap(family=>['fields','sentence'].map(variant=>{const rs=rows.filter(x=>x.family===family&&x.variant===variant);return{family,variant,correct:rs.filter(x=>x.correct).length,total:rs.length}}))}));
}else throw Error('prepare or run');
