import { colors, names, pieces } from '../lib/cube';
import { skills } from '../lib/skills';
import type { CubeData, JevRequest } from '../lib/types';
export type PreconditionVariant = 'rule' | 'criteria' | 'check-then-choice';
export const liftRequirements: Record<string, string[]> = {
  'lift-bottom': ['UF'], 'lift-middle-right': ['UR'], 'lift-middle-left': ['UL'],
  'stage-bottom-edge': ['UF'], 'flip-top-edge': ['UR'], 'flip-top-edge-left': ['UL'],
};
// The routine and reference are supplied by earlier JEV choices. This function never selects them.
export function preconditionObservation(state: CubeData, targetId: string, front: string, routine: string) {
  const ring = ['F','R','B','L'];
  if (!ring.includes(front)) throw new Error('Invalid reference');
  const local=(f:string)=>ring.includes(f)?ring[(ring.indexOf(f)-ring.indexOf(front)+4)%4]:f;
  const p=pieces(state).find(p=>p.kind==='edge'&&p.piece===targetId);
  if(!p) throw new Error('Unknown target');
  const position=names.EDGES.find(s=>[...s].sort().join('')===[...p.position].map(local).sort().join(''))!;
  const stickers=Object.fromEntries(Object.entries(p.stickers).map(([c,f])=>[c,local(f)]));
  const centers=Object.fromEntries(Object.entries(colors).map(([f,c])=>[local(f),c]));
  const side=Object.entries(stickers).find(([c])=>c!=='yellow');
  if(!side) throw new Error('Expected yellow edge');
  const slots=Object.fromEntries(['UF','UR','UB','UL'].map(slot=>{
    const edge=pieces(state).find(e=>e.kind==='edge'&&[...e.position].map(local).sort().join('')===[...slot].sort().join(''))!;
    return [slot,edge.stickers.yellow==='U'];
  }));
  return {
    target:{position,layer:position.includes('U')?'top':position.includes('D')?'bottom':'middle',yellowDirection:stickers.yellow,sideColor:side[0],sideDirection:side[1],adjacentCenter:centers[side[1]],sideMatchesCenter:side[0]===centers[side[1]]},
    centers, yellowUpPetals:slots,
    selectedRoutine:{id:routine,sequence:skills.find(s=>s.id===routine)?.alg,requiredFreeSlots:liftRequirements[routine]??[]},
    frame:`Local reference front=${front}; U and D stay fixed. Occupied means a yellow-up petal, not just any edge.`,
  };
}
export type PreconditionObservation=ReturnType<typeof preconditionObservation>;
export type PreconditionFamily='transfer'|'landing';
const rules={
  transfer:'The target is a yellow-up petal. Before transferring it with the selected half-turn, its side sticker must match the adjacent side center. If sideMatchesCenter is true choose insert. Otherwise choose align. Decide the next intention only; do not select a turn.',
  landing:'The model already selected a lift from the fixed routine reference. Inspect only selectedRoutine.requiredFreeSlots. If none of those slots contains a yellow-up petal, choose execute. Otherwise, if target.layer is bottom or middle choose clear. If a required slot is occupied and target.layer is top choose lower, because rotating U would move this target too. Other occupied slots do not matter.',
};
const plain={transfer:{insert:'Execute the selected transfer',align:'Align the target before transfer'},landing:{execute:'Execute the selected lift',clear:'Clear a landing slot with a top setup first',lower:'Lower the top target before making space'}};
export function preconditionRequest(observation:PreconditionObservation,family:PreconditionFamily,variant:PreconditionVariant,check?:string):JevRequest {
  const criteria=family==='transfer'
    ? {insert:'sideMatchesCenter=true: insert',align:'sideMatchesCenter=false: align'}
    : {execute:'All listed requiredFreeSlots have false occupancy: execute',clear:'Any listed requiredFreeSlot has true occupancy AND target.layer is bottom or middle: clear',lower:'Any listed requiredFreeSlot has true occupancy AND target.layer is top: lower'};
  if(variant==='check-then-choice'&&check===undefined) return {model:'jev-1.13.0',state:observation,questions:{ready:{type:'choice',instructions:family==='transfer'?'Read target.sideMatchesCenter. Is it true?':'Are ALL slots in selectedRoutine.requiredFreeSlots false in yellowUpPetals? Ignore slots not listed.',criteria:{yes:'Condition holds',no:'Condition does not hold'}}}};
  return {model:'jev-1.13.0',state:check===undefined?observation:{observation,previousModelReady:check},questions:{decision:{type:'choice',instructions:check===undefined?rules[family]:family==='transfer'?'Use previousModelReady unchanged: yes means insert, no means align.':'Use previousModelReady unchanged: yes means execute. For no, choose lower when observation.target.layer is top, otherwise clear.',criteria:variant==='criteria'?criteria:plain[family]}}};
}
