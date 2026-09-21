// Offline fixture generation only; never imported by the solving policy.
import {apply,solved,pieces,mapAlg} from '../../src/lib/cube';
export const sune="R U R' U R U2 R'";
export const pattern=(state:any)=>Object.fromEntries(pieces(state).filter(p=>p.kind==='corner'&&p.position.includes('U')).sort((a,b)=>a.position.localeCompare(b.position)).map(p=>[p.position,p.stickers.white]));
export async function orientationFixtures(){
 const initial=await solved(), seen=new Set([JSON.stringify(pattern(initial))]),queue=[{state:initial,scramble:''}];
 for(let i=0;i<queue.length;i++)for(const front of ['F','R','B','L']){
  const alg=mapAlg(sune,front),state=await apply(queue[i].state,alg),key=JSON.stringify(pattern(state));
  if(!seen.has(key)){seen.add(key);queue.push({state,scramble:[queue[i].scramble,alg].filter(Boolean).join(' ')});}
 }
 return queue;
}
