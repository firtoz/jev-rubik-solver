// Offline build of fixed motor-skill metadata. No current test cube enters this build.
import {writeFileSync} from 'node:fs';
import {apply,solved,pieces} from '../../src/lib/cube';
import {skills} from '../../src/lib/skills';
const starts:Record<string,[string,string]>={
 'lift-bottom':['DF','D'],'lift-middle-right':['FR','F'],'lift-middle-left':['FL','F'],
 'stage-bottom-edge':['DF','F'],'flip-top-edge':['UF','F'],'flip-top-edge-left':['UF','F'],'lower-top-edge':['UF','F'],
 'cross-lift-right':['FR','F'],'cross-lift-left':['FL','F'],'cross-flip-top-right':['UF','F'],'cross-flip-top-left':['UF','F'],'cross-flip-bottom':['DF','F'],
};
const reference=[];
for(const [id,[position,yellowDirection]] of Object.entries(starts)){
 const skill=skills.find(s=>s.id===id)!;
 const after=pieces(await apply(await solved(),skill.alg));
 reference.push({id,sequence:skill.alg,position,yellowDirection,purpose:skill.purpose,
  requiredFreeSlots:after.filter(p=>p.kind==='edge'&&p.piece.includes('U')&&p.stickers.white!=='U').map(p=>p.piece),
  affectedBottomSlots:after.filter(p=>p.kind==='edge'&&p.piece.includes('D')&&!p.solved).map(p=>p.piece),
 });
}
writeFileSync('scripts/brain-early/routine-reference.json',JSON.stringify(reference,null,2));
