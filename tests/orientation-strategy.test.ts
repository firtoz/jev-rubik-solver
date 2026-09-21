import {test,expect} from 'bun:test';
import {orientationFixtures,pattern,sune} from '../scripts/request-eval/orientation-fixtures';
import {apply,mapAlg,focusedObservation,referenceObservation,facts} from '../src/lib/cube';
// Offline oracle verifies the documented static strategy. Production never imports this.
test('repeated-Sune staging covers every orientation and converges within three operations',async()=>{
 const cs=await orientationFixtures();expect(cs.length).toBe(27);
 async function check(state:any,depth:number):Promise<void>{
  const n=Object.values(pattern(state)).filter(x=>x==='U').length;
  if(n===4)return;
  expect(depth).toBeLessThan(3);
  const fronts=['F','R','B','L'].filter(front=>{
   const view=referenceObservation(focusedObservation({state,stage:'top-orientation',target:'whole',history:[]} as any),front);
   return view.stagePieces.find(p=>p.position==='ULF')!.stickers.white===({0:'L',1:'U',2:'F'} as Record<number,string>)[n];
  });
  expect(fronts.length).toBeGreaterThan(0);
  for(const front of fronts){const after=await apply(state,mapAlg(sune,front));expect(facts(after).middle).toBe(true);expect(facts(after).topCross).toBe(true);await check(after,depth+1);}
 }
 for(const c of cs)await check(c.state,0);
});
