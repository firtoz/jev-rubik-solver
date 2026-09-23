import {apply,solved,pieces,facts,hash} from '../../src/lib/cube';
import {actions} from './policy';
export async function fixtures(){
 const seen=new Set<string>();const out:any[]=[];let seed=734973;
 const rand=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)/4294967296};
 const routines=Object.values(actions).filter(a=>a.split(' ').length>2);
 for(const split of ['development','validation']){
  const counts:Record<string,number>={done:0,flipped:0,trapped:0,align:0,insert:0};
  for(let attempt=0;Object.values(counts).some(n=>n<4);attempt++){
   if(attempt>20000)throw Error('Fixture generation exhausted');
   let scramble='';for(let i=0,n=1+Math.floor(rand()*5);i<n;i++)scramble+=' '+routines[Math.floor(rand()*routines.length)]+' '+['U',"U'",'U2'][Math.floor(rand()*3)];
   scramble=scramble.trim();const state=await apply(await solved(),scramble);if(seen.has(hash(state)))continue;
   if(!facts(state).firstLayer)throw Error('Invalid mechanics');
   for(const p of pieces(state).filter(p=>p.kind==='edge'&&!/[UD]/.test(p.piece))){
    const matches=Object.entries(p.stickers).some(([c,f])=>!/[UD]/.test(f)&&({F:'green',R:'red',B:'blue',L:'orange'} as any)[f]===c);
    const family=p.solved?'done':!p.position.includes('U')?(p.position===p.piece?'flipped':'trapped'):matches?'insert':'align';
    if(counts[family]>=4)continue;
    const expected=family==='flipped'||family==='trapped'?'extract':family;
    const accepted:string[]=[];
    for(const [id,alg] of Object.entries(actions)){
     if(expected==='done'&&id!=='leave'||expected==='align'&&!['U',"U'",'U2'].includes(id)||['insert','extract'].includes(expected)&&!id.includes('@'))continue;
     const after=await apply(state,alg),q=pieces(after).find(x=>x.piece===p.piece)!;
     const aligned=Object.entries(q.stickers).some(([c,f])=>!/[UD]/.test(f)&&({F:'green',R:'red',B:'blue',L:'orange'} as any)[f]===c);
     if(facts(after).firstLayer&&(expected==='done'?q.solved:expected==='insert'?q.solved:expected==='extract'?q.position.includes('U'):q.position.includes('U')&&aligned))accepted.push(id);
    }
    if(!accepted.length)throw Error('No valid labelled action');
    counts[family]++;seen.add(hash(state));out.push({id:`${split}-${out.length+1}`,split,family,scramble,state,target:p.piece,expected,accepted});break;
   }
  }
 }
 return out;
}
