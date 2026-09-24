import {observe,actions} from './corner-policy';
import type {CubeData,JevRequest,JevResponse} from '../../src/lib/types';
export {actions};
export type Variant='recognition'|'measured';
const ring=['F','R','B','L'];
const options=Object.fromEntries(['green','red','blue','orange','mixed'].map(c=>[c,c==='mixed'?'The two corner sticker colors differ.':`Both corner stickers are ${c}.`]));
export async function decide(state:CubeData,variant:Variant,history:string[],ask:(r:JevRequest)=>Promise<JevResponse>){
 const observation=observe(state);let pairs:Record<string,string>;
 if(variant==='recognition'){
  const result=await ask({model:'jev-1.13.0',state:{sides:observation.sides},questions:Object.fromEntries(ring.map(f=>['pair_'+f,{type:'choice',instructions:`Read only sides.${f}.cornerStickers. If their two colors match, return that shared color. Otherwise return mixed. Ignore the center color.`,criteria:options}]))});
  pairs=Object.fromEntries(ring.map(f=>[f,result.answers['pair_'+f].choice]));
 }else pairs=Object.fromEntries(ring.map(f=>{const c=observation.sides[f].cornerStickers;return [f,c[0].color===c[1].color?c[0].color:'mixed'];}));
 // Count observed/model-reported categories without repairing them.
 const pairCount=Object.values(pairs).filter(x=>x!=='mixed').length;
 const criteria:Record<string,string>={
  done:'All four pair colors already equal their own side centers. Corners are solved.',
  U:'Four matching pairs exist but need alignment. Move pair colors F→L, L→B, B→R, R→F. Choose if every moved pair will match its destination center.',
  "U'":'Four matching pairs exist but need alignment. Move pair colors F→R, R→B, B→L, L→F. Choose if every moved pair will match its destination center.',
  U2:'Four matching pairs exist but need alignment. Swap pair colors F/B and R/L. Choose if every moved pair will match its destination center.',
  ...Object.fromEntries(ring.map((f,i)=>['T@'+f,`Choose if pairCount=0, OR pairCount=1 and pairColors.${ring[(i+3)%4]} is not mixed. Hold the existing matching pair on local LEFT (${ring[(i+3)%4]}); T swaps the opposite right corners. With no pair, this creates one. Front ${f}. Do not use when pairCount=4.`]))
 };
 const result=await ask({model:'jev-1.13.0',state:{pairColors:pairs,pairCount,centers:Object.fromEntries(ring.map(f=>[f,observation.sides[f].center])),recentActions:history.slice(-2)},questions:{action:{type:'choice',instructions:'Place all upper corners against their matching side centers. pairColors gives the shared color of each side corner pair, or mixed. Matching pair does not mean matched to its center. Apply the general pattern rules in the options. Upper edges can move; all routines restore lower layers and orientation.',criteria}}});
 return result.answers.action.choice;
}
