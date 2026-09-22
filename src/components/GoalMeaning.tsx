import { pieces } from '../lib/cube';
import type { CubeData } from '../lib/types';
export function goalMeanings(cube: CubeData) {
  const ps=pieces(cube), edges=ps.filter(p=>p.kind==='edge'), corners=ps.filter(p=>p.kind==='corner');
  const petals=edges.filter(p=>p.stickers.yellow==='U');
  const bottomEdges=edges.filter(p=>p.position.includes('D'));
  const bottomCorners=corners.filter(p=>p.position.includes('D'));
  const lower=[...bottomEdges,...bottomCorners];
  const middle=edges.filter(p=>!/[UD]/.test(p.position));
  const topEdges=edges.filter(p=>p.position.includes('U'));
  const topCorners=corners.filter(p=>p.position.includes('U'));
  const n=(list:typeof ps)=>list.filter(p=>p.solved).length;
  return {
    daisy: {meaning:'Yellow edge “petals” around the white top center. Four make a complete daisy.',why:petals.length?`${petals.length}/4 petals: ${petals.map(p=>`${p.piece} at ${p.position}`).join(', ')} ${petals.length===1?'has':'have'} yellow facing up.`:'0/4 petals: no top edge has yellow facing up.'},
    cross: {meaning:'A yellow bottom cross, with each edge’s side color matching its side center.',why:`${n(bottomEdges)}/4 bottom edges are in the correct slot and orientation.`},
    firstLayer: {meaning:'The whole bottom layer is solved, including its side colors.',why:`${n(lower)}/8 bottom pieces are solved.`},
    middle: {meaning:'The bottom two layers are solved.',why:`${n(lower)}/8 bottom pieces and ${n(middle)}/4 middle edges are solved.`},
    topCross: {meaning:'A white cross on top; side alignment is checked later.',why:`${topEdges.filter(p=>p.stickers.white==='U').length}/4 top edges have white facing up.`},
    topOriented: {meaning:'All four top corners show white upward. This flag checks corners; topCross checks edges.',why:`${topCorners.filter(p=>p.stickers.white==='U').length}/4 top corners have white facing up.`},
    cornersPlaced: {meaning:'Every corner is in its home slot, regardless of twist.',why:`${corners.filter(p=>p.position===p.destination).length}/8 corners occupy their home slots.`},
    solved: {meaning:'Every movable piece is correctly placed and oriented.',why:`${n(ps)}/20 edges and corners are solved.`},
    solvedPieces: {meaning:'The count of correctly placed and oriented edges and corners.',why:`${n(edges)} edges + ${n(corners)} corners = ${n(ps)} solved pieces.`},
  };
}
export function GoalMeaning({cube,state}: {cube:CubeData;state:any}) {
  const meanings=goalMeanings(cube);
  const missing=pieces(cube).filter(p=>p.kind==='edge'&&'yellow'in p.stickers&&p.stickers.yellow!=='U'&&!p.solved);
  return <>
    <div className="goal-meaning-list">{Object.entries(state.completed).map(([key,value])=>{
      const text=meanings[key as keyof typeof meanings];
      return <div key={key}><code>{key}: <b className={value===false?'meaning-false':'meaning-value'}>{String(value)}</b></code><div><span>{text?.meaning}</span><strong>{text?.why}</strong></div></div>;
    })}</div>
    <div className="goal-meaning-list goal-memory">
      <div><code>uncollectedYellowEdges: <b>{state.uncollectedYellowEdges}</b></code><div>Yellow edges still needing to become petals or reach their solved bottom slots.<strong>{missing.length?`${missing.map(p=>p.piece).join(', ')}: ${missing.length} remaining.`:'None remaining.'}</strong></div></div>
      <div><code>previousGoal: {JSON.stringify(state.previousGoal)}</code><div>{state.previousGoal===null?'No earlier goal: this is the first decision round.':`The previous round chose ${state.previousGoal}. Memory only; JEV can change goals.`}</div></div>
      <div><code>recentActions: {JSON.stringify(state.recentActions)}</code><div>{state.recentActions.length?'The last executed actions, in order. The original scramble is excluded.':'No solving actions have happened yet.'}</div></div>
    </div>
    <p className="wire-caption">Our convention: yellow bottom first, white top last. <a href="https://www.rubiks.com/solution-guides" target="_blank" rel="noreferrer">Beginner solving concepts ↗</a></p>
  </>;
}
