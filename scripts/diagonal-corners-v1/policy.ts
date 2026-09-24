import {observe,actions as previousActions} from '../efficiency-v1/corner-policy';
import type {CubeData,JevRequest,JevResponse} from '../../src/lib/types';
import {mapAlg} from '../../src/lib/cube';
export const actions:Record<string,string>={...previousActions,...Object.fromEntries(['F','R','B','L'].map(f=>['diagonal@'+f,mapAlg("R' U L' U2 R U' L R' U L' U2 R U' L",f)]))};
export type Variant='words';
const ring=['F','R','B','L'];
const names:Record<string,string>={F:'front',R:'right',B:'back',L:'left'};
export async function decide(state:CubeData,variant:Variant,history:string[],ask:(r:JevRequest)=>Promise<JevResponse>){
 const observation=observe(state);
 const pairColors=Object.fromEntries(ring.map(f=>{const c=observation.sides[f].cornerStickers;return [f,c[0].color===c[1].color?c[0].color:'mixed'];}));
 const pairCount=Object.values(pairColors).filter(x=>x!=='mixed').length;
 const result=await ask({model:'jev-1.13.0',state:{pairColors,pairCount,centers:Object.fromEntries(ring.map(f=>[f,observation.sides[f].center])),recentActions:history.slice(-2)},questions:{
  intention:{type:'choice',instructions:'pairCount counts sides with two equal upper-corner sticker colors. Choose diagonal when pairCount=0, adjacent when pairCount=1. With pairCount=4, compare each pair color to its own center: all match means done, otherwise align. Upper edges do not determine this choice.',criteria:{diagonal:'pairCount=0. The fixed 14-turn diagonal routine creates four matching pairs; then align if needed.',permute:'pairCount=1. A 14-turn T permutation creates four matching pairs; then align if needed.',align:'pairCount=4 and at least one pair color differs from its own center.',done:'pairCount=4 and every pair color matches its own center.'}},
  reference:{type:'choice',instructions:'Independently assume a T permutation is needed. Choose the front that places the matching pair on local LEFT. If no pair exists or all four exist, any reference is acceptable. Do not read sibling answers.',criteria:Object.fromEntries(ring.map((f,i)=>[f,`Local front ${f}, local left ${ring[(i+3)%4]}. Fits if pairColors.${ring[(i+3)%4]} is not mixed, or no pair exists.`]))},
  destination:{type:'choice',instructions:'Independently find where the pair currently on F belongs. Compare pairColors.F with each center. Return the face whose center has that color, or none if pairColors.F is mixed. Do not choose a turn and do not read sibling answers.',criteria:{F:'The center on F matches pairColors.F.',R:'The center on R matches pairColors.F.',B:'The center on B matches pairColors.F.',L:'The center on L matches pairColors.F.',none:'The pair on F is mixed.'}}
 }});
 const a=result.answers;
 // Branch only on model answers. No tactical verification or repair.
 if(a.intention.choice==='done')return 'done';
 if(a.intention.choice==='diagonal')return 'diagonal@'+a.reference.choice;
 if(a.intention.choice==='permute')return 'T@'+a.reference.choice;
 const destination=a.destination.choice;
 const turn=await ask({model:'jev-1.13.0',state:{currentPosition:variant==='words'?'front':'F',requiredPosition:variant==='words'?(names[destination]??destination):destination},questions:{turn:{type:'choice',instructions:'Choose the upper-face rotation that carries currentPosition to requiredPosition. Source and destination are an ordered pair. Choose leave if they are the same or requiredPosition is none.',criteria:variant==='words'?{
 U:'Quarter turn: front to left; left to back; back to right; right to front.',
 "U'":'Quarter turn: front to right; right to back; back to left; left to front.',
 U2:'Half turn: front to back, back to front, left to right, or right to left.',leave:'No rotation: same source/destination or destination none.'
 }:{U:'F to L; L to B; B to R; R to F.',"U'":'F to R; R to B; B to L; L to F.',U2:'F to B; B to F; R to L; L to R.',leave:'Same source/destination, or destination none.'}}}});
 return turn.answers.turn.choice==='leave'?'done':turn.answers.turn.choice;
}
