import {writeFileSync} from 'node:fs';
import {solved,apply,pieces,mapAlg,facts} from '../../src/lib/cube';
const base=await solved(),rows=[];
for(const front of ['F','R','B','L'])for(const turn of ['U',"U'"]){
 const alg=mapAlg('R '+turn+" R'",front),after=await apply(base,alg),ps=pieces(after);
 const corner=ps.find(p=>p.kind==='corner'&&!p.piece.includes('U')&&p.position.includes('U'))!;
 const edge=ps.find(p=>p.kind==='edge'&&!p.piece.includes('U')&&p.position.includes('U'))!;
 const cornerIn=ps.find(p=>p.kind==='corner'&&p.position===corner.piece)!;
 const edgeIn=ps.find(p=>p.kind==='edge'&&p.position===edge.piece)!;
 if(!facts(after).cross||ps.some(p=>!p.piece.includes('U')&&p.piece!==corner.piece&&p.piece!==edge.piece&&!p.solved))throw Error('Preservation');
 rows.push({id:front+'-'+(turn==='U'?'forward':'reverse'),alg,cornerSlot:corner.piece,edgeSlot:edge.piece,cornerLands:corner.position,edgeLands:edge.position,trapsCornerFrom:cornerIn.piece,trapsEdgeFrom:edgeIn.piece});
}
writeFileSync('experiments/extraction-efficiency-v1/catalog.json',JSON.stringify({note:'Static mechanics of fixed R U R-prime and R U-prime R-prime routines in four yaw frames; no live state used.',rows},null,2));console.log(rows);
