import { FlowText } from './FlowArrow';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { TwistyPlayer, ExperimentalMillisecondTimestamp } from 'cubing/twisty';

type Props={onMove?:(index:number)=>void;onSettled?:(round:number)=>void;children?:ReactNode;setup:string;moves:string[];round:number;finalLabel?:string};
/** Plays recorded transitions only. The displayed state is the start of a round. */
export function RoundPreview({setup,moves,round,children,onMove,onSettled,finalLabel='Solved'}:Props) {
  const callbacks=useRef({onMove,onSettled});callbacks.current={onMove,onSettled};
  const host=useRef<HTMLDivElement>(null),wanted=useRef(round),kick=useRef(()=>{});
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

            await new Promise<void>(resolve=>{
              finish=resolve;let start:number|undefined;
              const frame=(now:number)=>{
                if(disposed){resolve();return;}
                start??=now;const progress=duration?Math.min(1,(now-start)/duration):1;
                const timestamp=range.end*progress;
                p!.timestamp=timestamp as ExperimentalMillisecondTimestamp;
                callbacks.current.onMove?.(progress===1?timeline.length:timeline.findIndex(move=>move.start<=timestamp&&timestamp<move.end));
                if(progress<1)raf=requestAnimationFrame(frame);else{finish=undefined;resolve();}
              };raf=requestAnimationFrame(frame);
            });
            settled=target;
            callbacks.current.onSettled?.(target);
          }
          if(!disposed)setStatus(settled===moves.length?finalLabel:`Round ${settled+1}`);
        } catch {if(!disposed){setStatus('Preview unavailable');}}
        finally {busy=false;}
      };
      kick.current=()=>{void run();};kick.current();
    }).catch(()=>{if(!disposed)setStatus('Preview unavailable');});
    return()=>{disposed=true;kick.current=()=>{};cancelAnimationFrame(raf);finish?.();p?.pause();p?.remove();};
  },[setup,moves,finalLabel]);
  useEffect(()=>{kick.current();},[round]);
  return <aside className="round-preview" aria-label="Current round cube"><div className="round-preview-heading"><strong>Recorded cube</strong><small>Drag to rotate</small></div><div className="round-preview-cube" ref={host}/><div className="round-preview-status" role="status"><FlowText text={status==='Preview unavailable'?status:round===moves.length?finalLabel:`Round ${round+1}`}/></div>{children}</aside>;
}
