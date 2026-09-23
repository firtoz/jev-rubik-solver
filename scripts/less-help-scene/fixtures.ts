import {apply,solved,pieces,facts,hash,colors} from '../../src/lib/cube';
import {actions,scene} from './policy';
import type {CubeData} from '../../src/lib/types';
export async function label(state:CubeData){
 const result:Record<string,any>={};
 for(const p of pieces(state).filter(p=>p.kind==='edge'&&!/[UD]/.test(p.piece))){
  const sideMatch=Object.entries(p.stickers).some(([c,f])=>f!=='U'&&colors[f]===c);
  const intention=p.solved?'done':!p.position.includes('U')?'extract':sideMatch?'insert':'align';const accepted=[];
  for(const [id,alg] of Object.entries(actions)){
   if(intention==='done'&&id!=='leave'||intention==='align'&&!['U',"U'",'U2'].includes(id)||['insert','extract'].includes(intention)&&!id.includes('@'))continue;
   const after=await apply(state,alg),q=pieces(after).find(q=>q.piece===p.piece)!;
   const preserves=pieces(state).filter(q=>q.kind==='edge'&&!/[UD]/.test(q.piece)&&q.solved).every(q=>pieces(after).find(a=>a.piece===q.piece)!.solved);
   if(facts(after).firstLayer&&preserves&&(intention==='done'||intention==='insert'?q.solved:intention==='extract'?q.position.includes('U'):q.position.includes('U')&&Object.entries(q.stickers).some(([c,f])=>f!=='U'&&colors[f]===c)))accepted.push(id);
  }
  result[p.piece]={intention,accepted,eligible:!p.solved||facts(state).middle};
 }
 return result;
}
export async function generate(count:number,seed:number,excludedStates:string[]=[],excludedScenes:string[]=[]){
 const seen=new Set(excludedStates),views=new Set(excludedScenes),out:any[]=[];
 const random=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return(seed>>>0)/4294967296;};
 const routines=Object.values(actions).filter(a=>a.split(' ').length>2);
 for(let attempt=0;out.length<count;attempt++){
  if(attempt>10000)throw Error('Fixture space exhausted');
  // Include four all-middle-solved scenes for no-op coverage, with different legal last layers.
  let scramble='';const n=out.length<4?0:1+Math.floor(random()*6);
  for(let i=0;i<n;i++)scramble+=' '+routines[Math.floor(random()*routines.length)]+' '+['U',"U'",'U2'][Math.floor(random()*3)];
  for(let i=0,k=1+Math.floor(random()*4);i<k;i++)scramble+=" R U R' U R U2 R' "+['U',"U'",'U2'][Math.floor(random()*3)];
  scramble=scramble.trim();const state=await apply(await solved(),scramble),view=JSON.stringify(scene(state));
  if(seen.has(hash(state))||views.has(view))continue;if(!facts(state).firstLayer)throw Error('Fixture damages bottom');
  seen.add(hash(state));views.add(view);out.push({id:'case-'+(out.length+1),scramble,state,labels:await label(state)});
 }
 return out;
}
