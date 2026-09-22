import {mkdirSync,writeFileSync} from 'node:fs';
import {createRun} from '../../src/server/runner';
import {evaluate,budget} from '../../src/server/jev';
import {getRun,saveRun} from '../../src/server/store';
import {solved,apply,pieces} from '../../src/lib/cube';
const dir='experiments/top-slot-transfer-v1';
mkdirSync(dir,{recursive:true});
writeFileSync(`${dir}/started.json`,JSON.stringify({at:new Date().toISOString(),limits:{requests:24,dollars:0.01,retries:0},scope:'Exhaustive 12 nonidentity transfers, two fixed teaching forms. Labels stay offline.'}),{flag:'wx'});
const forms={
 cycles:{instructions:'Move the selected empty slot from currentPosition to requiredPosition using one U rotation. The target remains below U.',criteria:{U:'UF→UL, UL→UB, UB→UR, UR→UF',"U'":'UF→UR, UR→UB, UB→UL, UL→UF',U2:'UF↔UB, UR↔UL'}},
 directions:{instructions:'Choose the upper-face turn carrying the empty space from its current position to the required position. Read source and destination as an ordered pair. A half turn goes to the opposite side; a quarter turn goes to a neighbouring side. This fixed reference applies to any cube.',criteria:{U:'Quarter turn: front to left; left to back; back to right; right to front.',"U'":'Quarter turn: front to right; right to back; back to left; left to front.',U2:'Half turn: front to back, back to front, left to right, or right to left.'}}
};
const names:Record<string,string>={UF:'front',UR:'right',UB:'back',UL:'left'};
const rows:any[]=[];let cost=0;
const base=await solved();
for(const [variant,form]of Object.entries(forms))for(const source of Object.keys(names))for(const destination of Object.keys(names)){
 if(source===destination)continue;
 const expected=[];
 for(const move of ['U',"U'",'U2'])if(pieces(await apply(base,move)).find(p=>p.kind==='edge'&&p.piece===source)!.position===destination)expected.push(move);
 if(expected.length!==1)throw new Error('Mechanics label invalid');
 const row:any={variant,source,destination,expected:expected[0]};rows.push(row);
 const run=await createRun('','skills','top-slot-transfer-v1');row.runId=run.id;
 try{
  const b=budget();if(cost+0.002688>0.01||b.reservedAndSpent+0.002688>b.cap)throw new Error('Budget');
  const state=variant==='cycles'?{currentPosition:source,requiredPosition:destination}:{currentPosition:names[source],requiredPosition:names[destination]};
  row.exchange=await evaluate(run.id,{model:'jev-1.13.0',state,questions:{setup:{type:'choice',...form}}},AbortSignal.timeout(30000),{maxAttempts:1});
  cost+=row.exchange.cost;row.actual=row.exchange.response.answers.setup.choice;row.correct=row.actual===row.expected;
 }catch(e){row.error=String(e);writeFileSync(`${dir}/results.json`,JSON.stringify({rows,cost},null,2));throw e;}
 finally{const r=getRun(run.id);r.status='stopped';r.reason='Finite top-slot component probe';saveRun(r);}
 writeFileSync(`${dir}/results.json`,JSON.stringify({rows,cost},null,2));
}
console.log(JSON.stringify({cost,scores:Object.keys(forms).map(variant=>({variant,correct:rows.filter(r=>r.variant===variant&&r.correct).length,total:12}))},null,2));
