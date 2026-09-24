import type {JevRequest} from '../../src/lib/types';
export type Variant='baseline'|'costs';
export function request(original:JevRequest,variant:Variant){
 const r=structuredClone(original);
 if(variant==='costs'){
  r.questions.routine.instructions=String(r.questions.routine.instructions)+' Among matching, unrejected lifts that preserve protectedBottomSlots, choose the smallest turnCount. A one-turn lift is preferred to a three-turn lift when both protect those slots. Do not protect unsolved bottom slots unnecessarily. Landing occupancy is checked separately after this decision. If no lift remains, choose a matching staging routine.';
  for(const [id,text] of Object.entries(r.questions.routine.criteria)){
   if(id==='reconsider')continue;
   const routine=JSON.parse(text);
   r.questions.routine.criteria[id]=JSON.stringify({...routine,turnCount:routine.sequence.split(/\s+/).length});
  }
 }
 return r;
}
