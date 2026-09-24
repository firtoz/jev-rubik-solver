import {writeFileSync} from 'node:fs';
import {routines,groups} from './policy';
import {references} from './reference';
import {apply,solved,inverse,isSolved,hash} from '../../src/lib/cube';
const fixtures:any[]=[],used=new Set<string>();
for(const phase of ['development','validation']){
 const chosen:any[]=[];
 for(const {id} of references){const r=routines.find(r=>r.case===id&&!used.has(r.id))!;chosen.push(r);used.add(r.id);}
 for(const r of routines.filter(r=>r.case==='AUF'))if(chosen.length<24&&!used.has(r.id)){chosen.push(r);used.add(r.id);}
 for(const r of routines)if(chosen.length<24&&!used.has(r.id)){chosen.push(r);used.add(r.id);}
 for(const r of chosen){const before=await apply(await solved(),inverse(r.alg));
  const acceptable:string[]=[];for(const candidate of routines)if(isSolved(await apply(before,candidate.alg)))acceptable.push(candidate.id);
  if(!acceptable.includes(r.id))throw Error('Fixture mismatch');
  fixtures.push({id:`${phase}-${chosen.indexOf(r)+1}`,phase,case:r.case,before,acceptable});
 }
}
if(new Set(fixtures.map(f=>hash(f.before))).size!==48)throw Error('Repeated state');
writeFileSync('experiments/full-pll-v1/fixtures.json',JSON.stringify(fixtures,null,2),{flag:'wx'});console.log({fixtures:fixtures.length,groups:groups.length});
