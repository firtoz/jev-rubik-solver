import {readFileSync,writeFileSync} from 'node:fs';
import {planCommitRequest} from './check';
import {createRun} from '../../src/server/runner';
import {evaluate,budget} from '../../src/server/jev';
import {getRun,saveRun} from '../../src/server/store';
const dir='experiments/plan-memory-v1';
writeFileSync(`${dir}/commit-check-started.json`,JSON.stringify({at:new Date().toISOString(),scope:'Retired memory-validation cases used for development of explicit applicability commitment. Not fresh validation.',limitRequests:18,dollars:0.01,retries:0}),{flag:'wx'});
writeFileSync(`${dir}/commit-check-policy.ts`,readFileSync('scripts/plan-memory/check.ts'));
const cases=JSON.parse(readFileSync(`${dir}/validation-fixtures.json`,'utf8')),rows:any[]=[];let cost=0;
for(const c of cases){
 const current={target:c.target,front:c.front,position:c.request.state.target.position,yellowDirection:c.request.state.target.yellowDirection,protectedBottomSlots:c.request.state.protectedBottomSlots};
 const request=planCommitRequest(current,c.pending),p=(request.state as any).pending;
 // Label stays offline and is never supplied to the policy or provider.
 const expected=current.target===p.target&&current.front===p.front&&current.position===p.startingPosition&&current.yellowDirection===p.yellowDirection&&!p.affectedBottomSlots.some((s:string)=>current.protectedBottomSlots.includes(s))?'resume':'reconsider';
 const run=await createRun('','skills','plan-commit-development');run.state=c.state;saveRun(run);const row:any={caseId:c.id,runId:run.id,expected};rows.push(row);
 try{const b=budget();if(cost+0.002688>0.01||b.reservedAndSpent+0.002688>b.cap)throw new Error('Budget');row.exchange=await evaluate(run.id,request,AbortSignal.timeout(30000),{maxAttempts:1});cost+=row.exchange.cost;row.actual=row.exchange.response.answers.plan.choice;row.correct=row.actual===expected;
 }catch(e){row.error=String(e);row.correct=false;}
 const saved=getRun(run.id);saved.status='stopped';saved.reason='Explicit plan commitment component';saveRun(saved);writeFileSync(`${dir}/commit-check-results.json`,JSON.stringify({rows,cost},null,2));
}
console.log(JSON.stringify({correct:rows.filter(r=>r.correct).length,total:rows.length,cost}));
