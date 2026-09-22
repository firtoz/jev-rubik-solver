import {algorithmLabel} from '../lib/algorithm-labels';
import { FlowArrow } from './FlowArrow';
import { useState, type ReactNode } from 'react';
import { CubeNet } from './RoundCube';
import type { CubeData } from '../lib/types';

const colors: Record<string,string> = { white:'#f5f5ef', yellow:'#f4d542', green:'#57aa70', blue:'#5689d6', red:'#e06962', orange:'#f0a04b' };
const faces: Record<string,string> = { U:'up', D:'down', F:'front', B:'back', R:'right', L:'left' };
const label = (s:string) => s.replace(/([a-z])([A-Z])/g,'$1 $2').replaceAll('_',' ');
function Token({value}:{value:any}) {
  if (value === null || value === undefined) return <span className="do-empty">None</span>;
  if (typeof value === 'boolean' || value === 'yes' || value === 'no') {
    const yes=value===true||value==='yes';
    return <span className={`do-flag ${yes?'is-true':''}`}>{yes?'✓':'○'} {String(value)}</span>;
  }
  return <span className="do-token">{colors[value]&&<i style={{background:colors[value]}}/>}{String(value)}</span>;
}
function Fields({data}:{data:any}) {
  return <div className="do-fields">{Object.entries(data||{}).map(([k,v])=><div key={k}><small>{label(k)}</small><Data value={v}/></div>)}</div>;
}
function Data({value}:{value:any}):ReactNode {
  if(value===null||typeof value!=='object') return <Token value={value}/>;
  if(Array.isArray(value)) return value.length?<div className="do-list">{value.map((v,i)=><Data key={i} value={v}/>)}</div>:<span className="do-empty">None</span>;
  return <Fields data={value}/>;
}
function Piece({piece,title}:{piece:any;title?:string}) {
  if (!piece || typeof piece !== 'object' || Array.isArray(piece)) return <Fields data={{target:piece}}/>;
  const featured=['piece','position','destination','stickers','layer','yellowDirection','sideColor','sideDirection','solved','satisfiesStageGoal','directlyAboveHome'];
  return <article className="do-piece">
    <header><strong>{title || piece.piece || 'Selected piece'}</strong>{piece.kind&&<small>{piece.kind}</small>}</header>
    <div className="do-route"><span><small>Now</small><b>{piece.position || 'Not supplied'}</b></span>{piece.destination&&<><FlowArrow/><span><small>Home</small><b>{piece.destination}</b></span></>}</div>
    {piece.stickers&&<div className="do-stickers">{Object.entries(piece.stickers).map(([color,direction])=><span key={color}><Token value={color}/><FlowArrow/><b>{String(direction)}</b></span>)}</div>}
    <Fields data={Object.fromEntries(featured.filter(k=>!['piece','position','destination','stickers'].includes(k)&&k in piece).map(k=>[k,piece[k]]))}/>
    {Object.keys(piece).some(k=>!featured.includes(k)&&k!=='kind')&&<details><summary>More piece measurements</summary><Fields data={Object.fromEntries(Object.entries(piece).filter(([k])=>!featured.includes(k)&&k!=='kind'))}/></details>}
  </article>;
}
function Slots({slots,empty=false,required=[]}:{slots:Record<string,boolean>;empty?:boolean;required?:string[]}) {
  return <div className="do-slot-group"><div className="do-slots">{['UB','UL','U','UR','UF'].map(slot=><span key={slot} className={`slot-${slot} ${slots[slot]?'on':''} ${required.includes(slot)?'slot-required':''}`}><b>{slot}</b>{required.includes(slot)&&<em title="Required landing slot">◇</em>}<small>{slot==='U'?'top':slots[slot]?empty?'free':'yellow up':empty?'occupied':'not a petal'}</small></span>)}</div><small>{empty?'Available top landing slots':'Top-face petal occupancy'}<br/>Positions use the request’s reference frame.{required.length>0&&<><br/>◇ Required landing slot{required.map(slot=><span className="landing-check" key={slot}>{slot}: {slots[slot]?'occupied by a petal':'clear'}</span>)}</>}</small></div>;
}
function TargetObservation({state:s,cube}:{state:any;cube:CubeData}) {
  const [hovered,setHovered]=useState<number|null>(null);
  const edges=(s.observation?.edges||[]).map((text:string)=>({text,match:text.match(/^Edge (\w+) is at (\w+)\. (\w+) faces (\w+); (\w+) faces (\w+)\./)}));
  const active=hovered===null?null:edges[hovered]?.match;
  return <div className="target-observation-linked">
    <aside><div className="target-net-sticky"><h4>Find the target</h4><CubeNet state={cube} highlightPositions={active?[active[2]]:undefined}/><p className="target-net-caption">{active?`${active[1]} is at ${active[2]}. Both outlined stickers belong to this edge.`:'Hover an edge to find its two stickers on the cube.'}</p><small>Piece IDs name their home. Position tells you where they are now.</small></div></aside>
    <div><div className="do-piece-grid">{edges.map(({text,match}:any,i:number)=>{
      const id=match?.[1];
      return <article className={`do-piece ${hovered===i?'do-hovered':''}`} key={i} onMouseEnter={()=>setHovered(i)} onMouseLeave={()=>setHovered(null)}><header><strong>{id || `Edge ${i+1}`}</strong></header>
        {match?<><div className="do-route"><span><small>Now</small><b>{match[2]}</b></span><FlowArrow/><span><small>Home</small><b>{id}</b></span></div><div className="do-stickers">{[[match[3],match[4]],[match[5],match[6]]].map(([color,face])=><span key={color}><Token value={color}/><FlowArrow/><b>{face}</b></span>)}</div></>:<p>{text}</p>}
        <Fields data={{petal:s.checks?.[`petal_${id}`],solvedBottom:s.checks?.[`bottom_${id}`]}}/></article>;
    })}</div><div className="target-context"><Fields data={{selectedGoal:s.selectedGoal,counts:s.counts,uncollectedYellowEdges:s.uncollectedYellowEdges,excludedTarget:s.excludedTarget,memory:s.observation?.memory}}/></div><details className="target-frame"><summary>Fixed frame and center colors</summary><Fields data={s.observation?.frame}/></details></div>
  </div>;
}
export function DecisionObservation({state:s,kind,cube}:{state:any;kind:string;cube:CubeData}) {
  const used=new Set<string>();
  function take(keys:string[],node:ReactNode){keys.forEach(k=>used.add(k));return node;}
  return <div className="decision-observation">
    {kind==='gatherTarget'&&take(['checks','observation','selectedGoal','counts','uncollectedYellowEdges','excludedTarget'],<TargetObservation state={s} cube={cube}/>)}
    {s.stagePieces&&take(['stagePieces'],<div className="do-piece-grid">{s.stagePieces.map((piece:any,i:number)=><Piece key={i} piece={piece}/>)}</div>)}
    {s.target&&typeof s.target==='object'&&take(['target'],<Piece piece={s.target}/>)}
    {s.referenceViews&&take(['referenceViews'],<><p className="do-caption">The same piece from each possible front. Choosing a view does not turn the cube.</p><div className="do-piece-grid">{Object.entries(s.referenceViews).map(([front,view]:any)=><article className="do-view" key={front}><h4>Front = {front}</h4>{view.target && typeof view.target==='object'?<Piece piece={view.target}/>:<Fields data={{target:view.target}}/>} <Fields data={Object.fromEntries(Object.entries(view).filter(([k])=>k!=='target'))}/></article>)}</div></>)}
    {s.current&&s.pending&&take(['current','pending'],<div className="do-compare"><article><h4>Observed now</h4><Fields data={s.current}/></article><article><h4>Remembered plan</h4><Fields data={s.pending}/></article></div>)}
    {s.currentPosition&&take(['currentPosition',...(s.requiredPosition?['requiredPosition']:[]),...(s.yellowDirection?['yellowDirection']:[])],<div className="do-location"><div><small>Current position</small><strong>{s.currentPosition}</strong><span>{faces[s.currentPosition] || ''}</span></div>{s.requiredPosition&&<><FlowArrow/><div><small>Required position</small><strong>{s.requiredPosition}</strong></div></>}{s.yellowDirection&&<div><small><Token value="yellow"/> sticker faces</small><strong>{s.yellowDirection} · {faces[s.yellowDirection]}</strong></div>}</div>)}
    {s.yellowUpPetals&&take(['yellowUpPetals'],<Slots slots={s.yellowUpPetals} required={s.selectedRoutine?.requiredFreeSlots || []}/>)}
    {s.freeSlots&&take(['freeSlots'],<Slots empty slots={Object.fromEntries(['UF','UR','UB','UL'].map(k=>[k,s.freeSlots.includes(k)]))}/>)}
    {s.selectedRoutine&&take(['selectedRoutine'],<article className="do-routine"><small>JEV’s selected routine</small><strong title={s.selectedRoutine.id}>{algorithmLabel(s.selectedRoutine.id)}</strong><div className="do-moves">{s.selectedRoutine.sequence?.split(' ').map((move:string,i:number)=><code key={i}>{move}</code>)}</div><Fields data={Object.fromEntries(Object.entries(s.selectedRoutine).filter(([k])=>!['id','sequence'].includes(k)))}/></article>)}
    <Fields data={Object.fromEntries(Object.entries(s).filter(([k])=>!used.has(k)))}/>
  </div>;
}

export function RoutineDefinition({text}:{text:string}) {
  let routine:any;
  try { routine=JSON.parse(text); } catch { return <span>{text}</span>; }
  if (!routine || typeof routine!=='object' || !routine.sequence) return <span>{text}</span>;
  return <div className="do-definition"><div className="do-moves">{routine.sequence.split(' ').map((move:string,i:number)=><code key={i}>{move}</code>)}</div><details><summary>Purpose and requirements</summary><p>{routine.purpose}</p><Fields data={Object.fromEntries(Object.entries(routine).filter(([k])=>!['id','sequence','purpose'].includes(k)))}/></details></div>;
}
