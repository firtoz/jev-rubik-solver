import {writeFileSync} from 'node:fs';
import {solved,apply,facts,mapAlg} from '../../src/lib/cube';
import {observe} from '../efficiency-v1/corner-policy';
const alg="R' U L' U2 R U' L R' U L' U2 R U' L",source='https://www.cubeskills.com/uploads/pdf/tutorials/4-look-last-layer.pdf';
const perms=(a:number[]):number[][]=>a.length?a.flatMap((x,i)=>perms(a.filter((_,j)=>i!==j)).map(p=>[x,...p])):[[]];
const count=(s:any)=>Object.values(observe(s).sides).filter((v:any)=>v.cornerStickers[0].color===v.cornerStickers[1].color).length;
const base=await solved(),rows=[];
for(const p of perms([0,1,2,3])){
 const s=structuredClone(base);s.CORNERS.pieces.splice(0,4,...p);
 if(p.reduce((n,x,i)=>n+p.slice(i+1).filter(y=>x>y).length,0)%2)[s.EDGES.pieces[0],s.EDGES.pieces[1]]=[s.EDGES.pieces[1],s.EDGES.pieces[0]];
 if(count(s)!==0)continue;
 for(const front of ['F','R','B','L']){
  const after=await apply(s,mapAlg(alg,front)),f=facts(after);
  if(count(after)!==4||!f.middle||!f.topCross||!f.topOriented)throw Error('Unexpected effect');
  if(!(await Promise.all(['','U',"U'",'U2'].map(async a=>facts(await apply(after,a)).cornersPlaced))).some(Boolean))throw Error('Not alignable');
  rows.push({corners:p,front,matchingPairsAfter:4,turns:14});
 }
}
if(rows.length!==16)throw Error('Wrong domain size');
writeFileSync('experiments/diagonal-corners-v1/mechanics.json',JSON.stringify({source,alg,rows},null,2));console.log({checked:rows.length,casePermutations:4,turns:14,preservation:true});
