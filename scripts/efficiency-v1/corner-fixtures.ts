// Evaluator-only labelled states. Never imported by the solving policy.
import {writeFileSync} from 'node:fs';
import {apply,facts,solved} from '../../src/lib/cube';
import {actions,observe} from './corner-policy';
function permutations(a:number[]):number[][]{return a.length?a.flatMap((n,i)=>permutations(a.filter((_,j)=>i!==j)).map(p=>[n,...p])):[[]];}
const fixtures=[];
for(const [i,p] of permutations([0,1,2,3]).entries()){
 const s=await solved();s.CORNERS.pieces.splice(0,4,...p);
 const odd=p.reduce((n,x,j)=>n+p.slice(j+1).filter(y=>x>y).length,0)%2;
 if(odd)[s.EDGES.pieces[0],s.EDGES.pieces[1]]=[s.EDGES.pieces[1],s.EDGES.pieces[0]];
 const pairs=Object.values(observe(s).sides).filter(x=>x.cornerStickers[0].color===x.cornerStickers[1].color).length;
 if(![0,1,4].includes(pairs))throw Error('Unexpected corner pattern');
 // Verify physical preservation for every action, independently of model selection.
 for(const alg of Object.values(actions)){const f=facts(await apply(s,alg));if(!f.middle||!f.topCross||!f.topOriented)throw Error('Routine breaks prerequisites');}
 fixtures.push({id:`corners-${i}`,split:i%2?'validation':'development',state:s,labels:{pairs,alreadyPlaced:facts(s).cornersPlaced,turnCeiling:pairs===0?29:pairs===1?15:1}});
}
writeFileSync('experiments/efficiency-v1/corner-fixtures.json',JSON.stringify(fixtures,null,2));
console.log({fixtures:fixtures.length,development:fixtures.filter(x=>x.split==='development').map(x=>x.labels.pairs),validation:fixtures.filter(x=>x.split==='validation').map(x=>x.labels.pairs)});
