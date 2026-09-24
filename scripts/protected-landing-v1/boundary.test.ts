import {test,expect} from 'bun:test';
import {readFileSync} from 'node:fs';
import {readinessRequest,preparationRequest} from './sequential-v2';
import {decide} from './early-policy';
import {pieces,mapAlg} from '../../src/lib/cube';
const fixtures=JSON.parse(readFileSync('experiments/protected-landing-v1/fresh-v2-fixtures.json','utf8'));
test('incorrect JEV readiness remains its decision, not corrected by cube facts',async()=>{
 const f=fixtures.find((f:any)=>f.expected==='reorient');
 const ring=['F','R','B','L'],local=(x:string)=>ring.includes(x)?ring[(ring.indexOf(x)-ring.indexOf(f.front)+4)%4]:x;
 const target=pieces(f.before).find(p=>p.kind==='edge'&&[...p.position].map(local).sort().join('')===[...f.state.target.position].sort().join(''))!;
 const asked:string[]=[];
 const result=await decide(f.before,async (r):Promise<Record<string,string>>=>{
  const key=Object.keys(r.questions)[0];asked.push(key);
  if(r.questions.goal)return {goal:'daisy',gatherTarget:target.piece,transferTarget:'none'};
  if(r.questions.situation)return {situation:'top',reference:f.front};
  if(r.questions.routine)return {routine:f.state.selectedRoutine.id};
  if(r.questions.readiness)return {readiness:'execute'}; // deliberately wrong
  throw Error('Code attempted to repair the selected action '+key);
 });
 expect(result.preparation).toBe('execute');
 expect(result.alg).toBe(mapAlg(f.state.selectedRoutine.sequence,f.front));
 expect(asked).not.toContain('decision');
});
test('evaluation labels and generation histories are absent from live requests',()=>{
 for(const f of fixtures)for(const r of [readinessRequest(f.state),preparationRequest(f.state)]){
  expect(JSON.stringify(r)).not.toContain('expected');expect(JSON.stringify(r)).not.toContain('scramble');
 }
});
test('model reorientation executes its U turn and clears the old routine plan',async()=>{
 const f=fixtures.find((f:any)=>f.expected==='reorient');
 const ring=['F','R','B','L'],local=(x:string)=>ring.includes(x)?ring[(ring.indexOf(x)-ring.indexOf(f.front)+4)%4]:x;
 const target=pieces(f.before).find(p=>p.kind==='edge'&&[...p.position].map(local).sort().join('')===[...f.state.target.position].sort().join(''))!;
 const result=await decide(f.before,async (r):Promise<Record<string,string>>=>{
  if(r.questions.goal)return {goal:'daisy',gatherTarget:target.piece,transferTarget:'none'};
  if(r.questions.situation)return {situation:'top',reference:f.front};
  if(r.questions.routine)return {routine:f.state.selectedRoutine.id};
  if(r.questions.readiness)return {readiness:'prepare'};
  if(r.questions.decision)return {decision:'reorient'};
  if(r.questions.destination)return {destination:'UR'};
  if(r.questions.setup)return {setup:"U'"};
  throw Error('Unexpected question');
 });
 expect(result.alg).toBe("U'");expect(result.preparation).toBe('reorient');
 // Runner retains pending plans only for clear, so reorient reobserves with a new reference.
 expect(result.preparation==='clear').toBe(false);
});
