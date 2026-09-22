import {apply,solved,facts,pieces,hash,mapAlg} from '../../src/lib/cube';
import {skills} from '../../src/lib/skills';
// Offline labels and generation are never imported by either live policy.
export function label(state:any){const f=facts(state);const missing=pieces(state).filter(p=>p.kind==='edge'&&'yellow'in p.stickers&&p.stickers.yellow!=='U'&&!p.solved).length;return !f.cross?missing?'daisy':'cross':!f.firstLayer?'first-layer':!f.middle?'middle-layer':!f.topCross?'top-cross':!f.topOriented?'top-orientation':!f.cornersPlaced?'top-corners':!f.solved?'top-edges':'solved';}
export async function fixtures(excluded:string[]=[],offset=0){
 const seen=new Set(excluded),rows:any[]=[],counts:Record<string,number>={};
 const base=await solved();
 const algs=['F2 R2 B2 L2','F2 R2','R U F',...skills.map(s=>s.alg)];
 for(let n=offset;n<offset+30000&&rows.length<32;n++){
  const alg=algs[n%algs.length],front=['F','R','B','L'][Math.floor(n/algs.length)%4];
  const pre=['','U',"U'",'U2'][Math.floor(n/(algs.length*4))%4],post=['','U',"U'",'U2'][Math.floor(n/(algs.length*16))%4];
  const repeat=1+Math.floor(n/(algs.length*64))%3;
  const scramble=[pre,...Array(repeat).fill(mapAlg(alg,front)),post].filter(Boolean).join(' ');
  const state=await apply(base,scramble),expected=label(state),h=hash(state);
  if(expected==='solved'||(counts[expected]??0)>=4||seen.has(h))continue;
  seen.add(h);counts[expected]=(counts[expected]??0)+1;rows.push({id:`case-${rows.length+1}`,scramble,state,stateHash:h,expected});
 }
 if(rows.length!==32)throw new Error('Insufficient fixtures '+JSON.stringify(counts));return rows;
}
