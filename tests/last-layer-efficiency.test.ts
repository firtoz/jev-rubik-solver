import {test,expect} from 'bun:test';
import {references,outerTurns} from '../scripts/last-layer-efficiency-v1/reference';
import {routines,observation,request} from '../scripts/last-layer-efficiency-v1/policy';
import {solved,apply,inverse,hash,facts} from '../src/lib/cube';
test('fixed outer-turn notation equals published wide/slice routines and preserves prerequisites',async()=>{
 const base=await solved();for(const r of references)expect(hash(await apply(base,outerTurns(r.notation)))).toBe(hash(await apply(base,r.notation)));
 for(const r of routines){const start=await apply(base,inverse(r.alg));expect(JSON.stringify(observation(start,r.stage as any))).toBe(JSON.stringify(r.pattern));expect(facts(start).middle&&facts(start).topCross).toBe(true);if(r.stage==='edges')expect(facts(start).topOriented&&facts(start).cornersPlaced).toBe(true);}
});
test('reference set covers every legal orientation and even edge permutation',async()=>{
 const base=await solved();let orientations=0,edges=0;
 for(let a=0;a<3;a++)for(let b=0;b<3;b++)for(let c=0;c<3;c++){
  const s=structuredClone(base);s.CORNERS.orientation.splice(0,4,a,b,c,(6-a-b-c)%3);if(facts(s).topOriented)continue;
  const p=observation(s,'orientation');const r=routines.find(r=>r.stage==='orientation'&&JSON.stringify(r.pattern)===JSON.stringify(p));expect(r).toBeDefined();expect(facts(await apply(s,r!.alg)).topOriented).toBe(true);orientations++;
 }
 const perms=(a:number[]):number[][]=>a.length?a.flatMap((x,i)=>perms(a.filter((_,j)=>j!==i)).map(p=>[x,...p])):[[]];
 for(const p of perms([0,1,2,3])){if(p.reduce((n,x,i)=>n+p.slice(i+1).filter(y=>x>y).length,0)%2)continue;const s=structuredClone(base);s.EDGES.pieces.splice(0,4,...p);if(facts(s).solved)continue;const obs=observation(s,'edges');const r=routines.find(r=>r.stage==='edges'&&JSON.stringify(r.pattern)===JSON.stringify(obs));expect(r).toBeDefined();expect(facts(await apply(s,r!.alg)).solved).toBe(true);edges++;}
 expect(orientations).toBe(26);expect(edges).toBe(11);
 // The policy always presents the same full stage menu, without mechanical matching.
 expect(Object.keys(request(base,'edges','structured').questions.routine.criteria)).toHaveLength(18);
});

test('new full controller follows JEV-selected stage and routine without tactical correction',async()=>{
 const {decide,goalRequest}=await import('../scripts/last-layer-efficiency-v1/full-policy');
 const base=await solved(),run={state:base,stage:'',target:null,history:[]} as any;
 const {request:build}=await import('../scripts/last-layer-efficiency-v1/policy');
 const routine=routines.find(r=>r.stage==='edges')!;
 let calls=0;
 const result=await decide(run,async req=>{
  const key=calls++===0?'goal':'routine',choice=key==='goal'?'top-edges':routine.id;
  expect(JSON.stringify(req)).toBe(JSON.stringify(key==='goal'?goalRequest(run):build(base,'edges','structured')));
  return {model:'jev-1.13.0',usage:{input_tokens:0,output_tokens:0},answers:{[key]:{type:'choice',choice,probabilities:{[choice]:1},confidence:1}}};
 });
 expect(calls).toBe(2);expect(result.alg).toBe(routine.alg);
 expect(facts(await apply(base,result.alg)).solved).toBe(false);
});
