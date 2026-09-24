import {existsSync,readFileSync,writeFileSync} from 'node:fs';
import {Database} from 'bun:sqlite';
import {decide,actions} from './policy';
import {apply,facts,hash} from '../../src/lib/cube';
import {observe} from '../efficiency-v1/corner-policy';
import {validateResponse} from '../../src/server/jev';
const dir='experiments/diagonal-corners-v1',reports=[],db=new Database('.data/lab.sqlite',{readonly:true});
const fixtures=JSON.parse(readFileSync('experiments/efficiency-v1/corner-fixtures.json','utf8'));
for(const phase of ['development','validation']){
 if(!existsSync(`${dir}/${phase}-results.json`))continue;
 const load=(s:string)=>JSON.parse(readFileSync(`${dir}/${phase}-${s}.json`,'utf8')),d=load('results'),start=load('started');
 if(d.rows.length!==12||d.rows.some((r:any)=>r.status==='running'))throw Error('Incomplete phase');
 for(const [p,s] of Object.entries(start.sources))if(readFileSync(p,'utf8')!==s)throw Error('Source drift');
 for(const row of d.rows){
  const fixture=fixtures.find((f:any)=>f.id===row.id);let state=fixture.state,total=0,correctStop=false;const history:string[]=[];
  const pairs=Object.values(observe(state).sides).filter(x=>x.cornerStickers[0].color===x.cornerStickers[1].color).length,ceiling=pairs===4?1:15;
  for(const step of row.steps){
   let i=0;if(hash(state)!==hash(step.before))throw Error('State drift');
   const choice=await decide(state,'words',history,async req=>{
    const x=step.exchanges[i++];if(!x||JSON.stringify(req)!==JSON.stringify(x.request)||JSON.stringify(validateResponse(x.nativeResponse,req))!==JSON.stringify(x.response))throw Error('Exchange drift');
    const wire=db.query("SELECT payload FROM events WHERE run_id=? AND kind='request' AND json_extract(payload,'$.id')=?").get(row.runId,x.id) as any;
    if(JSON.stringify(JSON.parse(wire.payload).request)!==JSON.stringify(req))throw Error('Wire drift');return x.response;
   });
   if(i!==step.exchanges.length||choice!==step.choice||actions[choice]!==step.alg)throw Error('Choice drift');
   if(choice==='done'){correctStop=facts(state).cornersPlaced;continue;}
   if(step.after){state=await apply(state,actions[choice]);total+=actions[choice].split(' ').length;history.push(choice);if(hash(state)!==hash(step.after)||!facts(state).middle||!facts(state).topCross||!facts(state).topOriented)throw Error('Effect drift');}
  }
  if(hash(state)!==hash(row.after)||total!==row.turns||row.ceiling!==ceiling||row.passed!==(correctStop&&total<=ceiling))throw Error('Score drift');
 }
 reports.push({phase,n:d.rows.length,passed:d.rows.filter((r:any)=>r.passed).length,usage:d.usage,turns:d.rows.map((r:any)=>r.turns),failures:d.rows.filter((r:any)=>!r.passed).map((r:any)=>({id:r.id,status:r.status,turns:r.turns}))});
}
db.close();writeFileSync(dir+'/verification.json',JSON.stringify(reports,null,2));console.log(reports);
