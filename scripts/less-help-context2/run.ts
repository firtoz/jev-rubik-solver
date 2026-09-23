import {mkdirSync,writeFileSync,readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {decide,targetRequest,actions,context} from './policy';
import {fixtures} from './fixtures';
import {createRun} from '../../src/server/runner';
import {evaluate,budget} from '../../src/server/jev';
import {db,getRun,saveRun} from '../../src/server/store';
import {apply,solved,facts,hash} from '../../src/lib/cube';
const dir='experiments/less-help-context-v2',split='less-help-context-v2';
const files=['scripts/less-help-context2/policy.ts','scripts/less-help-context2/fixtures.ts','scripts/less-help-context2/run.ts','scripts/less-help-roles/policy.ts','scripts/less-help-compose/policy.ts','scripts/less-help-v2/policy.ts','src/lib/cube.ts','src/lib/skills.ts','src/server/jev.ts'];
const sources=()=>Object.fromEntries(files.map(f=>[f,readFileSync(f,'utf8')]));
const digest=()=>createHash('sha256').update(JSON.stringify(sources())).digest('hex');
const usage=()=>db.query("SELECT COUNT(*) requests,COALESCE(SUM(l.amount),0) cost FROM ledger l JOIN runs r ON r.id=l.run_id WHERE json_extract(r.json,'$.split')=?").get(split) as {requests:number;cost:number};
const mode=process.argv[2];
if(mode==='prepare'){
 mkdirSync(dir,{recursive:true});writeFileSync(`${dir}/sources.json`,JSON.stringify(sources()),{flag:'wx'});writeFileSync(`${dir}/protocol.json`,JSON.stringify({digest:digest(),limits:{requests:2400,cost:0.35,concurrency:4,retries:0,integrationRequests:160,integrationTurns:200,integrationMs:120000},design:'Screen 20 reused development cases with protected solved middle-slot observations; gate >=18/20. Freeze sources before heldout generation. 40 new complete observations: 4 done,4 flipped,8 trapped,16 align,8 insert. Local subcases can repeat, full target plus protected-slot observations must not. Gate complete intention+action >=36/40. Then ten autonomous first-layer-complete integrations with model target selection; >=9/10 must finish all middle edges, preserve bottom throughout action endpoints. No state-based tactical correction. Keep every error/cap in denominator.',budgetBefore:budget()},null,2),{flag:'wx'});
 const screen=JSON.parse(readFileSync('experiments/less-help-v2/fixtures.json','utf8')).filter((c:any)=>c.split==='development');writeFileSync(`${dir}/screen-fixtures.json`,JSON.stringify(screen,null,2),{flag:'wx'});console.log('Frozen');
}else{
 if(JSON.parse(readFileSync(`${dir}/protocol.json`,'utf8')).digest!==digest())throw Error('Source changed');
 if(mode==='prepare-heldout'){
  const screen=JSON.parse(readFileSync(`${dir}/screen-results.json`,'utf8'));if(screen.rows.filter((r:any)=>r.correct).length<18)throw Error('Screen gate failed');
  const excluded=new Set<string>();for(const folder of ['less-help-v1','less-help-v2'])for(const c of JSON.parse(readFileSync(`experiments/${folder}/fixtures.json`,'utf8')))excluded.add(hash(c.state));
  const fs=await fixtures([...excluded]);writeFileSync(`${dir}/heldout-fixtures.json`,JSON.stringify(fs,null,2),{flag:'wx'});console.log(`Prepared ${fs.length} heldout`);
 }else if(mode==='screen'||mode==='heldout'||mode==='integration'){
  if(mode==='integration'){
   const heldout=JSON.parse(readFileSync(`${dir}/heldout-results.json`,'utf8'));if(heldout.rows.length!==40||heldout.rows.filter((r:any)=>r.correct).length<36)throw Error('Heldout gate failed');
  }
  writeFileSync(`${dir}/${mode}-started.json`,JSON.stringify({at:new Date().toISOString(),digest:digest()}),{flag:'wx'});
  let cases:any[];
  if(mode==='integration'){
   const excluded=JSON.parse(readFileSync(`${dir}/heldout-fixtures.json`,'utf8')).map((c:any)=>hash(c.state));const fs=await fixtures(excluded);cases=fs.filter(c=>!facts(c.state).middle).slice(0,10);writeFileSync(`${dir}/integration-fixtures.json`,JSON.stringify(cases,null,2),{flag:'wx'});
  }else cases=JSON.parse(readFileSync(`${dir}/${mode}-fixtures.json`,'utf8'));
  const rows:any[]=[];let cursor=0;const persist=()=>writeFileSync(`${dir}/${mode}-results.json`,JSON.stringify({rows,usage:usage(),budget:budget(),digest:digest()},null,2));
  await Promise.all(Array.from({length:4},async()=>{while(cursor<cases.length){const c=cases[cursor++],r=await createRun(c.scramble,'skills',split);const row:any={id:c.id,runId:r.id,family:c.family,expected:c.expected,accepted:c.accepted,before:c.state,exchanges:[],cycles:[]};rows.push(row);const started=performance.now();
   try{
    let state=c.state,previous:string|null=null;const history:string[]=[];
    const ask=async(request:any)=>{const u=usage(),b=budget();if(u.requests>=2400||u.cost+0.002688>0.35||b.reservedAndSpent+0.002688>b.cap)throw Error('Budget');if(mode==='integration'&&(row.exchanges.length>=160||performance.now()-started>=120000))throw Error('Integration request/time cap');const exchange=await evaluate(r.id,request,AbortSignal.timeout(mode==='integration'?Math.max(1,120000-(performance.now()-started)):30000),{maxAttempts:1});row.exchanges.push(exchange);return Object.fromEntries(Object.entries(exchange.response.answers).map(([k,a])=>[k,a.choice]));};
    if(mode!=='integration'){
     row.answers=await decide(state,c.target,ask);row.actionCorrect=c.accepted.includes(row.answers.action);row.intentCorrect=row.answers.intention===c.expected;row.correct=row.actionCorrect&&row.intentCorrect;row.after=await apply(state,actions[row.answers.action]);if(!facts(row.after).firstLayer)throw Error('Bottom layer damaged');
    }else{
     let turns=0;
     while(!facts(state).middle){
      const target:string=(await ask(targetRequest(state,previous,history.slice(-2)))).target;
      const answer=await decide(state,target,ask),alg=actions[answer.action];if(alg===undefined)throw Error('Invalid action');
      const n=alg.trim()?alg.trim().split(/\s+/).length:0;if(turns+n>200)throw Error('Turn cap');
      const after=await apply(state,alg);row.cycles.push({before:state,target,answer,alg,after});state=after;previous=target;history.push(alg);turns+=n;
      if(!facts(state).firstLayer)throw Error('Bottom layer damaged');persist();
     }
     row.turns=turns;row.after=state;row.correct=facts(state).middle&&facts(state).firstLayer;
    }
   }catch(e){row.error=String(e);row.correct=false;}finally{row.elapsedMs=performance.now()-started;const end=getRun(r.id);end.status='stopped';end.reason='Frozen less-help evaluation';saveRun(end);persist();}
  }}));console.log(JSON.stringify({mode,correct:rows.filter(r=>r.correct).length,total:rows.length,usage:usage()}));
 }else throw Error('Unknown mode');
}
