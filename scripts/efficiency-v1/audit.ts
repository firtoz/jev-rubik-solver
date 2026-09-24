// Offline diagnosis only. No evaluation labels or trajectory analysis enter policy requests.
import {readFileSync, writeFileSync} from 'node:fs';
import {Database} from 'bun:sqlite';
import {apply, facts, hash, isSolved, turns} from '../../src/lib/cube';
const source='experiments/brain-teaching-confirmation-v1-http-resume';
const verification=JSON.parse(readFileSync(`${source}/verification.json`,'utf8'));
const order=['daisy','cross','first-layer','middle-layer','top-cross','top-orientation','top-corners','top-edges'];
const flag:Record<string,string>={'cross':'cross','first-layer':'firstLayer','middle-layer':'middle','top-cross':'topCross','top-orientation':'topOriented','top-corners':'cornersPlaced','top-edges':'solved'};
const rows:any[]=[];
for(const v of verification.rows){
 const run=JSON.parse(readFileSync(`${source}/${v.id}.json`,'utf8'));
 let current=run.before,total=0;const seen=new Set([hash(current)]);const stages:Record<string,any>={};
 const actions:any[]=[];
 for(const [i,s] of run.steps.entries()){
  if(hash(current)!==hash(s.before))throw Error(`Discontinuous ${v.id}:${i}`);
  const goal=s.decision?.goal??s.exchanges?.find((e:any)=>e.response?.answers?.goal)?.response.answers.goal.choice??'recovery';
  const g=stages[goal]??={turns:0,actions:0,requests:0,repeatedStates:0,noops:0,regressions:0,completions:0,routines:{}};
  g.requests+=s.exchanges?.length??0;
  if(!s.after)continue;
  const moves=(s.alg??'').trim().split(/\s+/).filter(Boolean);
  if(moves.some((m:string)=>!turns.includes(m)))throw Error('Non-face move');
  const next=await apply(current,s.alg??'');if(hash(next)!==hash(s.after))throw Error(`Replay mismatch ${v.id}:${i}`);
  const before=facts(current) as any,after=facts(next) as any;
  const regression=Object.values(flag).filter(f=>before[f]===true&&after[f]===false);
  const repeated=seen.has(hash(next)),noop=hash(current)===hash(next);
  g.turns+=moves.length;g.actions++;g.repeatedStates+=Number(repeated);g.noops+=Number(noop);g.regressions+=regression.length;
  if(flag[goal]&&!before[flag[goal]]&&after[flag[goal]])g.completions++;
  const routine=s.decision?.skill??s.decision?.middle?.action??s.alg??'none';
  const r=g.routines[routine]??={actions:0,turns:0};r.actions++;r.turns+=moves.length;
  actions.push({round:i+1,goal,routine,alg:s.alg,turns:moves.length,repeated,noop,regression,completed:flag[goal]?after[flag[goal]]:after.daisy===4});
  total+=moves.length;seen.add(hash(next));current=next;
 }
 if(total!==v.turns||isSolved(current)!==v.solved)throw Error(`Summary mismatch ${v.id}`);
 rows.push({id:v.id,solved:v.solved,turns:total,stages,actions});
}
const solved=rows.filter(r=>r.solved);
const summary=order.map(stage=>{
 const vals=solved.map(r=>r.stages[stage]?.turns??0).sort((a,b)=>a-b);
 const sum=(key:string)=>solved.reduce((n,r)=>n+(r.stages[stage]?.[key]??0),0);
 const routines:Record<string,any>={};for(const r of solved)for(const [k,v] of Object.entries(r.stages[stage]?.routines??{}) as any){const t=routines[k]??={actions:0,turns:0};t.actions+=v.actions;t.turns+=v.turns;}
 return {stage,meanTurns:sum('turns')/solved.length,medianTurns:(vals[46]+vals[47])/2,min:vals[0],max:vals.at(-1),requests:sum('requests'),actions:sum('actions'),repeatedStates:sum('repeatedStates'),noops:sum('noops'),regressions:sum('regressions'),completions:sum('completions'),routines};
});
const db=new Database('.data/lab.sqlite',{readonly:true});const ledger=db.query('SELECT status,SUM(amount) amount,COUNT(*) requests FROM ledger GROUP BY status').all();db.close();
const out={source,at:new Date().toISOString(),attempts:rows.length,solved:solved.length,solvedWithin100:solved.filter(r=>r.turns<=100).length,ledger,summary,rows};
writeFileSync('experiments/efficiency-v1/audit.json',JSON.stringify(out,null,2));
console.log(JSON.stringify({ledger,summary},null,2));
