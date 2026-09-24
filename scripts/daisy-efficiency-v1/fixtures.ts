// Evaluator only. This labels the routine-selection request, not the later landing decision.
import {readFileSync,writeFileSync} from 'node:fs';
import {apply,pieces} from '../../src/lib/cube';
import reference from '../brain-early-v3/routine-reference.json';
const paths=[...new Bun.Glob('*/full-integration/results.json').scanSync('experiments')].sort().map(p=>'experiments/'+p);
paths.push('experiments/diagonal-corners-v1/fresh-development/results.json');
const all:any[]=[],seen=new Set<string>();
for(const path of paths)for(const run of JSON.parse(readFileSync(path,'utf8')).rows??[])for(const s of run.steps??[]){
 if(s.decision?.goal!=='daisy')continue;
 for(const x of s.exchanges??[]){
  if(!x.request.questions.routine)continue;
  const state=x.request.state,key=JSON.stringify(state);if(seen.has(key))continue;seen.add(key);
  const applicable=reference.filter(r=>r.position===state.target.position&&r.yellowDirection===state.target.yellowDirection&&!r.affectedBottomSlots.some(p=>state.protectedBottomSlots.includes(p))&&!state.previouslyRejectedByModel.includes(r.id));
  const lifts=applicable.filter(r=>!['stage-bottom-edge','lower-top-edge'].includes(r.id)),pool=lifts.length?lifts:applicable;
  const minimum=pool.length?Math.min(...pool.map(r=>r.sequence.split(' ').length)):0;
  const acceptable=pool.length?pool.filter(r=>r.sequence.split(' ').length===minimum).map(r=>r.id):['reconsider'];
  all.push({id:'selection-'+all.length,source:{path,run:run.id},request:x.request,acceptable,minimum});
 }
}
if(all.length<30)throw Error('Need30 distinct real request states; found '+all.length);
const fixtures=all.slice(0,30).map((f,i)=>({...f,phase:i%2?'validation':'development'}));
writeFileSync('experiments/daisy-efficiency-v1/fixtures.json',JSON.stringify(fixtures,null,2));console.log({available:all.length,fixtures:fixtures.length});
