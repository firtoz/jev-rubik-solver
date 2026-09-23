import {pieces,colors,names} from '../../src/lib/cube';
import {targetRequest,scene,actions} from '../less-help-scene/policy';
import type {CubeData,JevRequest} from '../../src/lib/types';
export {scene,actions};
const ring=['F','R','B','L'];
type Ask=(r:JevRequest)=>Promise<Record<string,string>>;
export function view(state:CubeData,target:string,front:string){
 const offset=ring.indexOf(front);if(offset<0)throw Error('Unknown frame');
 const face=(f:string)=>ring.includes(f)?ring[(ring.indexOf(f)-offset+4)%4]:f;
 const p=pieces(state).find(p=>p.piece===target)!;
 const faces=[...p.position].map(face);const position=names.EDGES.find(n=>[...n].every(f=>faces.includes(f)))!;
 const centers=Object.fromEntries(Object.entries(colors).map(([f,c])=>[face(f),c]));
 const stickers=Object.entries(p.stickers).map(([color,f])=>({color,facing:face(f),adjacentCenter:centers[face(f)]}));
 return {position,layer:position.includes('U')?'upper':'middle',stickers,centers};
}
const effects={leave:'No move. Keep all sticker directions and positions unchanged.',U:'Rotate the upper layer: front to left, left to back, back to right, right to front. Middle and bottom layers unchanged.',"U'":'Rotate the upper layer: front to right, right to back, back to left, left to front. Middle and bottom layers unchanged.',U2:'Rotate the upper layer halfway: front/back swap, left/right swap. Middle and bottom layers unchanged.',right:'Right insertion. Upper-front edge enters front-right slot. Its front sticker stays facing front; its up sticker ends facing right. Previous front-right occupant is ejected to the upper layer. Bottom and other middle slots finish unchanged.',left:'Left insertion. Upper-front edge enters front-left slot. Its front sticker stays facing front; its up sticker ends facing left. Previous front-left occupant is ejected to the upper layer. Bottom and other middle slots finish unchanged.'};
export async function decide(state:CubeData,variant:'geometry'|'relations',ask:Ask,previousTarget:string|null=null,recentActions:string[]=[]){
 const target=(await ask(targetRequest(state,previousTarget,recentActions))).target;
 const p=pieces(state).find(p=>p.piece===target)!;
 const front=(await ask({model:'jev-1.13.0',state:{position:p.position,stickers:p.stickers},questions:{front:{type:'choice',instructions:'Choose a side face from which to inspect the selected edge. Choose a side on which one of its stickers currently lies, so the piece is beside the front of your view. This changes the view, not the cube.',criteria:{F:'Look at the original front',R:'Look at the original right',B:'Look at the original back',L:'Look at the original left'}}}})).front;
 const current=view(state,target,front);
 const observed=variant==='geometry'?current:{layer:current.layer,position:current.position,upwardSticker:current.stickers.find(s=>s.facing==='U')?.color??null,sideStickers:current.stickers.filter(s=>s.facing!=='U').map(s=>({...s,matchesAdjacentCenter:s.color===s.adjacentCenter})),leftCenter:current.centers.L,frontCenter:current.centers.F,rightCenter:current.centers.R,backCenter:current.centers.B};
 const operation=(await ask({model:'jev-1.13.0',state:observed,questions:{operation:{type:'choice',instructions:'Choose the next useful action toward placing this edge in the middle layer with both stickers matching adjacent centers. Judge the action by its general physical effect. Preserve the bottom layer. Preparation is allowed: do not insist on finishing immediately. Leave an already correctly placed and oriented edge unchanged. All directions refer to the current view.',criteria:effects}}})).operation;
 const action=operation==='right'?'middle-right@'+front:operation==='left'?'middle-left@'+front:operation;
 return {target,front,operation,action};
}
