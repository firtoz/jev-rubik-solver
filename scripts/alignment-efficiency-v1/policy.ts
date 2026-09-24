import type {JevRequest} from '../../src/lib/types';
export type Variant='baseline'|'relations'|'words';
const cycles=[['UF','UL','UB','UR'],['UFR','ULF','UBL','URB']];
const words:Record<string,string>={UF:'top front edge',UL:'top left edge',UB:'top back edge',UR:'top right edge',UFR:'top front-right corner',ULF:'top front-left corner',UBL:'top back-left corner',URB:'top back-right corner'};
const baseline={U:'Upper edges UF→UL→UB→UR→UF; upper corners UFR→ULF→UBL→URB→UFR.',"U'":'Upper edges UF→UR→UB→UL→UF; upper corners UFR→URB→UBL→ULF→UFR.',U2:'Upper edges UF/UB and UR/UL exchange; upper corners UFR/UBL and URB/ULF exchange.',reconsider:'No U rotation is needed or these positions cannot be related by U.'};
export function request(source:string,destination:string,variant:Variant):JevRequest{
 const name=(p:string)=>variant==='words'?words[p]:p;
 // Static teaching material, identical for every input; never inspect source/destination to select an action.
 const criteria=variant==='baseline'?baseline:{...Object.fromEntries([['U',1],["U'",3],['U2',2]].map(([turn,offset])=>[turn,cycles.flatMap(c=>c.map((p,i)=>`Moves ${name(p)} to ${name(c[(i+Number(offset))%4])}.`)).join(' ')])),reconsider:'The current and required positions are identical, or no listed move connects them.'};
 return {model:'jev-1.13.0',state:{currentPosition:name(source),requiredPosition:name(destination)},questions:{turn:{type:'choice',instructions:variant==='baseline'?'Choose the U turn carrying currentPosition to requiredPosition using the generic position cycles. Choose one rotation, not a routine.':'Choose one turn whose teaching lists the exact movement from currentPosition to requiredPosition. Match both endpoints. Each listed movement describes a single application of that turn. Do not take several quarter-turns when U2 reaches the destination directly.',criteria}}};
}
