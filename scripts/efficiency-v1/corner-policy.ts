import {colors, mapAlg, pieces} from '../../src/lib/cube';
import type {CubeData,JevRequest} from '../../src/lib/types';
const ring=['F','R','B','L'];
const t="R U R' U' R' F R2 U' R' U' R U R' F'";
export const actions:Record<string,string>={U:'U',"U'":"U'",U2:'U2',...Object.fromEntries(ring.map(f=>['T@'+f,mapAlg(t,f)])),done:''};
export function observe(state:CubeData){
 const corners=pieces(state).filter(p=>p.kind==='corner'&&p.position.includes('U'));
 return {sides:Object.fromEntries(ring.map(f=>[f,{center:colors[f],cornerStickers:corners.filter(p=>p.position.includes(f)).map(p=>({position:p.position,color:Object.entries(p.stickers).find(([,d])=>d===f)![0]}))}]))};
}
const effects:Record<string,string>={
 U:'Turn upper layer: side rows travel F to L to B to R to F.',
 "U'":'Turn upper layer: side rows travel F to R to B to L to F.',
 U2:'Turn upper layer: F/B swap and R/L swap.',
 ...Object.fromEntries(ring.map((f,i)=>['T@'+f,`T permutation with local front ${f}, local left ${ring[(i+3)%4]}, local right ${ring[(i+1)%4]}. Swaps the two upper corners on local right and two upper edges. Restores all lower pieces and sticker orientations. 14 face turns.`])),
 done:'All four upper corners already match their side centers. No move.'
};
export type Variant='structured'|'player'|'effects';
const teaching='A matching pair means the two corner stickers on ONE side share a color, even if that color differs from the center. Four matching pairs mean only upper-layer alignment remains: move the rows to their matching centers. With one pair, hold it on local LEFT and use T. With no pairs, any T creates a pair. Do not undo a completed permutation merely because some upper edges remain unsolved.';
export function request(state:CubeData,variant:Variant,recentActions:string[]):JevRequest{
 const observation=observe(state);
 return {model:'jev-1.13.0',state:{observation:variant==='player'?Object.entries(observation.sides).map(([face,s])=>`${face} side: center ${s.center}; upper corner stickers ${s.cornerStickers.map(x=>x.color).join(' and ')}.`):observation,recentActions:recentActions.slice(-2)},questions:{action:{type:'choice',instructions:{task:'Place the four already oriented upper corners against their matching side centers. Bottom two layers and white orientation must finish unchanged. Upper edges may move. Select one next action.',...(variant==='effects'?{}:{teaching})},criteria:effects}}};
}
