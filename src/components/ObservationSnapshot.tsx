import { useState } from 'react';
import { CubeNet } from './RoundCube';
import { stageVisuals } from './StageFacts';
import { colors } from '../lib/cube';
import type { CubeData } from '../lib/types';
const palette:Record<string,string>={white:'#fff',yellow:'#ecd247',green:'#58a673',blue:'#568ad4',red:'#db7068',orange:'#eaa04d'};
const positions:Record<string,[number,number]>={UB:[32,10],UL:[10,32],UR:[54,32],UF:[32,54],DB:[32,54],DL:[10,32],DR:[54,32],DF:[32,10],UBL:[10,10],URB:[54,10],ULF:[10,54],UFR:[54,54]};
const descriptions:Record<string,string>={daisy:'Yellow petals around the white center.',cross:'Yellow down; side colors match centers.',firstLayer:'Bottom edges and corners in place.',middle:'All pieces in the bottom two layers.',topCross:'Top edges show white upward.',topOriented:'Top corners show white upward.',cornersPlaced:'Corners in their home slots; twist ignored.',solved:'Every piece placed and oriented.',solvedPieces:'Correctly placed and oriented pieces.'};
function Pattern({stage}:{stage:ReturnType<typeof stageVisuals>[number]}){
 const facePattern=['daisy','cross','topCross','topOriented'].includes(stage.key);
 const fill=stage.key==='daisy'||stage.key==='cross'?palette.yellow:palette.white;
 return <svg viewBox="0 0 76 76" role="img" aria-label={`${stage.label}: ${stage.count} of ${stage.total} matching`}>
  {facePattern&&<rect x="26" y="26" width="18" height="18" rx="3" fill={stage.key==='cross'?palette.yellow:palette.white} stroke="#79898b"/>}
  {stage.selected.map((p,i)=>{
   const [x,y]=facePattern?positions[p.position]||[10,10]:[8+(i%5)*14,12+Math.floor(i/5)*15];
   const matched=stage.match(p),size=facePattern?18:10;
   return <g key={p.position}><rect x={facePattern?x-6:x} y={facePattern?y-6:y} width={size} height={size} rx="2" fill={matched?(facePattern?fill:'#5f9b70'):'#e3e8e8'} stroke={matched?'#4d765b':'#bec8ca'} strokeDasharray={matched?undefined:'2 2'}><title>{p.position}: {matched?'matches':'does not match'}; {JSON.stringify(p.stickers)}</title></rect>{matched&&facePattern&&<text x={x+3} y={y+7} textAnchor="middle" fontSize="10" fill="#314936">✓</text>}</g>;
  })}
 </svg>;
}
export function ObservationSnapshot({state,observation}:{state:CubeData;observation:any}){
 const stages=stageVisuals(state).filter(s=>s.key in (observation.completed||{}));
 const cross=stages.find(s=>s.key==='cross');
 const [hovered,setHovered]=useState<string|null>(null);
 const active=stages.find(s=>s.key===hovered);
 return <section className="observation-snapshot" id="step-one-observations">
  <div className="observation-linked">
   <aside className="observation-net-rail"><div className="observation-net-sticky">
     <h4>Unfolded cube</h4>
     <CubeNet state={state} stage={active}/>
     <p className="net-key" aria-live="polite">{active?`${active.count}/${active.total} match. Outlined stickers are checked; the rest are faded.`:'Hover a card to highlight the stickers it checks.'}</p>
     <div className="net-legend" style={{visibility:active?'visible':'hidden'}} aria-hidden={!active}><span>✓ matches</span><span>· does not match</span></div>
   </div></aside>
   <div className="observation-right">
    <header className="observation-intro"><h3>What JEV sees for this decision</h3><p>Hover a card to see the checked stickers on the left.</p></header>
    <div className="observation-cards">{stages.map(stage=><details key={stage.key} className={`observation-card ${active?.key===stage.key?'observation-active':''}`} onMouseEnter={()=>setHovered(stage.key)} onMouseLeave={()=>setHovered(null)}><summary><Pattern stage={stage}/><span><b>{stage.label}</b><strong>{stage.count}/{stage.total}{stage.key==='daisy'?' petals':' matching'}</strong><small>{descriptions[stage.key]}</small><code>{stage.key}: {String(observation.completed[stage.key])}</code></span></summary><div className="observation-more"><p>{stage.rule}</p>{stage.key==='cross'&&cross?<div className="cross-stickers">{cross.selected.map(p=>{
   const side=[...p.position].find(f=>f!=='D')!;
   const sideColor=Object.entries(p.stickers).find(([,f])=>f===side)?.[0];
   const downColor=Object.entries(p.stickers).find(([,f])=>f==='D')?.[0];
   return <div key={p.position}><code>{p.position} {p.solved?'✓':'×'}</code><span>Down <i style={{background:palette[downColor||'']}}/> / yellow <i style={{background:palette.yellow}}/></span><span>Side <i style={{background:palette[sideColor||'']}}/> / center <i style={{background:palette[colors[side]]}}/></span></div>;
  })}</div>:<p>{stage.selected.filter(stage.match).map(p=>p.position).join(', ')||'No positions'} {stage.count===1?'matches':'match'} this condition.</p>}</div></details>)}</div>
   </div>
  </div>
  <div className="observation-memory"><span><b>{observation.uncollectedYellowEdges}</b> yellow edges still uncollected</span><span>Previous goal: <b>{observation.previousGoal??'none'}</b></span><span>Recent actions: <b>{observation.recentActions?.join(' ')||'none'}</b></span></div>
  <p className="wire-caption">The icons illustrate measurements. JEV receives the named values in the request below, not these images. Open a card for the matching rule.</p>
 </section>;
}
