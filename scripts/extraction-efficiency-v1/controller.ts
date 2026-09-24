import {prepare} from '../f2l-efficiency-v1/preparation-sequential';
import {request as alignmentRequest} from '../alignment-efficiency-v1/policy';
import {decide as extraction} from './sequential';
import {routines as extractions} from './policy';
import {pieces,colors,mapAlg} from '../../src/lib/cube';
import {routines} from '../f2l-efficiency-v1/policy';
import type {CubeData,JevRequest,JevResponse} from '../../src/lib/types';
export type Ask=(r:JevRequest)=>Promise<JevResponse>;
const sides=['F','R','B','L'];
const corners:Record<string,string>={FR:'DRF',BR:'DBR',BL:'DLB',FL:'DFL'};
const cornerSlots=['UFR','URB','UBL','ULF','DRF','DBR','DLB','DFL'];
const edgeSlots=['UF','UR','UB','UL','DF','DR','DB','DL','FR','BR','BL','FL'];
export function view(state:CubeData,target:string,front:string){
 const all=pieces(state),c=all.find(p=>p.piece===corners[target])!,e=all.find(p=>p.piece===target)!;
 const local=(f:string)=>{const i=sides.indexOf(f);return i<0?f:sides[(i-sides.indexOf(front)+4)%4];};
 const position=(p:string,slots:string[])=>slots.find(s=>[...s].sort().join('')===[...p].map(local).sort().join(''))!;
 const dir=(p:typeof c,color:string)=>p.stickers[color]?local(p.stickers[color]):'absent';
 const right=sides[(sides.indexOf(front)+1)%4];
 return {corner:{position:position(c.position,cornerSlots),downColorDirection:dir(c,'yellow'),frontColorDirection:dir(c,colors[front]),rightColorDirection:dir(c,colors[right])},edge:{position:position(e.position,edgeSlots),frontColorDirection:dir(e,colors[front]),rightColorDirection:dir(e,colors[right])}};
}
const turnCriteria={U:'Upper edges UF→UL→UB→UR→UF; upper corners UFR→ULF→UBL→URB→UFR.',"U'":'Upper edges UF→UR→UB→UL→UF; upper corners UFR→URB→UBL→ULF→UFR.',U2:'Upper edges UF/UB and UR/UL exchange; upper corners UFR/UBL and URB/ULF exchange.',reconsider:'No U rotation is needed or these positions cannot be related by U.'};
async function inner(state:CubeData,ask:Ask,previousTarget:string|null=null,recentActions:string[]=[]){
 const all=pieces(state);const pairs=Object.entries(corners).map(([id,corner])=>({id,corner:all.find(p=>p.piece===corner),edge:all.find(p=>p.piece===id)}));
 const targetAnswer=await ask({model:'jev-1.13.0',state:{pairs,previousTarget,recentActions:recentActions.slice(-2)},questions:{target:{type:'choice',instructions:'Choose an unfinished corner/edge pair to solve together, preserving the cross and completed pairs. Continue previousTarget until both pieces are solved. Otherwise prefer pieces already in the upper layer. Each ID is a home slot, not a current location. Choose done only when every listed corner and edge is solved.',criteria:{...Object.fromEntries(Object.keys(corners).map(k=>[k,`Work on pair ${k}, if its corner or edge is not solved.`])),done:'All four pairs have both corner.solved=true and edge.solved=true.'}}}});
 const target=targetAnswer.answers.target.choice;if(target==='done')return {target,alg:'',action:'done'};
 const selected=pairs.find(p=>p.id===target)!;
 const ref=await ask({model:'jev-1.13.0',state:{homeSlot:target,corner: selected.corner,edge:selected.edge},questions:{front:{type:'choice',instructions:'Choose a notation reference that puts this pair HOME at local front-right. This changes notation only, not the cube. Use homeSlot, not its current position.',criteria:{F:'Home FR becomes local front-right.',R:'Home BR becomes local front-right.',B:'Home BL becomes local front-right.',L:'Home FL becomes local front-right.'}}}});
 const front=ref.answers.front.choice,pair=view(state,target,front);
 const prep=await ask({model:'jev-1.13.0',state:pair,questions:{preparation:{type:'choice',instructions:'Choose how to prepare the selected pair for its learned F2L reference. First free any target piece trapped in a different bottom/middle slot. Preserve completed slots. With both targets in the upper layer or their own slot, use the canonical reference positions in these options.',criteria:{'extract-corner':'Corner is in a bottom position other than DRF. Lift it from its CURRENT slot.','extract-edge':'Corner is upper or DRF, but edge is in a middle position other than FR. Lift the edge from its CURRENT slot.','align-corner':'Corner is upper but not UFR, and edge is upper or FR. Rotate U so the corner reaches UFR.','align-edge':'Corner is DRF and edge is upper but not UF. Rotate U so the edge reaches UF.',routine:'Corner is UFR and edge is upper or FR; OR corner is DRF and edge is UF or FR. The pair is prepared for a learned routine.',reconsider:'None of these reference domains applies.'}}}});
 const preparation=prep.answers.preparation.choice;
 if(preparation==='routine'){
  const a=await ask({model:'jev-1.13.0',state:{...pair,frame:'Local front F, right R, down D. Target pair belongs at DRF corner and FR edge.'},questions:{routine:{type:'choice',instructions:'Choose a learned F2L routine whose reference illustration matches BOTH observed pieces: their current positions and sticker directions. Read current position, not the destination slot. These routines solve this corner and edge together, preserving the cross and other three pairs. Do not simulate candidate outcomes. If no reference matches choose reconsider.',criteria:{...Object.fromEntries(routines.map(r=>[r.id,r.description])),reconsider:'No listed illustration matches both pieces.'}}}});
  const action=a.answers.routine.choice;return {target,front,preparation,action,alg:mapAlg(routines.find(r=>r.id===action)?.alg??'',front)};
 }
 if(preparation==='align-corner'||preparation==='align-edge'){
  const source=preparation==='align-corner'?pair.corner.position:pair.edge.position,destination=preparation==='align-corner'?'UFR':'UF';
  const a=await ask({model:'jev-1.13.0',state:{currentPosition:source,requiredPosition:destination},questions:{turn:{type:'choice',instructions:'Choose the U turn carrying currentPosition to requiredPosition using the generic position cycles. Choose one rotation, not a routine.',criteria:turnCriteria}}});const action=a.answers.turn.choice;return {target,front,preparation,action,alg:action==='reconsider'?'':action};
 }
 if(preparation==='extract-corner'||preparation==='extract-edge'){
  const action=await extraction(pair.corner.position,pair.edge.position,preparation==='extract-corner'?'corner':'edge',ask);
  const routine=extractions.find(r=>r.id===action);
  return {target,front,preparation,action:'extract@'+action,alg:mapAlg(routine?.alg??'',front)};
 }

 return {target,front,preparation,action:'reconsider',alg:''};
}

export async function decide(state:CubeData,ask:Ask,previousTarget:string|null=null,recentActions:string[]=[]){
 return inner(state,r=>{
  if(r.questions.preparation)return prepare(r.state as ReturnType<typeof view>,ask);
  if(r.questions.turn){const s=r.state as {currentPosition:string;requiredPosition:string};return ask(alignmentRequest(s.currentPosition,s.requiredPosition,'relations'));}
  return ask(r);
 },previousTarget,recentActions);
}
