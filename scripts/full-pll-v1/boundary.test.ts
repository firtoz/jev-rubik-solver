import {test,expect} from 'bun:test';
import {routines,groups,decide,routineRequest} from './policy';
import {apply,solved,inverse,isSolved,facts,hash} from '../../src/lib/cube';
import type {JevResponse} from '../../src/lib/types';
const response=(key:string,choice:string)=>({answers:{[key]:{choice}}}) as JevResponse;
test('all static illustrations solve their own legal PLL case within 22 turns',async()=>{
 const seen=new Set<string>();
 for(const r of routines){const before=await apply(await solved(),inverse(r.alg));expect(facts(before).middle&&facts(before).topOriented).toBe(true);expect(isSolved(await apply(before,r.alg))).toBe(true);expect(r.turns).toBeLessThanOrEqual(22);seen.add(hash(before));}
 expect(seen.size).toBe(288);
});
test('wrong model group propagates without code correction',async()=>{
 const before=await apply(await solved(),inverse(routines[0].alg));let calls=0;
 const d=await decide(before,'structured',async request=>{
  calls++;if(calls===1)return response('group',`corners-${groups.length}`);
  expect(request).toEqual(routineRequest(before,`corners-${groups.length}`,'structured'));
  return response('routine','reconsider');
 });expect(calls).toBe(2);expect(d.alg).toBe('');
});
