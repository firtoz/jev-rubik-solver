import {db,getRun,saveRun,event} from '../../src/server/store';
import {measuredSkillDecision} from '../../src/server/measured-policy';
import {evaluate,MODEL,budget} from '../../src/server/jev';
import {apply,pieces,facts} from '../../src/lib/cube';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
const source=JSON.parse((db.query('SELECT json FROM benchmarks WHERE id=?').get('b0153e76-5ec2-46ee-b3f3-31004824d8b0') as any).json);
if(source.status!=='retired')throw Error('Retire held-out evaluation before using failures for development');
const dir='experiments/abstention-regressions-'+(process.argv[2]||'v26');mkdirSync(dir,{recursive:true});
const cases=source.results.filter((r:any)=>!r.verifiedSolved).map((r:any)=>getRun(r.runId));
writeFileSync(dir+'/frozen.json',JSON.stringify({cases,source:readFileSync('src/server/measured-policy.ts','utf8')}),{flag:'wx'});
const start=budget(),results:any[]=[];
for(const old of cases){
 const run={...old,id:crypto.randomUUID(),status:'stopped' as const,split:'probe',benchmarkId:null,requests:0,cost:0,tokens:0,activeMs:0,reason:'Retired failure regression',createdAt:new Date().toISOString()};saveRun(run);event(run.id,'probe-created',{state:run.state,sourceRun:old.id});
 let row:any={sourceRun:old.id,runId:run.id,stage:run.stage};
 try{
 const d=await measuredSkillDecision(run,MODEL,async req=>{
 if(budget().usage-start.usage>.025)throw Error('Local budget');
 return(await evaluate(run.id,req,AbortSignal.timeout(30000),{maxAttempts:1})).response;
 },[]);
 const after=await apply(run.state,d.alg),beforePieces=pieces(run.state),afterPieces=pieces(after);
 const valid=run.stage==='cross'?afterPieces.find(p=>p.piece===d.target)?.stickers.yellow==='U':run.stage==='top-orientation'?facts(after).middle&&facts(after).topCross&&afterPieces.filter(p=>p.kind==='corner'&&p.stickers.white==='U').length===1:!beforePieces.find(p=>p.piece===d.target)?.solved&&facts(after).firstLayer;
 row={...row,decision:d,correct:valid,factsBefore:facts(run.state),factsAfter:facts(after)};
 }catch(e){row={...row,correct:false,error:String(e)};}
 results.push(row);writeFileSync(dir+'/results.json',JSON.stringify({start,end:budget(),results},null,2));
}
console.log(JSON.stringify({correct:results.filter(r=>r.correct).length,total:results.length,cost:budget().usage-start.usage,failures:results.filter(r=>!r.correct)}));
