import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {decide,actions,scene} from './policy';
import {generate,label} from './fixtures';
import {createRun} from '../../src/server/runner';
import {evaluate,budget} from '../../src/server/jev';
import {db,getRun,saveRun} from '../../src/server/store';
import {apply,facts,hash} from '../../src/lib/cube';
const dir='experiments/less-help-scene-v1',split='less-help-scene-v1';
const files=['scripts/less-help-scene/policy.ts','scripts/less-help-scene/fixtures.ts','scripts/less-help-scene/run.ts','scripts/less-help-roles/policy.ts','scripts/less-help-compose/policy.ts','scripts/less-help-v2/policy.ts','src/lib/cube.ts','src/lib/skills.ts','src/server/jev.ts'];
const sources=()=>Object.fromEntries(files.map(f=>[f,readFileSync(f,'utf8')]));const digest=()=>createHash('sha256').update(JSON.stringify(sources())).digest('hex');
const usage=()=>db.query("SELECT COUNT(*) requests,COALESCE(SUM(l.amount),0) cost FROM ledger l JOIN runs r ON r.id=l.run_id WHERE json_extract(r.json,'$.split')=?").get(split) as {requests:number;cost:number};
const mode=process.argv[2];
if(mode==='prepare'){
 mkdirSync(dir,{recursive:true});writeFileSync(`${dir}/sources.json`,JSON.stringify(sources()),{flag:'wx'});writeFileSync(`${dir}/protocol.json`,JSON.stringify({digest:digest(),limits:{requests:2500,cost:0.35,concurrency:4,retries:0,integrationRequests:160,integrationTurns:200,integrationMs:120000},design:'20 new development scenes, then >=18/20 gates 40 heldout unique observed scenes. Whole selection/intention/action scored against offline all-target labels. Must choose unfinished target unless all four middle edges solved. All align/insert/extract/done families must occur among heldout choices, >=36/40 overall. Four middle-complete scenes test leaving solved pieces alone. All eight non-bottom edges shown only for target selection; local subcases can repeat. Then ten noncomplete integration starts, >=9/10 required. Exclude development states/scenes from later phases. Targets and all tactics chosen by JEV.',budgetBefore:budget()},null,2),{flag:'wx'});writeFileSync(`${dir}/screen-fixtures.json`,JSON.stringify(await generate(20,861942),null,2),{flag:'wx'});console.log('Prepared');
}else{
 if(JSON.parse(readFileSync(`${dir}/protocol.json`,'utf8')).digest!==digest())throw Error('Source changed');
 if(mode==='prepare-heldout'||mode==='prepare-integration'){
  const prior=mode==='prepare-heldout'?'screen':'heldout',r=JSON.parse(readFileSync(`${dir}/${prior}-results.json`,'utf8'));
  if(r.rows.filter((x:any)=>x.correct).length<(prior==='screen'?18:36))throw Error('Gate failed');
  if(prior==='heldout'&&!['done','align','insert','extract'].every(k=>r.rows.some((x:any)=>x.expected===k)))throw Error('Coverage gate failed');
  const old=['screen',...(prior==='heldout'?['heldout']:[])].flatMap(p=>JSON.parse(readFileSync(`${dir}/${p}-fixtures.json`,'utf8')));
  const next=prior==='screen'?'heldout':'integration';let fs=await generate(prior==='screen'?40:14,prior==='screen'?629184:811972,old.map(c=>hash(c.state)),old.map(c=>JSON.stringify(scene(c.state))));if(next==='integration')fs=fs.filter(c=>!facts(c.state).middle).slice(0,10);
  writeFileSync(`${dir}/${next}-fixtures.json`,JSON.stringify(fs,null,2),{flag:'wx'});console.log('Prepared '+fs.length+' '+next);
 }else if(['screen','heldout','integration'].includes(mode)){
  writeFileSync(`${dir}/${mode}-started.json`,JSON.stringify({at:new Date().toISOString(),digest:digest()}),{flag:'wx'});const cases=JSON.parse(readFileSync(`${dir}/${mode}-fixtures.json`,'utf8')),rows:any[]=[];let cursor=0;
  const persist=()=>writeFileSync(`${dir}/${mode}-results.json`,JSON.stringify({rows,usage:usage(),budget:budget(),digest:digest()},null,2));
  await Promise.all(Array.from({length:4},async()=>{while(cursor<cases.length){const c=cases[cursor++],r=await createRun(c.scramble,'skills',split),row:any={id:c.id,runId:r.id,before:c.state,exchanges:[],cycles:[]};rows.push(row);const started=performance.now();
   try{
    let state=c.state,previous:string|null=null,turns=0;const history:string[]=[];
    const ask=async(request:any)=>{const u=usage(),b=budget();if(u.requests>=2500||u.cost+0.002688>0.35||b.reservedAndSpent+0.002688>b.cap)throw Error('Budget');if(mode==='integration'&&(row.exchanges.length>=160||performance.now()-started>=120000))throw Error('Integration cap');const exchange=await evaluate(r.id,request,AbortSignal.timeout(mode==='integration'?Math.max(1,120000-(performance.now()-started)):30000),{maxAttempts:1});row.exchanges.push(exchange);return Object.fromEntries(Object.entries(exchange.response.answers).map(([k,a])=>[k,a.choice]));};
    do{
     const answer=await decide(state,ask,previous,history.slice(-2)),alg=actions[answer.action];if(alg===undefined)throw Error('Invalid action');const n=alg.trim()?alg.trim().split(/\s+/).length:0;if(turns+n>200)throw Error('Turn cap');
     const after=await apply(state,alg);row.cycles.push({before:state,answer,alg,after});state=after;previous=answer.target;history.push(alg);turns+=n;
     if(!facts(state).firstLayer)throw Error('Bottom damaged');
     if(mode!=='integration'){const gold=c.labels[answer.target];row.expected=gold?.intention;row.correct=!!gold&&gold.eligible&&gold.intention===answer.intention&&gold.accepted.includes(answer.action);break;}
     persist();
    }while(!facts(state).middle);
    row.turns=turns;row.after=state;if(mode==='integration')row.correct=facts(state).middle;
   }catch(e){row.error=String(e);row.correct=false;}finally{row.elapsedMs=performance.now()-started;const end=getRun(r.id);end.status='stopped';end.reason='Frozen scene less-help evaluation';saveRun(end);persist();}
  }}));console.log(JSON.stringify({mode,correct:rows.filter(r=>r.correct).length,total:rows.length,usage:usage()}));
 }else throw Error('Unknown mode');
}
