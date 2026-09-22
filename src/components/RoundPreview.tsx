import { FlowText } from './FlowArrow';
import { transitionSummary } from '../lib/round-summary';
import { useEffect, useRef, useState } from 'react';
import type { TwistyPlayer, ExperimentalMillisecondTimestamp } from 'cubing/twisty';

type Props={setup:string;moves:string[];round:number;finalLabel?:string;summaries:Parameters<typeof transitionSummary>[0]};
/** Plays recorded transitions only. The displayed state is the start of a round. */
export function RoundPreview({setup,moves,round,summaries,finalLabel='Solved'}:Props) {
  const host=useRef<HTMLDivElement>(null),wanted=useRef(round),kick=useRef(()=>{});
  const [moveDisplay,setMoveDisplay]=useState<{moves:string[];done:number;active:number}>({moves:[],done:0,active:-1});
  const moveStrip=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const strip=moveStrip.current,active=strip?.querySelector<HTMLElement>('[aria-current="step"]');
    if(strip&&active)strip.scrollTop=active.offsetTop-strip.clientHeight/2+active.clientHeight/2;
  },[moveDisplay.active]);
  const [summary,setSummary]=useState<ReturnType<typeof transitionSummary>|null>(null);
  const [status,setStatus]=useState(round===moves.length?finalLabel:`Round ${round+1}`);
  wanted.current=round;
  useEffect(()=>{
    let disposed=false,p:TwistyPlayer|undefined,busy=false,settled=wanted.current;
    let raf=0,finish: (()=>void)|undefined;
    const prefix=(n:number)=>[setup,...moves.slice(0,n)].filter(Boolean).join(' ');
    void Promise.all([import('cubing/twisty'),import('cubing/alg')]).then(async ([{TwistyPlayer},{Alg}])=>{
      if(disposed)return;
      p=new TwistyPlayer({puzzle:'3x3x3',visualization:'3D',experimentalSetupAlg:prefix(settled),alg:'',background:'none',controlPanel:'none',backView:'none',hintFacelets:'none'});
      p.indexer='simple';
      p.style.width='100%';p.style.height='100%';host.current?.replaceChildren(p);
      // Cube3D defaults to translucent cubie bodies. Make the gap backing opaque.
      await p.experimentalCurrentThreeJSPuzzleObject().then(object=>{
        if(disposed)return;
        if('experimentalSetFoundationOpacity' in object) {
          (object as unknown as {experimentalSetFoundationOpacity:(opacity:number)=>void}).experimentalSetFoundationOpacity(1);
          p!.timestamp=0 as ExperimentalMillisecondTimestamp;
        }
      });
      if(disposed)return;
      const run=async()=>{
        if(busy||disposed||!p)return;
        busy=true;
        try {
          while(!disposed&&settled!==wanted.current){
            const target=wanted.current,from=settled,jump=Math.abs(target-from);
            const forward=moves.slice(Math.min(from,target),Math.max(from,target)).join(' ');
            const alg=target>from?new Alg(forward):new Alg(forward).invert();
            p.pause();p.experimentalSetupAlg=prefix(from);p.alg=alg;p.timestamp=0 as ExperimentalMillisecondTimestamp;
            const [range,indexer]=await Promise.all([p.experimentalModel.timeRange.get(),p.experimentalModel.indexer.get()]);
            const timeline=Array.from({length:indexer.numAnimatedLeaves()},(_,i)=>{
              const index=i as Parameters<typeof indexer.getAnimLeaf>[0];
              const start=indexer.indexToMoveStartTimestamp(index);
              return {label:indexer.getAnimLeaf(index)?.toString()||'',start,end:start+indexer.moveDuration(index)};
            });
            if(disposed)break;
            const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
            // A single round keeps each turn readable; longer jumps stay quick.
            const shortestMove=Math.min(...timeline.map(move=>move.end-move.start).filter(ms=>ms>0));
            const singleRoundDuration=Number.isFinite(shortestMove)
              ? Math.max(650,range.end*300/shortestMove)
              : 650;
            const duration=reduced?0:jump===1?singleRoundDuration:650;
            setSummary(transitionSummary(summaries,from,target));
            setMoveDisplay({moves:timeline.map(move=>move.label),done:0,active:-1});
            setStatus(`${from===moves.length?finalLabel:`Round ${from+1}`} → ${target===moves.length?finalLabel:target+1}${jump>1?' · accelerated':''}`);
            await new Promise<void>(resolve=>{
              finish=resolve;let start:number|undefined;
              const frame=(now:number)=>{
                if(disposed){resolve();return;}
                start??=now;const progress=duration?Math.min(1,(now-start)/duration):1;
                const timestamp=range.end*progress;
                p!.timestamp=timestamp as ExperimentalMillisecondTimestamp;
                const done=progress===1?timeline.length:timeline.filter(move=>move.end<=timestamp).length;
                const active=progress===1?-1:timeline.findIndex(move=>move.start<=timestamp&&timestamp<move.end);
                setMoveDisplay(previous=>previous.done===done&&previous.active===active?previous:{...previous,done,active});
                if(progress<1)raf=requestAnimationFrame(frame);else{finish=undefined;resolve();}
              };raf=requestAnimationFrame(frame);
            });
            settled=target;
          }
          if(!disposed)setStatus(settled===moves.length?finalLabel:`Round ${settled+1}`);
        } catch {if(!disposed){setStatus('Preview unavailable');setSummary(null);}}
        finally {busy=false;}
      };
      kick.current=()=>{void run();};kick.current();
    }).catch(()=>{if(!disposed)setStatus('Preview unavailable');});
    return()=>{disposed=true;kick.current=()=>{};cancelAnimationFrame(raf);finish?.();p?.pause();p?.remove();};
  },[setup,moves,summaries,finalLabel]);
  useEffect(()=>{kick.current();},[round]);
  return <aside className="round-preview" aria-label="Current round cube"><div className="round-preview-heading"><strong>Recorded cube</strong><small>Drag to rotate</small></div><div className="round-preview-cube" ref={host}/><div className="round-preview-status" role="status"><FlowText text={status}/></div>{moveDisplay.moves.length>0&&<div className="preview-move-panel"><div className="preview-move-legend"><span>Completed</span><span>Playing</span><span>Upcoming</span></div><div className="preview-move-strip" ref={moveStrip} aria-label="Moves in this transition">{moveDisplay.moves.map((move,i)=><span key={i} className={i<moveDisplay.done?'move-done':i===moveDisplay.active?'move-active':'move-pending'} aria-current={i===moveDisplay.active?'step':undefined} aria-label={`${move}: ${i<moveDisplay.done?'completed':i===moveDisplay.active?'playing':'upcoming'}`}>{move}</span>)}</div></div>}{summary&&<div className="preview-round-summary"><strong>{summary.title}</strong><p><FlowText text={summary.context}/></p>{'frame' in summary&&<small className="preview-summary-frame">{summary.frame}</small>}{summary.outcome&&<span><FlowText text={summary.outcome}/></span>}</div>}</aside>;
}
