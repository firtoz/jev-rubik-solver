import {decide as selectedDecision,type Ask} from '../less-help-roles/policy';
import {pieces,colors} from '../../src/lib/cube';
import type {CubeData,JevRequest} from '../../src/lib/types';
export {actions} from '../less-help-roles/policy';
export function context(state:CubeData){return pieces(state).filter(p=>p.kind==='edge'&&!/[UD]/.test(p.piece)).map(p=>({id:p.piece,position:p.position,stickers:p.stickers}));}
export function protectedSlots(state:CubeData){return pieces(state).filter(p=>p.kind==='edge'&&!/[UD]/.test(p.piece)&&p.solved).map(p=>p.position).sort();}
export async function decide(state:CubeData,target:string,ask:Ask){return selectedDecision(state,target,'effects',request=>{
 const copy=structuredClone(request);
 if(copy.questions.intention)copy.state={...copy.state as object,protectedMiddleSlots:protectedSlots(state),preservation:'Other correctly solved middle edges should finish unchanged.'};
 return ask(copy);
});}
export function targetRequest(state:CubeData,previousTarget:string|null,recentActions:string[]):JevRequest{
 const edges=context(state);
 return {model:'jev-1.13.0',state:{centers:colors,edges,previousTarget,recentActions},questions:{target:{type:'choice',instructions:'Choose one edge to work on so that all four middle edges eventually match both their adjacent centers. A correctly positioned edge also needs correct sticker orientation. Prefer continuing work on the previous edge until it matches both centers. Use current observations rather than its identifier, which names its permanent home. All four edges remain offered, including already completed ones.',criteria:Object.fromEntries(edges.map(p=>[p.id,`Work on the ${Object.keys(p.stickers).join('/')} edge.`]))}}};
}
