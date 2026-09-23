import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {label} from '../less-help-scene/fixtures';
import {scene} from './policy';
import {apply,solved,hash} from '../../src/lib/cube';
const root='experiments/teaching-study-v1';
const original=JSON.parse(readFileSync(`${root}/screen-fixtures.json`,'utf8'));
const fixtures=JSON.parse(readFileSync(`${root}/integration-fixtures.json`,'utf8'));
const rows=JSON.parse(readFileSync(`${root}/integration-results.json`,'utf8')).rows;
const selected:any[]=[],seen=new Set<string>(),quota:Record<string,number>={done:4,extract:4,align:6,insert:6};
async function add(state:any,scramble:string,intention:string,origin:string){
 const key=JSON.stringify(scene(state));if(!quota[intention]||seen.has(key))return;
 const labels=await label(state);if(!Object.values(labels).some((x:any)=>x.eligible&&x.intention===intention))return;
 if(hash(await apply(await solved(),scramble))!==hash(state))throw Error('Replay');
 seen.add(key);quota[intention]--;selected.push({id:`development-${selected.length+1}`,scramble,state,labels,coverageIntent:intention,origin});
}
for(const c of original)await add(c.state,c.scramble,'done','v1 development');
for(const r of rows){const f=fixtures.find((c:any)=>c.id===r.id);let scramble=f.scramble;for(const cycle of r.cycles){const gold=(await label(cycle.before))[cycle.answer.target];if(gold)await add(cycle.before,scramble,gold.intention,`retired v1 integration ${r.id}`);scramble+=' '+cycle.alg;}}
for(const intent of ['extract','align','insert'])for(const c of original)await add(c.state,c.scramble,intent,'v1 development');
if(selected.length!==20)throw Error(JSON.stringify(quota));mkdirSync('experiments/teaching-study-v2',{recursive:true});writeFileSync('experiments/teaching-study-v2/development.json',JSON.stringify(selected,null,2),{flag:'wx'});console.log(selected.map(c=>({id:c.id,intent:c.coverageIntent,origin:c.origin})));
