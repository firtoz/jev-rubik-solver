import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {decide,actions,scene,variants,type Variant} from './policy';
import {generate,label} from '../less-help-scene/fixtures';
import {createRun} from '../../src/server/runner';
import {evaluate,budget} from '../../src/server/jev';
import {db,getRun,saveRun} from '../../src/server/store';
import {apply,facts,hash} from '../../src/lib/cube';
const dir='experiments/teaching-study-v2',split='teaching-study-v2';
const files=['scripts/teaching-study-v2/policy.ts','scripts/less-help-scene/policy.ts','scripts/less-help-scene/fixtures.ts','scripts/teaching-study-v2/run.ts','scripts/less-help-roles/policy.ts','scripts/less-help-compose/policy.ts','scripts/less-help-v2/policy.ts','src/lib/cube.ts','src/lib/skills.ts','src/server/jev.ts'];
const sources=()=>Object.fromEntries(files.map(f=>[f,readFileSync(f,'utf8')]));const digest=()=>createHash('sha256').update(JSON.stringify(sources())).digest('hex');
const usage=()=>db.query("SELECT COUNT(*) requests,COALESCE(SUM(l.amount),0) cost FROM ledger l JOIN runs r ON r.id=l.run_id WHERE json_extract(r.json,'$.split') IN ('teaching-study-v1','teaching-study-v2')").get() as {requests:number;cost:number};
const mode=process.argv[2];
if(mode==='prepare'){
 mkdirSync(dir,{recursive:true});writeFileSync(`${dir}/sources.json`,JSON.stringify(sources()),{flag:'wx'});writeFileSync(`${dir}/protocol.json`,JSON.stringify({digest:digest(),limits:{requests:4500,cost:0.25,concurrency:4,retries:0,integrationRequests:160,integrationTurns:200,integrationMs:120000},design:'Final development round. Matched focused intention observations for effects, four contrast examples, or explicit applicability teaching. Twenty development scenes include retired integration intermediate states. Same downstream teaching for every arm. Select highest complete score >=18/20, ties prefer effects then examples then guidance. Freeze before 40 fresh observations, require >=36/40 and all four intention families before ten new integrations requiring >=9/10. No third round. All v1 evaluation data retired. Exclude all v1 fixture and reached scenes from fresh tests; local subcases can recur. Cumulative v1+v2 cap $0.25 and 4500 calls, global $9. No retries or runtime tactical repair.',budgetBefore:budget()},null,2),{flag:'wx'});writeFileSync(`${dir}/screen-fixtures.json`,readFileSync('experiments/teaching-study-v2/development.json','utf8'),{flag:'wx'});console.log('Prepared');
}else{
 if(JSON.parse(readFileSync(`${dir}/protocol.json`,'utf8')).digest!==digest())throw Error('Source changed');
 if(mode==='prepare-heldout'||mode==='prepare-integration'){
  const prior=mode==='prepare-heldout'?'screen':'heldout',r=JSON.parse(readFileSync(`${dir}/${prior}-results.json`,'utf8'));
  if(prior==='screen'){
   const selected=[...variants].sort((a,b)=>r.rows.filter((x:any)=>x.variant===b&&x.correct).length-r.rows.filter((x:any)=>x.variant===a&&x.correct).length).find(v=>r.rows.filter((x:any)=>x.variant===v&&x.correct).length>=18);if(!selected)throw Error('Screen gate failed');
   writeFileSync(`${dir}/selection.json`,JSON.stringify({variant:selected,digest:digest()},null,2),{flag:'wx'});
  }else if(r.rows.filter((x:any)=>x.correct).length<36)throw Error('Heldout gate failed');
  if(prior==='heldout'&&!['done','align','insert','extract'].every(k=>r.rows.some((x:any)=>x.expected===k)))throw Error('Coverage gate failed');
  const old=['screen',...(prior==='heldout'?['heldout']:[])].flatMap(p=>JSON.parse(readFileSync(`${dir}/${p}-fixtures.json`,'utf8')));
  const historic=JSON.parse(readFileSync('experiments/less-help-scene-v1/screen-fixtures.json','utf8'));for(const folder of ['less-help-v1','less-help-v2'])historic.push(...JSON.parse(readFileSync(`experiments/${folder}/fixtures.json`,'utf8')));old.push(...historic);for(const phase of ['screen','heldout','integration']){old.push(...JSON.parse(readFileSync(`experiments/teaching-study-v1/${phase}-fixtures.json`,'utf8')));for(const row of JSON.parse(readFileSync(`experiments/teaching-study-v1/${phase}-results.json`,'utf8')).rows)for(const c of row.cycles)old.push({state:c.before},{state:c.after});}
  const next=prior==='screen'?'heldout':'integration';let fs=await generate(prior==='screen'?40:14,prior==='screen'?652918:281765,old.map(c=>hash(c.state)),old.map(c=>JSON.stringify(scene(c.state))));if(next==='integration')fs=fs.filter(c=>!facts(c.state).middle).slice(0,10);
  writeFileSync(`${dir}/${next}-fixtures.json`,JSON.stringify(fs,null,2),{flag:'wx'});console.log('Prepared '+fs.length+' '+next);
 }else if(['screen','heldout','integration'].includes(mode)){
  writeFileSync(`${dir}/${mode}-started.json`,JSON.stringify({at:new Date().toISOString(),digest:digest()}),{flag:'wx'});const selected:Variant=mode==='screen'?'effects':JSON.parse(readFileSync(`${dir}/selection.json`,'utf8')).variant;const cases=JSON.parse(readFileSync(`${dir}/${mode}-fixtures.json`,'utf8')).flatMap((c:any)=>(mode==='screen'?variants:[selected]).map(variant=>({...c,variant}))),rows:any[]=[];let cursor=0;
  const persist=()=>writeFileSync(`${dir}/${mode}-results.json`,JSON.stringify({rows,usage:usage(),budget:budget(),digest:digest()},null,2));
  await Promise.all(Array.from({length:4},async()=>{while(cursor<cases.length){const c=cases[cursor++],r=await createRun(c.scramble,'skills',split),row:any={id:c.id,variant:c.variant,runId:r.id,before:c.state,exchanges:[],cycles:[]};rows.push(row);const started=performance.now();
   try{
    let state=c.state,previous:string|null=null,turns=0;const history:string[]=[];
    const ask=async(request:any)=>{const u=usage(),b=budget();if(u.requests>=4500||u.cost+0.002688>0.25||b.reservedAndSpent+0.002688>b.cap)throw Error('Budget');if(mode==='integration'&&(row.exchanges.length>=160||performance.now()-started>=120000))throw Error('Integration cap');const exchange=await evaluate(r.id,request,AbortSignal.timeout(mode==='integration'?Math.max(1,120000-(performance.now()-started)):30000),{maxAttempts:1});row.exchanges.push(exchange);return Object.fromEntries(Object.entries(exchange.response.answers).map(([k,a])=>[k,a.choice]));};
    do{
     const answer=await decide(state,c.variant,ask,previous,history.slice(-2)),alg=actions[answer.action];if(alg===undefined)throw Error('Invalid action');const n=alg.trim()?alg.trim().split(/\s+/).length:0;if(turns+n>200)throw Error('Turn cap');
     const after=await apply(state,alg);row.cycles.push({before:state,answer,alg,after});state=after;previous=answer.target;history.push(alg);turns+=n;
     if(!facts(state).firstLayer)throw Error('Bottom damaged');
     if(mode!=='integration'){const gold=c.labels[answer.target];row.expected=gold?.intention;row.correct=!!gold&&gold.eligible&&gold.intention===answer.intention&&gold.accepted.includes(answer.action);break;}
     persist();
    }while(!facts(state).middle);
    row.turns=turns;row.after=state;if(mode==='integration')row.correct=facts(state).middle;
   }catch(e){row.error=String(e);row.correct=false;}finally{row.elapsedMs=performance.now()-started;const end=getRun(r.id);end.status='stopped';end.reason='Frozen scene less-help evaluation';saveRun(end);persist();}
  }}));console.log(JSON.stringify({mode,scores:variants.map(variant=>({variant,correct:rows.filter(r=>r.variant===variant&&r.correct).length,total:rows.filter(r=>r.variant===variant).length})),usage:usage()}));
 }else throw Error('Unknown mode');
}
