import {algorithmLabel,namedAlgorithms} from './algorithm-labels';
import { facts, pieces } from './cube-observations';
import type { CubeData } from './types';
type Round={before:CubeData;after:CubeData;alg:string;decision:any;exchanges?:{request:any}[]};
const goals:Record<string,string>={'daisy':'Gather yellow petals','cross':'Build the yellow cross','first-layer':'Solve a yellow corner','middle-layer':'Solve a middle edge','top-cross':'Make the white cross','top-orientation':'Orient white corners','top-corners':'Place white corners','top-edges':'Place white edges'};
const verbs:Record<string,string>={insert:'Insert',align:'Align',extract:'Extract',reorient:'Reorient',lower:'Lower',clear:'Make space for',execute:'Move',permute:'Reposition'};
const objectives:Record<string,string>={daisy:'Build the daisy: four yellow petals',cross:'Build the yellow cross',f2l:'Solve the first two layers',pll:'Put the last-layer pieces in their homes',oll:'Orient the last layer'};
export function roundSummary(round:Round){
 const d=round.decision||{},before=facts(round.before),after=facts(round.after);
 const target=pieces(round.before).find(p=>p.piece===d.target),result=pieces(round.after).find(p=>p.piece===d.target);
 const name=target?`${Object.keys(target.stickers).join('–')} ${target.kind}`:'';
 let title=namedAlgorithms.has(d.skill)?`${algorithmLabel(d.skill)} · ${(goals[d.goal]||'apply routine').toLowerCase()}`:name?`${verbs[d.intent]||'Move'} ${name}`:goals[d.goal]||'Apply the chosen routine';
 let context=target?`At ${target.position}; home ${target.destination}.`: 'Whole-layer decision.';
 if(target&&target.position.startsWith('U')&&target.destination.startsWith('D')&&[...target.position].filter(x=>x!=='U').sort().join('')===[...target.destination].filter(x=>x!=='D').sort().join(''))context='Directly above its home.';
 if(d.intent==='clear')context='JEV chose to clear a landing slot.';
 if(d.intent==='lower')context='JEV chose to lower the top target.';
 // Read the exact local-frame observation sent to the operation question.
 // These are UI annotations, never a new policy decision or model rationale.
 const observation=round.exchanges?.filter(e=>e.request.questions?.operation).at(-1)?.request.state;
 const local=observation?.target;
 let measuredOutcome:string|undefined;
 let frame:string|undefined;
 if(observation&&['F','R','B','L'].includes(d.front))frame=`In the chosen reference frame · front ${d.front}`;
 if(['middle-right','middle-left'].includes(d.skill)&&local&&typeof local==='object'){
  const side=d.skill==='middle-right'?'R':'L';
  const frontColor=Object.entries(local.stickers||{}).find(([,direction])=>direction==='F')?.[0];
  const topColor=Object.entries(local.stickers||{}).find(([,direction])=>direction==='U')?.[0];
  const centers=observation.frame?.centers;
  if(local.position==='UF'&&local.destination===`F${side}`&&frontColor===centers?.F&&topColor===centers?.[side]){
   title=algorithmLabel(d.skill);
   context=`${frontColor} matches front; ${topColor} belongs ${side==='R'?'right':'left'}.`;
   context=context[0].toUpperCase()+context.slice(1);
  }
 }
 if(d.skill==='sune'&&observation?.corners){
  const c=observation.corners,n=observation.whiteUpCount;
  const finishing=n===1&&c.ULF==='U'&&c.UFR==='F'&&c.URB==='R'&&c.UBL==='B';
  const staging=(n===0&&c.ULF==='L')||(n===1&&c.ULF==='U')||(n===2&&c.ULF==='F');
  if(finishing){title='Sune · finish orientation';context='White-up corner at front-left; front-right corner shows white forward.';}
  else if(staging){
   title='Sune · preparation';
   context=n===0?'No white corners face up; front-left corner shows white to the left.':n===2?'Two white corners face up; front-left corner shows white forward.':'One white corner faces up at front-left.';
  }else context='Recorded corner pattern does not match the taught Sune staging rule.';
  const count=(state:CubeData)=>pieces(state).filter(p=>p.kind==='corner'&&p.stickers.white==='U').length;
  measuredOutcome=`${count(round.before)} → ${count(round.after)} oriented corners`;
 }
 if(['edge-cycle','edge-cycle-inverse'].includes(d.skill)&&Array.isArray(observation?.stagePieces)){
  const cycle=d.skill==='edge-cycle'?{UF:'UR',UR:'UL',UL:'UF',UB:'UB'}:{UF:'UL',UL:'UR',UR:'UF',UB:'UB'};
  const expected=Object.entries(cycle).every(([position,destination])=>observation.stagePieces.some((p:any)=>p.position===position&&p.destination===destination));
  if(expected&&observation.completed?.topOriented&&observation.whiteUpPositions?.length===4){
   title=`${algorithmLabel(d.skill)} · cycle three edges`;
   context=`Back edge solved; the other three need the ${d.skill==='edge-cycle'?'Ua':'Ub'} cycle.`;
  }
 }
 const outcome:string[]=[];
 if(after.solved)outcome.push('Cube solved');
 else if(measuredOutcome)outcome.push(measuredOutcome);
 else if(target&&result&&!target.solved&&result.solved)outcome.push(`${target.kind==='corner'?'Corner':'Edge'} solved`);
 else if(after.daisy>before.daisy)outcome.push(`${after.daisy}/4 petals`);
 else {
  const completed:[keyof typeof before,string][]=[['cross','Yellow cross complete'],['firstLayer','First layer complete'],['middle','First two layers complete'],['topCross','White cross complete'],['topOriented','White face complete'],['cornersPlaced','Corners placed']];
  const change=completed.filter(([k])=>!before[k]&&after[k]).at(-1);
  if(change)outcome.push(change[1]);
  else if(target&&result&&target.position!==result.position)outcome.push(`${target.position} → ${result.position}`);

 }
 if(!measuredOutcome&&before.cross&&after.cross&&!after.solved)outcome.push('cross preserved');
 if(before.cross&&!after.cross)outcome.push('cross disturbed');
 return {title,context,objective:objectives[d.goal]||goals[d.goal]||d.goal,outcome:outcome.join(' · '),...(frame?{frame}:{})};
}
export function transitionSummary(rounds:Round[],from:number,to:number){
 if(to===from+1)return {...roundSummary(rounds[from]),round:from};
 if(to<from)return {title:`Rewind ${from-to} round${from-to===1?'':'s'}`,context:'Reverse the recorded moves.',outcome:`Returned to round ${to+1}`,round:to};
 return {title:`Advance ${to-from} rounds`,context:'Play every recorded action.',outcome:to===rounds.length?(facts(rounds.at(-1)!.after).solved?'Cube solved':'Reached final state'):`Reached round ${to+1}`,round:to-1};
}
