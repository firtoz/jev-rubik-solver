import {test,expect} from 'bun:test';
import type {JevResponse} from '../src/lib/types';
import {apply,solved,inverse,pieces,mapAlg,facts} from '../src/lib/cube';
import catalog from '../experiments/f2l-efficiency-v1/catalog.json';
import {decide,routines} from '../scripts/f2l-efficiency-v1/policy';
test('all 41 static pair cases cover the canonical domain and preserve other slots in all yaw frames',async()=>{
 expect(catalog.coverage.expected).toBe(41);expect(catalog.coverage.missing).toEqual([]);expect(new Set(catalog.rows.map(r=>r.key)).size).toBe(41);
 const homes={F:['DRF','FR'],R:['DBR','BR'],B:['DLB','BL'],L:['DFL','FL']};
 const base=await solved();
 for(const row of catalog.rows)for(const front of ['F','R','B','L'] as const){
  const alg=mapAlg(row.alg,front),s=await apply(base,inverse(alg));
  expect(facts(s).cross).toBe(true);
  for(const p of pieces(s).filter(p=>!p.piece.includes('U')&&!homes[front].includes(p.piece)))expect(p.solved).toBe(true);
  expect(facts(await apply(s,alg)).middle).toBe(true);
 }
});
test('wrong model-selected group is not repaired from cube state',async()=>{
 const base=await solved();const selected=routines.find(r=>r.group!==routines[0].group)!.group;let calls=0;
 const answer=await decide(await apply(base,inverse(routines[0].alg)),'grouped',async (request):Promise<JevResponse>=>{
  calls++;if(calls===1)return {model:'jev-1.13.0',usage:{input_tokens:0,output_tokens:0},answers:{group:{type:'choice',choice:selected,probabilities:{[selected]:1},confidence:1}}};
  const keys=Object.keys(request.questions.routine.criteria);expect(keys).not.toContain(routines[0].id);expect(keys).toEqual([...routines.filter(r=>r.group===selected).map(r=>r.id),'reconsider']);
  return {model:'jev-1.13.0',usage:{input_tokens:0,output_tokens:0},answers:{routine:{type:'choice',choice:'reconsider',probabilities:{reconsider:1},confidence:1}}};
 });expect(answer).toBe('reconsider');expect(calls).toBe(2);
});
test('controller reference views match the frozen routine observations in every yaw frame',async()=>{
 const {view,decide:controller}=await import('../scripts/f2l-efficiency-v1/controller');
 const {pairView}=await import('../scripts/f2l-efficiency-v1/policy');
 const base=await solved(),targets={F:'FR',R:'BR',B:'BL',L:'FL'};
 for(const row of catalog.rows)for(const front of ['F','R','B','L'] as const){
  const canonical=await apply(base,inverse(row.alg)),rotated=await apply(base,inverse(mapAlg(row.alg,front)));
  expect(view(rotated,targets[front],front)).toEqual(pairView(canonical));
  const choices=[{target:targets[front]},{front},{preparation:'routine'},{routine:row.id}];let i=0;
  const d=await controller(rotated,async (req):Promise<JevResponse>=>{const selected=choices[i++]!;if(req.questions.routine)expect((req.state as any).corner).toEqual(pairView(canonical).corner);return {model:'jev-1.13.0',usage:{input_tokens:0,output_tokens:0},answers:Object.fromEntries(Object.entries(selected).map(([k,v])=>[k,{type:'choice',choice:v!,probabilities:{[v!]:1},confidence:1}]))};});
  expect(facts(await apply(rotated,d.alg)).middle).toBe(true);
 }
});
test('three-turn extraction lifts both slot pieces while restoring cross and other pairs',async()=>{
 for(const [f,home] of Object.entries({F:['DRF','FR'],R:['DBR','BR'],B:['DLB','BL'],L:['DFL','FL']})){
  const s=await apply(await solved(),mapAlg("R U R'",f));expect(facts(s).cross).toBe(true);
  const ps=pieces(s);for(const p of ps.filter(p=>home.includes(p.piece)))expect(p.position.includes('U')).toBe(true);
  for(const p of ps.filter(p=>!p.piece.includes('U')&&!home.includes(p.piece)))expect(p.solved).toBe(true);
 }
});
test('full F2L goal selection remains a model choice and other branches replay unchanged',async()=>{
 const {decide:full,goalRequest}=await import('../scripts/f2l-efficiency-v1/full-policy');
 const record=await Bun.file('experiments/brain-teaching-confirmation-v1-http-resume/random-70.json').json();const step=record.steps[0];const run:any={state:step.before,stage:'',target:null,history:[]};let i=0;
 expect(Object.keys(goalRequest(run).questions.goal.criteria)).toContain('f2l');
 expect(Object.keys(goalRequest(run).questions.goal.criteria)).not.toContain('first-layer');
 const d=await full(run,async r=>{const e=step.exchanges[i++];if(i===1)expect(r).toEqual(goalRequest(run));else expect(r).toEqual(e.request);return e.response;});expect(d.alg).toBe(step.alg);expect(i).toBe(step.exchanges.length);
});
