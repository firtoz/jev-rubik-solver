import {mkdirSync,writeFileSync,readFileSync,existsSync} from 'node:fs';
import {fixtures} from './move-prediction';
import {requestFor,coordinate,vectors} from './geometric-prediction';
import {evaluate,budget,MODEL} from '../../src/server/jev';
import {createRun} from '../../src/server/runner';
import {getRun,saveRun} from '../../src/server/store';
import type {JevRequest} from '../../src/lib/types';
const rule=`Apply the mechanics, not a solving strategy. a is the outward unit normal of the turned face. v is the input vector. If your earlier affected answer is no, the output is v unchanged. Otherwise define d = ax*vx + ay*vy + az*vz. For clockwise viewed from outside: output = a*d - (a cross v). For counterclockwise: output = a*d + (a cross v). For a half turn: output = 2*a*d - v. The cross product components are (ay*vz - az*vy, az*vx - ax*vz, ax*vy - ay*vx). Apply the same rotation separately to the piece center and its sticker normal. Do not confuse them. Use the recorded previous model answer without silently replacing it.`;
export function vectorRequest(source:JevRequest,membership:string):JevRequest{
 const s=source.state as any,face=s.proposedTurn[0];
 const state={previousModelAnswer:{affected:membership},a:vectors[face],turn:s.proposedTurn.includes('2')?'half':s.proposedTurn.includes("'")?'counterclockwise':'clockwise',center:coordinate(s.target.position),stickerNormal:vectors[s.target.stickers[s.trackedSticker]]};
 return {model:MODEL,state,questions:Object.fromEntries(['center','stickerNormal'].flatMap(v=>['x','y','z'].map(axis=>[`${v}_${axis}`,{type:'choice',instructions:rule+` For v=${v}, give only the ${axis} component of the resulting vector.`,criteria:{negative:'-1',zero:'0',positive:'+1'}}])))};
}
if(import.meta.main){
 const validation=process.argv.includes('--validation');
 const dir=`experiments/vector-prediction-v3-${validation?'validation':'development'}`;
 if(existsSync(`${dir}/started.json`))throw new Error('Already started.');
 const cases=await fixtures(validation?161803:271828,validation?2:0);
 const old=JSON.parse(readFileSync('experiments/move-prediction-v1/fixtures.json','utf8'));
 if(new Set(cases.map(c=>c.stateHash)).size!==20||(validation&&cases.some(c=>old.some((x:any)=>x.stateHash===c.stateHash))))throw new Error('Overlap');
 const start=budget();if(start.cap-start.reservedAndSpent<40*64000*.042/1e6)throw new Error('Budget');
 mkdirSync(dir,{recursive:true});writeFileSync(`${dir}/fixtures.json`,JSON.stringify(cases,null,2));writeFileSync(`${dir}/source.ts`,readFileSync(import.meta.path));writeFileSync(`${dir}/started.json`,JSON.stringify({at:new Date().toISOString(),start,maxRequests:40},null,2));
 const results:any[]=[];
 for(const c of cases){
  const run=await createRun(c.scramble,'primitive','vector-prediction');let row:any={caseId:c.id,runId:run.id,affected:c.affected,expected:{center:coordinate(c.expected.position),stickerNormal:vectors[c.expected.stickerDirection]}};const exchanges:any[]=[];
  try{
   const a=await evaluate(run.id,requestFor(c.request,'membership'),AbortSignal.timeout(30000),{maxAttempts:1});exchanges.push(a);const member=a.response.answers.affected.choice;row.membershipCorrect=(member==='yes')===c.affected;
   const d=await evaluate(run.id,vectorRequest(c.request,member),AbortSignal.timeout(30000),{maxAttempts:1});exchanges.push(d);
   const number:Record<string,number>={negative:-1,zero:0,positive:1};row.actual=Object.fromEntries(['center','stickerNormal'].map(v=>[v,['x','y','z'].map(axis=>number[d.response.answers[`${v}_${axis}`].choice])]));
   row.positionCorrect=JSON.stringify(row.actual.center)===JSON.stringify(row.expected.center);row.stickerCorrect=JSON.stringify(row.actual.stickerNormal)===JSON.stringify(row.expected.stickerNormal);
  }catch(e){row.error=String(e);}
  row.exchanges=exchanges;results.push(row);const saved=getRun(run.id);saved.status='stopped';saved.reason='Vector prediction probe complete';saveRun(saved);
  const summary={total:20,completed:results.length,membership:results.filter(r=>r.membershipCorrect).length,position:results.filter(r=>r.positionCorrect).length,sticker:results.filter(r=>r.stickerCorrect).length,both:results.filter(r=>r.positionCorrect&&r.stickerCorrect).length,cost:results.flatMap(r=>r.exchanges).reduce((n,d)=>n+d.cost,0),errors:results.filter(r=>r.error).length};
  writeFileSync(`${dir}/results.json`,JSON.stringify({summary,results},null,2));console.log(JSON.stringify(summary));
 }
}
