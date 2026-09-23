import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {decide,scene,actions} from './policy';
import {label} from '../less-help-scene/fixtures';
import {apply,solved,hash} from '../../src/lib/cube';
import {db} from '../../src/server/store';
const dir='experiments/teaching-study-v2';
const protocol=JSON.parse(readFileSync(`${dir}/protocol.json`,'utf8')),source=JSON.parse(readFileSync(`${dir}/sources.json`,'utf8'));
for(const [f,text] of Object.entries(source))if(readFileSync(f,'utf8')!==text)throw Error('Frozen source changed: '+f);
if(createHash('sha256').update(JSON.stringify(source)).digest('hex')!==protocol.digest)throw Error('Digest mismatch');
const assert=(b:unknown,m:string)=>{if(!b)throw Error(m);};
const bottom=(s:any)=>[4,5,6,7].every(i=>s.EDGES.pieces[i]===i&&s.EDGES.orientation[i]===0&&s.CORNERS.pieces[i]===i&&s.CORNERS.orientation[i]===0);
const middle=(s:any)=>[8,9,10,11].every(i=>s.EDGES.pieces[i]===i&&s.EDGES.orientation[i]===0);
const oldFiles=['experiments/less-help-v1/fixtures.json','experiments/less-help-v2/fixtures.json','experiments/less-help-scene-v1/screen-fixtures.json'];
const old=oldFiles.flatMap(f=>JSON.parse(readFileSync(f,'utf8')));
for(const phase of ['screen','heldout','integration']){old.push(...JSON.parse(readFileSync(`experiments/teaching-study-v1/${phase}-fixtures.json`,'utf8')));for(const row of JSON.parse(readFileSync(`experiments/teaching-study-v1/${phase}-results.json`,'utf8')).rows)for(const c of row.cycles)old.push({state:c.before},{state:c.after});}
old.push(...JSON.parse(readFileSync(`${dir}/screen-fixtures.json`,'utf8')));
const seenStates=new Set(old.map(c=>hash(c.state))),seenScenes=new Set(old.map(c=>JSON.stringify(scene(c.state))));
const reports:any[]=[];
for(const phase of ['heldout','integration']){
 if(!existsSync(`${dir}/${phase}-results.json`))continue;
 const cases=JSON.parse(readFileSync(`${dir}/${phase}-fixtures.json`,'utf8')),result=JSON.parse(readFileSync(`${dir}/${phase}-results.json`,'utf8'));
 assert(cases.length===(phase==='heldout'?40:10),'Fixture denominator');assert(result.rows.length===cases.length,'Incomplete result rows');
 const checked=[];
 for(const c of cases){
  assert(!seenStates.has(hash(c.state))&&!seenScenes.has(JSON.stringify(scene(c.state))),'Fixture overlap');seenStates.add(hash(c.state));seenScenes.add(JSON.stringify(scene(c.state)));
  assert(hash(await apply(await solved(),c.scramble))===hash(c.state),'Scramble replay');assert(bottom(c.state),'Bottom initial');
  if(phase==='integration')assert(!middle(c.state),'Trivial integration');
  const row=result.rows.find((r:any)=>r.id===c.id);assert(row&&typeof row.correct==='boolean','Nonterminal row');
  let state=c.state,cursor=0,previous:string|null=null,turns=0;const history:string[]=[];
  for(const cycle of row.cycles){
   assert(hash(state)===hash(cycle.before),'Cycle before');
   const answer=await decide(state,row.variant,async request=>{const e=row.exchanges[cursor++];assert(e&&JSON.stringify(request)===JSON.stringify(e.request),'Request/controller replay mismatch');assert(Object.keys(e.request).sort().join(',')==='model,questions,state','Request keys');return Object.fromEntries(Object.entries(e.response.answers).map(([k,a]:any)=>[k,a.choice]));},previous,history.slice(-2));
   assert(JSON.stringify(answer)===JSON.stringify(cycle.answer),'Recorded answer mismatch');assert(actions[answer.action]===cycle.alg,'Action map mismatch');
   state=await apply(state,cycle.alg);assert(hash(state)===hash(cycle.after),'Cycle after');assert(bottom(state),'Bottom preservation');
   previous=answer.target;history.push(cycle.alg);turns+=cycle.alg.trim()?cycle.alg.trim().split(/\s+/).length:0;
  }
  const ledger=db.query('SELECT COUNT(*) n, COALESCE(SUM(amount),0) cost FROM ledger WHERE run_id=?').get(row.runId) as any;
  assert(ledger.n>=row.exchanges.length,'Missing request ledger');assert(turns<=200,'Turn cap');
  if(!row.error)assert(cursor===row.exchanges.length,'Unconsumed exchanges');
  if(phase==='heldout'){
   const last=row.cycles.at(-1),gold=last?(await label(c.state))[last.answer.target]:null;
   const pass=!row.error&&!!gold&&gold.eligible&&gold.intention===last.answer.intention&&gold.accepted.includes(last.answer.action);
   assert(row.correct===pass,'Heldout scoring mismatch');
  }else {assert(ledger.n<=160,'Request cap');assert(row.correct===(!row.error&&bottom(state)&&middle(state)),'Integration outcome mismatch');}
  checked.push({id:c.id,correct:row.correct,cycles:row.cycles.length,requests:ledger.n,turns,error:row.error??null});
 }
 reports.push({phase,success:checked.filter(x=>x.correct).length,total:checked.length,checked});
}
const ledger=db.query("SELECT COUNT(*) requests,COALESCE(SUM(l.amount),0) cost FROM ledger l JOIN runs r ON r.id=l.run_id WHERE json_extract(r.json,'$.split') IN ('teaching-study-v1','teaching-study-v2')").get() as any;assert(ledger.cost<=0.25,'Study cost');
const report={verifiedAt:new Date().toISOString(),digest:protocol.digest,reports,ledger,scope:'Offline replay of exact model requests/controller answers and authoritative cube transformations. Independent raw piece-index predicates verify bottom and middle. No network calls.'};writeFileSync(`${dir}/verification.json`,JSON.stringify(report,null,2));console.log(JSON.stringify({reports:reports.map(r=>({phase:r.phase,success:r.success,total:r.total})),ledger}));
