import { netStickers } from '../lib/cube-encoding';
import type { stageVisuals } from './StageFacts';
import type { CubeData } from '../lib/types';
const palette: Record<string,string> = {white:'#f5f5ef',yellow:'#f4d542',green:'#57aa70',blue:'#5689d6',red:'#e06962',orange:'#f0a04b'};
const faceNames:Record<string,string>={U:'Up',D:'Down',F:'Front',B:'Back',R:'Right',L:'Left'};
export function CubeNet({state,stage,highlightPositions}:{state:CubeData;stage?:ReturnType<typeof stageVisuals>[number];highlightPositions?:string[]}) {
 const net=netStickers(state);
 const faceOnly=stage&&['daisy','topCross','topOriented'].includes(stage.key);
 return <div className={`round-cube-net ${stage||highlightPositions?'net-highlighting':''}`}>{Object.entries(net).map(([face,stickers])=><div className={`round-cube-face cube-net-${face}`} key={face}><small>{face} · {faceNames[face]}</small><div>{stickers.map(({position,color})=>{
  const piece=stage?.selected.find(p=>p.position===position);
  const center=position.length===1;
  const relevant=!!stage&&(center?faceOnly?face==='U':true:!!piece&&(!faceOnly||face==='U'));
  const matches=piece&&stage?.match(piece);
  const highlighted=highlightPositions?.includes(position);
  const status=highlightPositions ? (center?'net-center':highlighted?'net-piece-selected':'net-muted') : stage?(relevant?'net-relevant '+(center?'':matches?'net-matches':'net-mismatch'):'net-muted'):'';
  return <span key={position} className={status} style={{background:palette[color]}} title={`${position}: ${color} on ${face}${piece?`; ${matches?'matches':'does not match'} ${stage?.label}`:''}`} aria-label={`${face} face, ${position}: ${color}${relevant&&!center?matches?', matches condition':', does not match condition':''}`}>{center?face:highlighted?<i className="net-selected-dot"/>:relevant?<b>{matches?'✓':'·'}</b>:''}</span>;
 })}</div></div>)}</div>;
}
