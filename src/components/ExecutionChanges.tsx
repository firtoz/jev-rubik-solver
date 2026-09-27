import { useState } from 'react';
import { pieceChanges } from '../lib/piece-changes';
import { facts } from '../lib/cube-observations';
import type { CubeData } from '../lib/types';
import { CubeNet } from './RoundCube';
import { FlowArrow } from './FlowArrow';

const palette: Record<string,string> = {white:'#f5f5ef',yellow:'#f4d542',green:'#57aa70',blue:'#5689d6',red:'#e06962',orange:'#f0a04b'};
export function ExecutionChanges({before,after,target}:{before:CubeData;after:CubeData;target?:string}) {
  const changes = pieceChanges(before,after,target);
  const [hovered,setHovered] = useState<string|null>(null);
  const selected = changes.find(p => p.from.piece === hovered);
  const visible = selected ? [selected] : changes;
  const solved = changes.filter(p => p.to.solved).length;
  const displaced = changes.filter(p => p.from.solved && !p.to.solved).length;
  const oldFacts = facts(before), newFacts = facts(after);
  const labels:Record<string,string> = {daisy:'Yellow petals',cross:'Yellow cross',firstLayer:'First layer',middle:'Middle layer',topCross:'White cross',topOriented:'White face',cornersPlaced:'Corners placed',solved:'Cube solved'};
  const milestones = Object.entries(labels).filter(([key]) => oldFacts[key as keyof typeof oldFacts] !== newFacts[key as keyof typeof newFacts]);
  function row(change:typeof changes[number]) {
    const {from,to,status} = change;
    return <div className={`piece-change ${hovered===from.piece?'is-hovered':''}`} key={from.piece} onMouseEnter={()=>setHovered(from.piece)} onMouseLeave={()=>setHovered(null)}>
      <span className="piece-change-name"><span className="piece-colors" aria-hidden="true">{Object.keys(from.stickers).map(color=><i key={color} style={{background:palette[color]}}/>)}</span><span>{Object.keys(from.stickers).join(' / ')}<small>{from.kind}{from.piece===target?' · JEV’s target':''}</small></span></span>
      <span className="piece-change-path"><code>{from.position}</code><FlowArrow/><code>{to.position}</code></span>
      <span className={`piece-change-status ${to.solved?'is-solved':from.solved?'is-displaced':''}`}>{status}</span>
    </div>;
  }
  return <section className="execution-changes" aria-label="Measured effects of the recorded action">
    <div className="execution-change-summary"><strong>{changes.length ? `${changes.length} pieces affected` : 'No net change'}</strong><span>{solved>0?`${solved} newly solved`:'No new solved pieces'}{displaced>0?` · ${displaced} displaced from solved`:''} · {20-changes.length} unchanged</span></div>
    <div className="execution-cubes"><div><h3>Before the routine</h3><CubeNet state={before} highlightPositions={visible.map(p=>p.from.position)}/></div><div><h3>After the routine</h3><CubeNet state={after} highlightPositions={visible.map(p=>p.to.position)}/></div></div>
    <p className="piece-change-caption">{selected?<>{Object.keys(selected.from.stickers).join(' / ')} {selected.from.kind}: {Object.entries(selected.from.stickers).filter(([color,face])=>selected.to.stickers[color]!==face).map(([color,face],i)=><span key={color}>{i>0?' · ':''}{color} {face} <FlowArrow/> {selected.to.stickers[color]}</span>)}</>:'Outlined stickers belong to affected pieces. Hover a row to follow one piece.'}</p>
    <div className="piece-change-list">{changes.slice(0,4).map(row)}{changes.length>4&&<details onToggle={()=>setHovered(null)}><summary>{changes.length-4} more affected pieces</summary>{changes.slice(4).map(row)}</details>}</div>
    {milestones.length>0&&<div className="execution-milestones">{milestones.map(([key,label])=><span key={key}>{label} <b>{key==='daisy'?<>{oldFacts.daisy}/4 <FlowArrow/> {newFacts.daisy}/4</>:newFacts[key as keyof typeof newFacts]?'complete':'no longer complete'}</b></span>)}</div>}
    <p className="wire-caption">Positions use the fixed cube frame: U up, D down, F front, B back, L left, R right. Only the routine’s endpoints are compared.</p>
  </section>;
}
