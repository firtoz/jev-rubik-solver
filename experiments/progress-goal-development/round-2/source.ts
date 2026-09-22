import {mkdirSync,readFileSync,writeFileSync,existsSync} from 'node:fs';
import {apply,solved,facts,hash} from '../../src/lib/cube';
import {faceObservation} from './first-layer';
import {MODEL,evaluate,budget} from '../../src/server/jev';
import {createRun} from '../../src/server/runner';
import {getRun,saveRun} from '../../src/server/store';
import type {JevRequest} from '../../src/lib/types';
export const definitions={
 cross:'Bottom cross: D edge-center cells (row1 col2, row2 col1, row2 col3, row3 col2) equal D center, AND row3 col2 of EACH side F,R,B,L equals its own face center. Ignore D corners.',
 firstLayer:'Bottom first layer: all nine D cells equal D center AND all three cells in row3 of EACH side F,R,B,L equal that side center. Ignore upper side rows and U.',
 lowerTwo:'Lower two layers: bottom first layer as defined above is complete AND all three cells in row2 of EACH side F,R,B,L equal that side center. Ignore row1 of sides and U.',
 solved:'Entire cube: every cell of each of the six faces equals that face center.',
};
export const strategy='Use this beginner progression. If the cube is entirely solved, choose solved. Otherwise, if the lower two layers are complete, choose last-layer. Otherwise, if the first layer is complete, choose middle-layer. Otherwise, if the cross is complete, choose first-layer. Otherwise either daisy or cross is acceptable: daisy is a scaffold for the cross, while cross means direct cross construction. Never dismantle a complete cross to make a daisy. This experiment stops at the last-layer handoff; it does not choose among last-layer algorithms.';
const goalOptions={daisy:'Build a temporary daisy for an incomplete bottom cross',cross:'Build or finish the bottom cross directly','first-layer':'Finish bottom corners while retaining the completed cross','middle-layer':'Solve middle edges while retaining the completed first layer','last-layer':'Work on the last layer while preserving the completed lower two layers',solved:'The entire cube is solved; stop'};
export async function progressCases(split:'development'|'validation'){
 let seed=split==='development'?7654321:998877;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed;};
 const used=new Set<string>();if(split==='validation')for(const c of JSON.parse(readFileSync('experiments/progress-goal-development/fixtures.json','utf8')))used.add(c.stateHash);
 const top=['U',"U'",'U2',"R U R' U R U2 R'","F R U R' U' F'","R U R' U' R' F R2 U' R' U' R U R' F'"];
 const cases=[];
 for(let i=0;i<20;i++){
  const category=i<5?'cross-needed':i<10?'corners-needed':i<15?'middle-needed':'last-layer-needed';
  let fixture:any;
  for(let attempt=0;attempt<1000;attempt++){
   let scramble=Array.from({length:2+random()%4},()=>top[random()%top.length]).join(' ');
   if(category==='cross-needed')scramble+=' '+['D',"D'",'R2','F',"L'"][random()%5];
   if(category==='corners-needed')scramble+=' '+["R U R' U'","L' U' L U","F' U' F U"][random()%3];
   if(category==='middle-needed')scramble+=' '+["U R U' R' U' F' U F","U' L' U L U F U' F'"][random()%2];
   const state=await apply(await solved(),scramble),f=facts(state),key=hash(state);
   const accepted=f.solved?['solved']:f.middle?['last-layer']:f.firstLayer?['middle-layer']:f.cross?['first-layer']:['daisy','cross'];
   const desired={'cross-needed':'cross','corners-needed':'first-layer','middle-needed':'middle-layer','last-layer-needed':'last-layer'}[category];
   if(used.has(key)||!accepted.includes(desired))continue;
   used.add(key);fixture={id:`${split}-${i+1}`,category,scramble,stateHash:key,observation:faceObservation(state),expected:{cross:f.cross?'yes':'no',firstLayer:f.firstLayer?'yes':'no',lowerTwo:f.middle?'yes':'no',solved:f.solved?'yes':'no'},accepted};break;
  }
  if(!fixture)throw new Error('Fixture generation failed');cases.push(fixture);
 }
 return cases;
}
export function progressRequest(observation:unknown,style='base'):JevRequest{
 const extra=style==='scope'?' Inspect only the cells named in each definition. Ignore all other cells for that question.':style==='prerequisites'?' Check all prerequisites in this definition as well as the newly added region. A higher layer cannot count as complete when a required lower layer is incomplete.':'';
 return {model:MODEL,state:observation,questions:Object.fromEntries(Object.entries(definitions).map(([k,definition])=>[k,{type:'choice',instructions:(style==='selfcontained'?JSON.stringify(definitions)+' Evaluate only '+k+': ': '')+definition+extra+' Does this condition hold?',criteria:{yes:'All stated conditions hold',no:'One or more stated conditions fail'}}]))};
}
export function selectGoal(observation:unknown,variant:string,recognized?:Record<string,string>):JevRequest{
 const style=variant.split(':')[1];const extra=style==='scope'?' Inspect only the cells named in each completion definition. Ignore unsolved cells outside that region.':style==='prerequisites'?' Use the most advanced completed prerequisite to choose the next unfinished goal. Do not confuse a single uniform face with a complete layer.':'';
 return {model:MODEL,state:recognized?{observations:observation,previousModelAssessments:recognized}:observation,questions:{goal:{type:'choice',instructions:{definitions,strategy,task:'Choose the next goal.'+extra+(recognized?' Use your previous assessments as the working progress description. They are model observations, not answers from a solver.':'')},criteria:goalOptions}}};
}
export function regionRequest(observation:unknown):JevRequest{
 const checks:Record<string,string>={Dface:'all nine cells of D',Dedges:'D cells row1 col2, row2 col1, row2 col3, row3 col2',Uface:'all nine cells of U'};
 for(const face of ['F','R','B','L']){checks[face+'bottom']=`all three cells in row3 of ${face}`;checks[face+'edge']=`the single cell row3 col2 of ${face}`;checks[face+'middle']=`all three cells in row2 of ${face}`;checks[face+'face']=`all nine cells of ${face}`;}
 return {model:MODEL,state:observation,questions:Object.fromEntries(Object.entries(checks).map(([k,region])=>[k,{type:'choice',instructions:`Inspect ONLY ${region}. Rows and columns are numbered 1 to 3. Do all these specified cells match their OWN face center? Ignore every other cell. Do not decide whether a layer or the cube is solved.`,criteria:{yes:'Every specified cell matches its own face center',no:'At least one specified cell differs from its own face center'}}]))};
}
export function combineProgress(regions:Record<string,string>):JevRequest{
 const groups={cross:['Dedges','Fedge','Redge','Bedge','Ledge'],firstLayer:['Dface','Fbottom','Rbottom','Bbottom','Lbottom'],lowerTwo:['Dface','Fbottom','Rbottom','Bbottom','Lbottom','Fmiddle','Rmiddle','Bmiddle','Lmiddle'],solved:['Dface','Uface','Fface','Rface','Bface','Lface']};
 return {model:MODEL,state:{regionChecksFromPreviousModelResponse:regions},questions:Object.fromEntries(Object.entries(groups).map(([k,keys])=>[k,{type:'choice',instructions:`Assess ${k} using your earlier answers. Return yes exactly when ALL of these named region checks are yes: ${keys.join(', ')}. If any is no, return no. Ignore checks outside this list; do not replace your earlier answers.`,criteria:{yes:'All required checks are yes',no:'At least one required check is no'}}]))};
}
export async function runProgress(split:'development'|'validation',round:number,variants:string[]){
 const root=`experiments/progress-goal-${split}`,dir=`${root}/round-${round}`;if(existsSync(`${dir}/started.json`))throw new Error('Already started');
 mkdirSync(dir,{recursive:true});let cases:any[];
 if(existsSync(`${root}/fixtures.json`))cases=JSON.parse(readFileSync(`${root}/fixtures.json`,'utf8'));else{cases=await progressCases(split);writeFileSync(`${root}/fixtures.json`,JSON.stringify(cases,null,2));}
 const start=budget();const maxRequests=20*variants.reduce((n,v)=>n+(v.startsWith('direct')?1:v.startsWith('regional')?3:2),0);if(start.cap-start.reservedAndSpent<maxRequests*64000*.042/1e6)throw new Error('Budget');
 writeFileSync(`${dir}/source.ts`,readFileSync(import.meta.path));writeFileSync(`${dir}/started.json`,JSON.stringify({at:new Date().toISOString(),variants,maxRequests,start,scope:'Four early/middle checkpoints, five cases each; last-layer goal is a handoff, not late-case selection. All options include solved, tested separately offline.',ranking:'goal accuracy, then premature advancement, then requests and cost; maximum two development rounds; freeze before validation'},null,2));
 const results:any[]=[];const queue=[...variants];
 const persist=()=>{const summary=variants.map(variant=>{const rs=results.filter(r=>r.variant===variant);return {variant,total:20,completed:rs.length,goalCorrect:rs.filter(r=>r.correct).length,recognitionAll:variant.startsWith('direct')?null:rs.filter(r=>r.recognitionAll).length,recognitionFields:variant.startsWith('direct')?null:rs.reduce((n,r)=>n+(r.recognitionFields||0),0),wrongDespiteCorrectRecognition:rs.filter(r=>r.recognitionAll&&!r.correct).length,errors:rs.filter(r=>r.error).length,requests:rs.reduce((n,r)=>n+r.exchanges.length,0),cost:rs.flatMap(r=>r.exchanges).reduce((n,d)=>n+d.cost,0)}});writeFileSync(`${dir}/results.json`,JSON.stringify({summary,results},null,2));return summary;};
 await Promise.all(Array.from({length:Math.min(3,variants.length)},async()=>{while(queue.length){const variant=queue.shift()!;for(const c of cases){
 const run=await createRun(c.scramble,'primitive',`progress-goal-${split}`);const exchanges:any[]=[];let row:any={caseId:c.id,category:c.category,expected:c.expected,accepted:c.accepted,variant,runId:run.id};
 try{let recognized:Record<string,string>|undefined;
 if(!variant.startsWith('direct')){let recognition=progressRequest(c.observation,variant.split(':')[1]);if(variant.startsWith('regional')){const checks=await evaluate(run.id,regionRequest(c.observation),AbortSignal.timeout(30000),{maxAttempts:1});exchanges.push(checks);const answers=Object.fromEntries(Object.entries(checks.response.answers).map(([k,a])=>[k,a.choice]));row.regions=answers;recognition=combineProgress(answers);}
 const d=await evaluate(run.id,recognition,AbortSignal.timeout(30000),{maxAttempts:1});exchanges.push(d);recognized=Object.fromEntries(Object.entries(d.response.answers).map(([k,a])=>[k,a.choice]));row.recognized=recognized;row.recognitionFields=Object.keys(c.expected).filter(k=>recognized![k]===c.expected[k]).length;row.recognitionAll=row.recognitionFields===4;}
 const d=await evaluate(run.id,selectGoal(c.observation,variant,recognized),AbortSignal.timeout(30000),{maxAttempts:1});exchanges.push(d);row.actual=d.response.answers.goal.choice;row.correct=c.accepted.includes(row.actual);
 }catch(e){row.error=String(e);}
 row.exchanges=exchanges;results.push(row);const saved=getRun(run.id);saved.status='stopped';saved.reason='Recognition to goal probe complete; no moves';saveRun(saved);persist();
 }console.log(JSON.stringify(persist()));}}));return persist();
}
if(import.meta.main){const split=process.argv.includes('--validation')?'validation':'development',round=Number(process.argv.find(a=>a.startsWith('--round='))?.split('=')[1]??1),variants=(process.argv.find(a=>a.startsWith('--variants='))?.split('=')[1]??'direct,chain,chain:scope').split(',');console.log(JSON.stringify(await runProgress(split,round,variants)));}
