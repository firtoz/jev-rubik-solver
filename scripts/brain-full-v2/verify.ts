import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {cube3x3x3} from 'cubing/puzzles';
import {db} from '../../src/server/store';
import {Alg} from 'cubing/alg';
import {skills} from '../../src/lib/skills';
import earlyReference from '../brain-early-v3/routine-reference.json';
const dir=process.argv[2]||'experiments/brain-full-v2-validation';
const partial=process.argv.includes('--partial');
const read=(p:string)=>JSON.parse(readFileSync(p,'utf8'));
const result=read(`${dir}/results.json`),fixtures=read(`${dir}/fixtures.json`),manifest=read(`${dir}/started.json`),sources=read(`${dir}/sources.json`);
if(createHash('sha256').update(JSON.stringify(sources)).digest('hex')!==manifest.digest)throw new Error('Snapshot hash mismatch');
for(const [path,source]of Object.entries(sources))if(readFileSync(path,'utf8')!==source)throw new Error('Frozen policy changed: '+path);
const puzzle=await cube3x3x3.kpuzzle(),same=(a:any,b:any)=>JSON.stringify(a)===JSON.stringify(b),seen=new Set<string>(),rows:any[]=[];
for(const fixture of fixtures){const state=puzzle.defaultPattern().applyAlg(fixture.scramble).patternData;const h=JSON.stringify([state.EDGES,state.CORNERS]);if(seen.has(h))throw new Error('Duplicate start');seen.add(h);}
for(const summary of result.rows){
 const row=summary.record&&summary.status!=='running'?read(`${dir}/${summary.record}`):summary;
 if(row.status==='running'){if(partial)continue;throw new Error('Still running');}
 let pattern=puzzle.defaultPattern().applyAlg(fixtures.find((f:any)=>f.id===row.id).scramble),turns=0,lastAlg='';
 for(const step of row.steps){
  if(!same(pattern.patternData,step.before))throw new Error('Before mismatch');
  if(step.after){
   let expectedAlg:string;
   if(step.recovery==='undo'){
    const answer=step.exchanges.find((d:any)=>d.request.questions.recovery)?.response.answers.recovery.choice;
    if(answer!=='undo'||!lastAlg)throw new Error('Undo was not chosen by JEV');
    expectedAlg=new Alg(lastAlg).invert().toString().replace(/([UDFBRL])2'/g,'$12');
   }else{
    const decision=step.decision;
    const goal=step.exchanges.find((d:any)=>d.request.questions.goal)?.response.answers.goal.choice;
    const front=step.exchanges.find((d:any)=>d.request.questions.reference)?.response.answers.reference.choice;
    if(goal!==decision.goal||front!==decision.front)throw new Error('Goal/reference differs from JEV');
    if(decision.early){
     const last=(key:string)=>step.exchanges.filter((d:any)=>d.response.answers[key]).at(-1)?.response.answers[key].choice;
     const target=last(decision.goal==='daisy'?'gatherTarget':'transferTarget');
     if(target!==decision.target||last('decision')!==decision.early.preparation)throw new Error('Early target/preparation differs from JEV');
     const prep=decision.early.preparation;
     const chosen=prep==='execute'?last('routine'):prep==='clear'||prep==='align'?last('setup'):prep==='lower'?'lower-top-edge':prep==='insert'?'daisy-to-cross':null;
     if(chosen!==decision.skill)throw new Error('Early operation differs from JEV');
    }else{
     const operation=step.exchanges.find((d:any)=>d.request.questions.operation)?.response.answers.operation.choice;
     if(operation!==decision.skill)throw new Error('Operation differs from JEV');
    }
    const raw=earlyReference.find(s=>s.id===decision.skill)?.sequence??skills.find(s=>s.id===decision.skill)?.alg??decision.skill;
    if(typeof raw!=='string'||!raw.trim())throw new Error('No fixed routine');
    const ring=['F','R','B','L'],offset=ring.indexOf(decision.front);
    if(offset<0)throw new Error('Unknown frame');
    expectedAlg=raw.split(/\s+/).map(m=>ring.includes(m[0])?ring[(ring.indexOf(m[0])+offset)%4]+m.slice(1):m).join(' ');
   }
   if(expectedAlg!==step.alg)throw new Error('Executed sequence differs from selected routine');
   lastAlg=step.alg;
   const moves=step.alg.trim().split(/\s+/);if(moves.some((m:string)=>!/^([UDFBRL])('?|2)$/.test(m)))throw new Error('Nonstandard turn');
   turns+=moves.length;pattern=pattern.applyAlg(step.alg);if(!same(pattern.patternData,step.after))throw new Error('After mismatch');
  }
 }
 if(!same(pattern.patternData,row.after)||turns!==row.turns)throw new Error('Final mismatch');
 const solved=['EDGES','CORNERS'].every(o=>pattern.patternData[o].pieces.every((p:number,i:number)=>p===i&&pattern.patternData[o].orientation[i]===0));
 if((row.status==='solved')!==solved)throw new Error('Solve claim mismatch');
 {const external=db.query("SELECT COUNT(*) n FROM events WHERE run_id=? AND kind IN ('action','step-start','control')").get(row.runId) as {n:number};if(external.n)throw new Error('Interactive runner intervention detected');}
 const usage=db.query("SELECT COUNT(*) requests,COALESCE(SUM(amount),0) committed FROM ledger WHERE run_id=?").get(row.runId) as any;
 const events=db.query("SELECT payload FROM events WHERE run_id=? AND kind='request'").all(row.runId) as any[];
 if(events.length!==usage.requests)throw new Error('Ledger/event mismatch');
 if(usage.requests>500||turns>1000||(solved&&row.elapsedMs>600000))throw new Error('Attempt ceiling exceeded');
 rows.push({id:row.id,status:row.status,solved,turns,requests:usage.requests,committed:usage.committed,elapsedMs:row.elapsedMs,recoveries:row.steps.filter((s:any)=>s.recovery).length});
}
const report={partial,expected:fixtures.length,verified:rows.length,solved:rows.filter(r=>r.solved).length,allAttemptsPresent:rows.length===fixtures.length,rows};
writeFileSync(`${dir}/${partial?'partial-verification':'verification'}.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report));
