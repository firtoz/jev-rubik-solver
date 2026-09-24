import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {apply,hash,facts} from '../../src/lib/cube';
import {actions,request} from './corner-policy';
import {decide} from './corner-policy-v2';
import {decide as decideV3} from './corner-policy-v3';
import {decide as decideV4} from './corner-policy-v4';
const reports=[];
for(const sub of ['','/round2','/round3','/round4'])for(const phase of ['development','validation']){
 const path=`experiments/efficiency-v1${sub}/${phase}-results.json`;if(!existsSync(path))continue;
 const d=JSON.parse(readFileSync(path,'utf8'));if(d.rows.some((r:any)=>r.status==='running'))throw Error('Wait for terminal records');
 for(const row of d.rows){let state=row.before,total=0;const history:string[]=[];
  for(const step of row.steps){
   if(hash(state)!==hash(step.before))throw Error('State discontinuity');
   if(sub){let i=0;const choice=await ((sub==='/round4'?decideV4:sub==='/round3'?decideV3:decide) as typeof decide)(state,row.variant,history,async(req)=>{const e=step.exchanges[i++];if(!e)throw Error('Missing response');if(JSON.stringify(req)!==JSON.stringify(e.request))throw Error('Request drift');return e.response;});if(i!==step.exchanges.length||choice!==step.choice)throw Error('Decision drift');}
   else if(JSON.stringify(request(state,row.variant,history))!==JSON.stringify(step.request))throw Error('Request drift');
   if(step.alg!==actions[step.choice])throw Error('Action mismatch');
   if(step.after){state=await apply(state,step.alg);total+=step.alg.split(/\s+/).length;if(hash(state)!==hash(step.after))throw Error('Wrong execution');history.push(step.choice);if(!facts(state).middle||!facts(state).topCross||!facts(state).topOriented)throw Error('Preservation');}
  }
  if(total!==row.turns||hash(state)!==hash(row.after)||facts(state).cornersPlaced!==row.completed)throw Error('Outcome mismatch');
  const pass=row.steps.at(-1)?.choice==='done'&&facts(state).cornersPlaced&&total<=row.ceiling;if(pass!==row.passed)throw Error('Scoring mismatch');
 }
 const variants=[...new Set(d.rows.map((r:any)=>r.variant))];
 reports.push({sub,phase,usage:d.usage,scores:variants.map(v=>{const rows=d.rows.filter((r:any)=>r.variant===v);return {variant:v,passed:rows.filter((r:any)=>r.passed).length,n:rows.length,turns:rows.map((r:any)=>r.turns),requests:rows.reduce((n:number,r:any)=>n+r.steps.reduce((m:number,s:any)=>m+(s.exchanges?.length??1),0),0)};})});
}
writeFileSync('experiments/efficiency-v1/screen-verification.json',JSON.stringify(reports,null,2));console.log(JSON.stringify(reports,null,2));
