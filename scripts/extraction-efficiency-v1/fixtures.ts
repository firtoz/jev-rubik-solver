import {writeFileSync} from 'node:fs';
import {solved,apply,pieces,facts} from '../../src/lib/cube';
import {routines} from './policy';
const base=await solved(),fixtures=[];
for(const extract of ['edge','corner'] as const)for(const c of extract==='edge'?[0,1,2,3,4]:[5,6,7])for(const e of extract==='edge'?[9,10,11]:[0,1,2,3,8]){
 const state=structuredClone(base);[state.CORNERS.pieces[c],state.CORNERS.pieces[4]]=[state.CORNERS.pieces[4],state.CORNERS.pieces[c]];[state.EDGES.pieces[e],state.EDGES.pieces[8]]=[state.EDGES.pieces[8],state.EDGES.pieces[e]];
 if((c!==4)!==(e!==8)){const a=[0,1,2,3].filter(i=>i!==e);[state.EDGES.pieces[a[0]],state.EDGES.pieces[a[1]]]=[state.EDGES.pieces[a[1]],state.EDGES.pieces[a[0]]];}
 const before=pieces(state),cornerPosition=before.find(p=>p.piece==='DRF')!.position,edgePosition=before.find(p=>p.piece==='FR')!.position,acceptable=[];
 for(const r of routines){
  const after=await apply(state,r.alg),ps=pieces(after),cp=ps.find(p=>p.piece==='DRF')!.position,ep=ps.find(p=>p.piece==='FR')!.position;
  if(facts(after).cross&&(cp.includes('U')||cp==='DRF')&&(ep.includes('U')||ep==='FR')&&[['DRF','FR'],['DBR','BR'],['DLB','BL'],['DFL','FL']].filter(pair=>pair.every(id=>before.find(p=>p.piece===id)!.solved)).every(pair=>pair.every(id=>ps.find(p=>p.piece===id)!.solved)))acceptable.push(r.id);
 }
 if(!acceptable.length)throw Error('Uncovered fixture '+JSON.stringify({extract,c,e,cornerPosition,edgePosition}));
 fixtures.push({id:extract+'-'+c+'-'+e,phase:fixtures.length%2?'validation':'development',state,cornerPosition,edgePosition,extract,acceptable});
}
writeFileSync('experiments/extraction-efficiency-v1/fixtures.json',JSON.stringify(fixtures,null,2));console.log({fixtures:fixtures.length});
