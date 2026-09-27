import { DecisionMetadata } from './article/ReplayGoal';
import { preparationLabel } from '../lib/request-label';
import { algorithmLabel,algorithmLabels } from '../lib/algorithm-labels';
import { roundSummary } from '../lib/round-summary';
import { RoundPreview } from './RoundPreview';
import { FlowArrow } from './FlowArrow';
import { CubeNet } from './RoundCube';
import { facts } from '../lib/cube';
import { ExecutionChanges } from './ExecutionChanges';
import { DecisionObservation, RoutineDefinition } from './DecisionObservation';
import { ObservationSnapshot } from './ObservationSnapshot';
import { useEffect, useMemo, useRef, useState } from 'react';

type Exchange = { request: any; response: any; nativeResponse: any; elapsedMs: number; cost: number };
type Cycle = { before: any; after: any; pendingPlan: any; nextPendingPlan: any; decision: any; alg: string; recovery?: string; transportRetries?: any[]; exchanges: Exchange[] };
type Recording = { previewSetup: string; id: string; status: string; turns: number; elapsedMs: number; source: string; policyDigest: string; steps: Cycle[] };
const titles: Record<string, string> = { goal: 'Choose the goal', gatherTarget: 'Choose conditional targets', target: 'Choose a target and intention', situation: 'Read the selected piece and choose a frame', reference: 'Choose the reference frame', front: 'Choose the reference front', group: 'Recognise the pattern family', readiness: 'Check landing space', preparation: 'Choose preparation', turn: 'Choose a turn', slot: 'Choose the extraction slot', extraction: 'Choose extraction', routine: 'Choose a learned routine', decision: 'Check whether to execute or prepare', freeSlot: 'Choose an empty landing space', setup: 'Choose the setup turn', operation: 'Choose the operation', plan: 'Recheck the remembered plan', recovery: 'Choose recovery', intention: 'Choose the intention' };

function Value({ value, depth = 0, expanded = false }: { value: any; depth?: number; expanded?: boolean }) {
  if (value === null || value === undefined) return <span className="wire-muted">{value === null ? 'null' : 'not recorded'}</span>;
  if (typeof value === 'boolean') return <span className={`wire-flag ${value ? 'yes' : ''}`}>{value ? '✓ true' : '○ false'}</span>;
  if (typeof value !== 'object') return <span className="wire-value">{String(value)}</span>;
  const entries = Object.entries(value);
  if (!entries.length) return <code>{Array.isArray(value) ? '[]' : '{}'}</code>;
  if (Array.isArray(value) && value.every(v => v === null || typeof v !== 'object')) return <span className="wire-chips">{value.map((v, i) => <code key={i}>{JSON.stringify(v)}</code>)}</span>;
  const content = <dl className="wire-values">{entries.map(([key, v]) => <div key={key}><dt>{key}</dt><dd><Value value={v} depth={depth + 1} expanded={expanded} /></dd></div>)}</dl>;
  return depth > 1 && !expanded ? <details className="wire-nested"><summary>{Array.isArray(value) ? `${entries.length} records` : entries.map(([k]) => k).join(' · ')}</summary>{content}</details> : content;
}
function Raw({ title, value }: { title: string; value: any }) { return <details className="wire-raw"><summary>{title}</summary><pre>{JSON.stringify(value, null, 2)}</pre></details>; }
function choices(e: Exchange) { return Object.fromEntries(Object.entries(e.response.answers).map(([k, a]: any) => [k, a.choice])); }

// These annotations describe policy wiring. The actual payloads below remain unmodified.
function wiring(e: Exchange, previous: Exchange[]) {
  const q = e.request.questions;
  const prior = Object.assign({}, ...previous.map(choices));
  if (q.goal) return 'Code measures completed structures and uncollected edges. JEV compares those facts with the fixed goal definitions in this request.';
  if (q.gatherTarget) return `goal = ${prior.goal} → state.selectedGoal. Both conditional targets are asked independently. Only the answer for the selected goal is used.`;
  if (q.target && prior.goal === 'f2l') return 'JEV receives measured corner-edge pairs and chooses which pair to work on next.';
  if (q.target) return `goal = ${prior.goal} → state.stage. Code selects the observation vocabulary for that goal. Intention questions are independent of target selection; the chosen target’s intention is used afterward.`;
  if (q.situation) return `target = ${prior.gatherTarget && prior.goal === 'daisy' ? prior.gatherTarget : prior.transferTarget} → code looks up that piece’s currentPosition and yellowDirection. Situation and reference are answered independently from those two fields.`;
  if (q.plan) return 'The current target and reference are JEV choices. Code adds current geometry and the remembered routine’s static requirements. JEV decides whether all requirements still hold.';
  if (q.group && e.request.state.corners) return 'Code reports the top corners. JEV identifies their permutation family, which selects the next routine menu.';
  if (q.routine && e.request.state.previousCornerGroup) return 'The recorded corner-group answer selects the routine menu. JEV receives measured top edges and chooses the permutation routine.';
  if (q.group) return 'Code supplies the selected corner’s measured position and sticker directions. JEV chooses which F2L reference family to inspect next.';
  if (q.front) return 'JEV chooses the reference front from the selected pair’s home slot. Code then maps the pair observations into that local frame.';
  if (q.preparation) return 'The next preparation check receives measured positions and the preceding model choices. Code follows those choices without correcting them.';
  if (q.routine && e.request.state?.corner) return 'JEV’s group answer selects the reference menu. Both pieces’ positions and sticker directions are passed into the routine question unchanged.';
  if (q.routine) return `reference = ${prior.reference} → code translates the selected target and protected slots into that view. The situation label is not copied into this request; JEV receives the actual geometry and fixed routine descriptions.`;
  if (q.decision) return 'The selected target, reference and routine determine which observation is built. Code attaches the routine’s fixed requirements and current slot occupancy. JEV chooses execution or preparation.';
  if (q.freeSlot) return 'JEV requested clearance. Code lists currently empty slots; JEV chooses which empty space to move.';
  if (q.setup) return 'Earlier choices determine the setup question. Code supplies current and required locations, or empty-slot patterns. JEV chooses the turn using the fixed movement reference.';
  if (q.reference) return 'The selected target and its intention choose the reference question. Code supplies current coordinate views. JEV chooses the view to use.';
  if (q.operation) return `reference = ${prior.reference} → code supplies the chosen local view. The selected target’s intention and fixed skill menu guide JEV’s operation choice.`;
  if (q.recovery) return 'Code reports a repeated state or an unexecutable plan. JEV chooses the recovery response; code does not select a better action.';
  return 'The recorded request below is the complete body sent at this point in the chain.';
}
function preparation(name: string, value: any, exchange: Exchange) {
  if (name === 'currentPosition' && exchange.request.questions.setup) return 'Read the current location of the object this setup moves: the chosen empty space or the transfer target. Front/right/back/left words are a readable form of the same top-slot coordinates.';
  if (name === 'target' && value === null) return 'No target is fixed in this observation yet. The target question below lets JEV choose one.';
  const recipes: Record<string, string> = {
    completed: 'Decode every edge and corner, then count petals and test whether each named structure is complete. These are facts about the current cube.',
    uncollectedYellowEdges: 'Count yellow edges whose yellow sticker does not point up and which are not already solved in the bottom layer.',
    observation: 'Translate current pieces into named positions and sticker directions. Include the fixed frame and the recorded target/recent-action memory.',
    checks: 'For each yellow edge, check whether yellow faces up and whether the piece is solved in its bottom home. These yes/no values are measured by code.',
    counts: 'Count the measured petal and solved-bottom flags.',
    selectedGoal: 'Copy the goal chosen by JEV earlier in this round.',
    stage: 'Use the goal selected by JEV to choose this request’s observation vocabulary.',
    target: 'Look up the model-selected piece in the current cube. When this is an object, report its geometry in the selected reference frame.',
    currentPosition: 'Look up the current slot of the piece selected by the earlier target answer.',
    yellowDirection: 'Read the face toward which that selected piece’s yellow sticker points.',
    protectedBottomSlots: 'List already solved bottom edges, with their slots renamed into JEV’s chosen reference frame.',
    selectedRoutine: 'Look up the fixed description, sequence and requirements of the selected routine. Code does not simulate candidate outcomes.',
    yellowUpPetals: 'For each top edge slot in this reference frame, check whether its upward sticker is yellow.',
    centers: 'Report center colors in the selected coordinate frame.',
    frame: 'Describe the coordinate convention used by this request. A selected front renames directions without moving the cube.',
    recentActions: 'Copy the recent executed actions from the recording. Do not include the original scramble.',
    previousGoal: 'Read the prior round’s goal from recorded memory. It is not an instruction to keep that goal.',
    previousTarget: 'Read the prior target from recorded memory.',
    excludedTarget: 'Carry the target exclusion from JEV’s recovery choice, or null if no exclusion was requested.',
    previouslyRejectedByModel: 'Copy routine IDs that JEV rejected earlier in this round.',
    chosenIntention: 'Use the intention answer for the target JEV selected. Other conditional intention answers are not used.',
    intent: 'Carry the selected target’s model-chosen intention into this reference question.',
    referenceViews: 'Compute descriptions of the same current cube under each possible reference front. JEV chooses a view; no move is applied.',
    stagePieces: 'Describe pieces belonging to the model-selected goal, including their current positions, destinations and stickers.',
    goal: 'Attach the static goal description for the stage selected by JEV.',
    freeSlots: 'List top slots without yellow-up petals. JEV chooses which empty space to move.',
    requiredPosition: 'Use the destination required by the selected task: the chosen routine’s landing slot, or the side center matching the transfer target’s color.',
    requiredFreeSlots: 'Read landing requirements from the fixed reference for the selected routine.',
    pending: 'Combine the remembered target, front and routine with that routine’s static starting requirements.',
    current: 'Combine the current model-selected target and front with measured position, sticker direction and protected slots.',
    whiteUpCount: 'Count top corners whose white stickers point up.',
    corners: 'Map each top corner position in the selected frame to its white sticker direction.',
    whiteUpPositions: 'List the positions of relevant pieces whose white stickers point up.',
    sideRows: 'Read side-facing sticker colors of the relevant pieces in this coordinate frame.',
    previouslyTriedFromThisState: 'Attach recorded actions and before/after facts from earlier visits to this exact cube state.',
  };
  return recipes[name] || `Attach the recorded ${name} value from this request’s observation or controller context. The exact value is shown below.`;
}
function answerUse(name: string, e: Exchange, previous: Exchange[]) {
  const prior=Object.assign({},...previous.map(choices)), own=choices(e);
  if(name==='gatherTarget'||name==='transferTarget') {
    const used=name===(prior.goal==='daisy'?'gatherTarget':'transferTarget');
    return {used,text:used?'Used for '+prior.goal:'Unused for this goal'};
  }
  if(name.startsWith('intent_')) {
    const used=name===`intent_${own.target}`;
    return {used,text:used?'Used for '+own.target:'Unused for this target'};
  }
  if(name==='situation')return {used:false,text:'Recorded classification; not passed forward'};
  return null;
}
function Handoff({e,previous,next}:{e:Exchange;previous:Exchange[];next?:Exchange}) {
  const own=choices(e),all=Object.assign({},...previous.map(choices),own);
  const mappings:Record<string,string>={goal:'selected goal',gatherTarget:'selected piece',transferTarget:'selected piece',target:'selected piece',reference:'local front',routine:'selected routine',decision:'execution / preparation',freeSlot:'space to move',setup:'setup turn',operation:'operation',intention:'target intention',plan:'plan continuation',recovery:'recovery action'};
  return <><div className="flow-handoff-values">{Object.entries(own).filter(([name])=>answerUse(name,e,previous)?.used!==false).map(([name,value])=><span key={name}><code>{name}: {String(value)}</code><FlowArrow/><b>{name.startsWith('intent_')?'target intention':mappings[name]||name}</b></span>)}</div>
    {e.request.questions.situation&&<small>Code reads the selected piece in front {all.reference}; the situation label is not copied.</small>}
    <details><summary>How code prepares the next input</summary><p>{next?wiring(next,[...previous,e]):'Code translates the recorded action into fixed-face turns, executes it, and measures the resulting cube.'}</p></details></>;
}
function ExecutionComparison({cycle}:{cycle:Cycle}) {
  const planned=cycle.decision?.early?.plannedRoutine, executed=cycle.decision?.skill;
  return <div className="execution-comparison">
    <div className="execution-action"><span>JEV chose <b>{algorithmLabels[executed]?algorithmLabel(executed):(cycle.decision?.intent || executed)}</b></span>{planned&&planned!==executed&&<span>Planned <code title={planned}>{algorithmLabel(planned)}</code> <FlowArrow/> code maps this choice to <code title={executed}>{algorithmLabel(executed)}</code></span>}<span>Front <b>{cycle.decision?.front}</b> <FlowArrow/> fixed-face turns <code>{cycle.alg}</code></span></div>
    <ExecutionChanges key={JSON.stringify(cycle.before)} before={cycle.before} after={cycle.after} target={cycle.decision?.target}/> 
  </div>;
}
function RequestNode({ exchange: e, index, previous, next, cube }: { exchange: Exchange; index: number; previous: Exchange[]; next?: Exchange; cube: any }) {
  const key = Object.keys(e.request.questions)[0];
  const native = e.nativeResponse || e.response;
  return <section className="wire-step" id={`wire-request-${index}`} aria-label={preparationLabel(e.request) || titles[key] || key}>
    <h2 className="request-section-title"><span>{index+1}</span>{preparationLabel(e.request) || titles[key] || key}</h2>
    {e.request.questions.goal && e.request.state.completed && <ObservationSnapshot state={cube} observation={e.request.state} />}
    {!(e.request.questions.goal && e.request.state.completed) && <section className="wire-preparation">
      <h3>What JEV sees for this decision</h3>
      <DecisionObservation state={e.request.state} kind={key} cube={cube}/>
      <details><summary>Where these fields come from</summary><dl>{Object.entries(e.request.state).map(([name,value])=><div key={name}><dt><code>{name}</code></dt><dd>{preparation(name,value,e)}</dd></div>)}</dl></details>
    </section>}
    <div className="wire-exchange">
      <section className="wire-sent">
        <h3>What we ask JEV</h3>
        <p className="wire-caption">Exact question text · <code>model: {e.request.model}</code></p>
        {Object.entries(e.request.questions).map(([name,question]:any)=><section className="wire-question-card compact-question" key={name}>
          <h4>{name} <small>type: {question.type}</small></h4>
          <div className="wire-prompt-text"><code>instructions</code><Value value={question.instructions} expanded/></div>
          <div className="wire-prompt-text"><code>criteria</code><dl className="wire-options compact-criteria">{Object.entries(question.criteria || {}).map(([option,definition])=><div key={option}><dt>{option}{algorithmLabels[option]&&<small className="algorithm-alias">{algorithmLabel(option)}</small>}</dt><dd>{typeof definition==='string' && definition.startsWith('{') ? <RoutineDefinition text={definition}/> : <Value value={definition} expanded/>}</dd></div>)}</dl></div>
          {Object.entries(question).filter(([k])=>!['type','instructions','criteria'].includes(k)).map(([k,v])=><div key={k}><code>{k}</code><Value value={v} expanded/></div>)}
        </section>)}
        {Object.entries(e.request).filter(([k])=>!['model','state','questions'].includes(k)).map(([k,v])=><div key={k}><code>{k}</code><Value value={v} expanded/></div>)}
        <Raw title="Complete request JSON (observations + questions)" value={e.request}/>
        <a className="wire-caption" href="https://docs.typesafe.ai/api#choice" target="_blank" rel="noreferrer">JEV choice request reference <FlowArrow direction="external"/></a>
      </section>
      <section className="wire-output">
        <h3>What JEV returns</h3>
        <div className="response-cards">{Object.entries(native.answers).map(([name,answer]:any)=><div className="response-card" key={name}>
          <div className="response-heading"><div><code>{name}</code><strong>{algorithmLabel(answer.choice)}</strong>{algorithmLabels[answer.choice]&&<small className="algorithm-id">Recorded ID: <code>{answer.choice}</code></small>}{answerUse(name,e,previous)&&<small className={`answer-use ${answerUse(name,e,previous)!.used?'used':'unused'}`}>{answerUse(name,e,previous)!.text}</small>}</div><span>Confidence <b>{answer.confidence == null ? 'not supplied' : `${Number((answer.confidence*100).toFixed(2))}%`}</b></span></div>
          <div className="response-bars" aria-label={`${name} option probabilities`}>{Object.entries(answer.probabilities || {}).sort(([,a],[,b])=>Number(b)-Number(a)).map(([option,p]:any)=><div key={option} className={option===answer.choice?'is-chosen':''}>
            <span title={option}>{option}</span><progress max={1} value={p} aria-label={`${option} probability`} title={String(p)}/><code>{Number((p*100).toFixed(2))}%</code>
          </div>)}</div>
          {Object.entries(answer).filter(([k])=>!['type','choice','probabilities','confidence'].includes(k)).map(([k,v])=><div key={k}><code>{k}</code><Value value={v}/></div>)}
          <small className="response-type">type: {answer.type}</small>
        </div>)}</div>
        <div className="response-stats"><code>{native.model}</code><span>{native.usage?.input_tokens?.toLocaleString()} input tokens</span><span>{native.usage?.output_tokens?.toLocaleString()} output tokens</span><span>{Math.round(e.elapsedMs)} ms</span><span>estimated $ {e.cost.toFixed(7)}</span></div>
        {Object.entries(native).filter(([k])=>!['model','answers','usage'].includes(k)).map(([k,v])=><div key={k}><code>{k}</code><Value value={v}/></div>)}
        
        <Raw title="Complete native response JSON" value={native}/>

      </section>
    </div>
    <div className="wire-handoff wire-next"><FlowArrow direction="down"/><div><h3>What happens next</h3><Handoff e={e} previous={previous} next={next}/><a href={next?`#wire-request-${index+1}`:'#wire-execution'}>{next?`Follow to request ${index+2}`:'See the executed action'} <FlowArrow direction="down"/></a></div></div>
  </section>;
}

export function VerifiedFlow({recordingUrl='/recordings/article-best-flow.json',initialRound,initialRequest=1}:{recordingUrl?:string;initialRound?:number;initialRequest?:number}) {
  const [recording, setRecording] = useState<Recording | null>(null);
  const previewMoves=useMemo(()=>recording?.steps.map(step=>step.alg)||[],[recording]);
  const [error, setError] = useState('');
  const [cycleIndex, setCycleIndex] = useState(0);
  const [advancePlayback,setAdvancePlayback]=useState<{from:number;to:number;phase:'fading'|'moves'|'requests'|'decision-out';request:number;move:number}|null>(null);
  useEffect(()=>{
    if(advancePlayback?.phase!=='fading')return;
    const timer=setTimeout(()=>{
      setCycleIndex(advancePlayback.to);
      setAdvancePlayback(p=>p?{...p,phase:'moves'}:p);
    },matchMedia('(prefers-reduced-motion: reduce)').matches?0:220);
    return()=>clearTimeout(timer);
  },[advancePlayback?.phase]);
  useEffect(()=>{
    if(advancePlayback?.phase!=='decision-out')return;
    const timer=setTimeout(()=>setAdvancePlayback(null),matchMedia('(prefers-reduced-motion: reduce)').matches?0:200);
    return()=>clearTimeout(timer);
  },[advancePlayback?.phase]);
  const playbackRef=useRef(advancePlayback);playbackRef.current=advancePlayback;
  useEffect(()=>{
    if(!advancePlayback||advancePlayback.phase!=='requests'||!recording)return;
    const exchanges=recording.steps[advancePlayback.to]?.exchanges||[];
    const index=advancePlayback.request;
    const timer=setTimeout(()=>{
      if(index>=exchanges.length){setAdvancePlayback(p=>p?{...p,phase:'decision-out'}:p);setActiveStep('wire-execution');}
      else setAdvancePlayback(p=>p?{...p,request:index+1}:p);
    },index<exchanges.length?Math.max(0,exchanges[index].elapsedMs):450);
    return()=>clearTimeout(timer);
  },[advancePlayback?.phase,advancePlayback?.request,recording]);
  useEffect(()=>{
    if(!advancePlayback)return;
    const list=document.querySelector<HTMLElement>('.round-preview .round-step-tabs');
    const selected=list?.querySelector<HTMLElement>('[aria-current="step"]');
    if(list&&selected){const delta=selected.getBoundingClientRect().top-list.getBoundingClientRect().top;list.scrollTo({top:list.scrollTop+delta-list.clientHeight/2+selected.clientHeight/2,behavior:'smooth'});}
  },[advancePlayback?.phase,advancePlayback?.request]);
  const [activeStep,setActiveStep]=useState('wire-request-0');
  const navigation=useRef<HTMLDivElement>(null);
  const scrollAnimation=useRef(0);
  useEffect(()=>{
    const cancel=()=>cancelAnimationFrame(scrollAnimation.current);
    const onKey=(event:KeyboardEvent)=>{if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(event.key))cancel();};
    window.addEventListener('wheel',cancel,{passive:true});
    window.addEventListener('touchstart',cancel,{passive:true});
    window.addEventListener('keydown',onKey);
    return()=>{cancel();window.removeEventListener('wheel',cancel);window.removeEventListener('touchstart',cancel);window.removeEventListener('keydown',onKey);};
  },[cycleIndex]);
  const scrollToRequest=(target:HTMLElement)=>{
    cancelAnimationFrame(scrollAnimation.current);
    const start=window.scrollY;
    const margin=parseFloat(getComputedStyle(target).scrollMarginTop)||0;
    const end=Math.max(0,Math.min(document.documentElement.scrollHeight-window.innerHeight,start+target.getBoundingClientRect().top-margin));
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){window.scrollTo({top:end,behavior:'instant'});return;}
    const distance=end-start,duration=Math.min(1100,600+Math.abs(distance)*.08),began=performance.now();
    const frame=(now:number)=>{
      const t=Math.min(1,(now-began)/duration),eased=t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
      window.scrollTo({top:start+distance*eased,behavior:'instant'});
      if(t<1)scrollAnimation.current=requestAnimationFrame(frame);
    };
    scrollAnimation.current=requestAnimationFrame(frame);
  };
  useEffect(()=>{
    if(!recording||!navigation.current)return;
    const bar=navigation.current;
    let frame=0;
    const update=()=>{
      frame=0;
      const height=bar.getBoundingClientRect().height;
      bar.closest<HTMLElement>('.wire-board')?.style.setProperty('--flow-nav-height',`${height}px`);
      const sections=Array.from(document.querySelectorAll<HTMLElement>('.wire-step, #wire-execution'));
      let current=sections[0]?.id || 'wire-request-0';
      for(const section of sections)if(section.getBoundingClientRect().top<=height+36)current=section.id;
      setActiveStep(current);
    };
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
    const observer=new ResizeObserver(schedule);observer.observe(bar);
    window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);
    update();
    return()=>{observer.disconnect();cancelAnimationFrame(frame);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);};
  },[recording,cycleIndex]);
  useEffect(() => {
    const controller = new AbortController();
    fetch(recordingUrl, { signal: controller.signal }).then(r => { if (!r.ok) throw new Error('Could not load saved recording'); return r.json(); }).then(data=>{setRecording(data);const round=Math.max(0,Math.min(data.steps.length-1,(initialRound ?? 1)-1));setCycleIndex(round);setAdvancePlayback(initialRound ? null : {from:0,to:0,phase:'requests',request:0,move:-1});}).catch(e => { if(e.name !== 'AbortError') setError(e.message); });
    return () => controller.abort();
  }, [recordingUrl]);
  useEffect(()=>{
    if(!recording || !initialRound)return;
    const index=Math.max(0,Math.min(recording.steps[cycleIndex]?.exchanges.length-1,initialRequest-1));
    const frame=requestAnimationFrame(()=>document.getElementById(`wire-request-${index}`)?.scrollIntoView({block:'start'}));
    return()=>cancelAnimationFrame(frame);
  },[recording,initialRound,initialRequest]);
  if (!recording) return <main className="board wire-board"><h1>Inside one real solve</h1><p role="status">{error || 'Loading saved requests and responses…'}</p></main>;
  const terminal=cycleIndex===recording.steps.length;
  const finalLabel=recording.status==='solved'?'Solved':'Final state';
  const cycle = recording.steps[Math.min(cycleIndex,recording.steps.length-1)];
  const displayCycle=advancePlayback?.phase==='fading'?recording.steps[advancePlayback.from]:cycle;
  const decisionRound=advancePlayback?.phase==='fading'?advancePlayback.from:cycleIndex;
  const completedChoices=Object.assign({},...cycle.exchanges.slice(0,advancePlayback?.phase==='requests'?advancePlayback.request:cycle.exchanges.length).map(choices));
  const executingMoves=advancePlayback?.phase==='fading'||advancePlayback?.phase==='moves';
  const moveRound=executingMoves?advancePlayback!.from:cycleIndex-1;
  const partialDecision=advancePlayback?.phase==='requests'&&advancePlayback.request<cycle.exchanges.length;
  const highlightedStep=advancePlayback?(advancePlayback.phase!=='requests'?'wire-execution':!terminal&&advancePlayback.request<cycle.exchanges.length?`wire-request-${advancePlayback.request}`:'wire-execution'):activeStep;
  const decisionSummary=roundSummary(displayCycle);
  const allChoices = Object.assign({}, ...cycle.exchanges.map(choices));
  return <main className="board wire-board has-round-preview" onClick={event=>{
    const link=(event.target as Element).closest<HTMLAnchorElement>('a[href^="#wire-"]');
    if(!link||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
    const id=link.getAttribute('href')!.slice(1),target=document.getElementById(id);
    if(target){event.preventDefault();history.replaceState(null,'',`#${id}`);scrollToRequest(target);}
  }}>
    <RoundPreview setup={recording.previewSetup} moves={previewMoves} round={advancePlayback?.phase==='fading'?advancePlayback.to:cycleIndex} finalLabel={finalLabel} onMove={move=>{if(playbackRef.current?.phase==='moves'||playbackRef.current?.phase==='fading')setAdvancePlayback(p=>p&&p.move!==move?{...p,move}:p);}} onSettled={round=>{if((playbackRef.current?.phase==='moves'||playbackRef.current?.phase==='fading')&&playbackRef.current.to===round){setCycleIndex(round);setAdvancePlayback(p=>p?{...p,phase:'requests',request:0}:p);}}}>
      {moveRound>=0&&<div className="preview-executing" aria-label={executingMoves?'Executing recorded turns':'Previous round’s recorded turns'}>
        <small>Round {moveRound+1} · moves</small>
        <div className="preview-decision-moves">{recording.steps[moveRound].alg.trim().split(/\s+/).filter(Boolean).map((move,i)=><code key={i} className={!executingMoves||i<advancePlayback!.move?'move-done':i===advancePlayback!.move?'move-active':'move-pending'} aria-current={executingMoves&&i===advancePlayback!.move?'step':undefined}>{move}</code>)}</div>
      </div>}
      <nav className="round-step-tabs" aria-label="Requests in this round" aria-busy={!!advancePlayback} data-exiting={advancePlayback?.phase==='fading'||undefined}>
      {!terminal&&!executingMoves&&<small className="request-round-label">Round {cycleIndex+1}</small>}
      {!terminal&&cycle.exchanges.map((e,i)=>{
        if(advancePlayback&&(advancePlayback.phase==='moves'||(advancePlayback.phase==='requests'&&i>advancePlayback.request)))return null;
        const running=advancePlayback?.phase==='requests'&&i===advancePlayback.request;
        return <a key={`${cycleIndex}-${i}`} className={running?'step-running':undefined} href={`#wire-request-${i}`} aria-current={highlightedStep===`wire-request-${i}`?'step':undefined}>
          {running&&<i className="step-progress" style={{animationDuration:`${Math.max(0,e.elapsedMs)}ms`}} aria-hidden="true"/>}
          <span>{i+1}</span><span className="step-label">{preparationLabel(e.request) || titles[Object.keys(e.request.questions)[0]] || 'Request'}</span>
          {!running&&<time className="step-duration" title="Recorded request duration">{e.elapsedMs>=1000?`${(e.elapsedMs/1000).toFixed(1)}s`:`${Math.round(e.elapsedMs)}ms`}</time>}
        </a>;
      })}
      {(!advancePlayback||advancePlayback.phase==='decision-out'||advancePlayback.phase==='fading'||(advancePlayback.phase==='requests'&&(terminal||advancePlayback.request>=cycle.exchanges.length)))&&<a key={`execute-${cycleIndex}`} href="#wire-execution" aria-current={highlightedStep==='wire-execution'?'step':undefined}>{terminal?finalLabel:'Execute'}</a>}
    </nav>
      {!terminal&&advancePlayback?.phase!=='moves'&&<section key={decisionRound} className="preview-decision" data-exiting={advancePlayback?.phase==='fading'||undefined} aria-label="This round’s decision">
        {partialDecision?<DecisionMetadata state={{round:cycleIndex,goal:completedChoices.goal,target:completedChoices.target??(completedChoices.goal==='daisy'?completedChoices.gatherTarget:completedChoices.goal==='cross'?completedChoices.transferTarget:undefined),answers:completedChoices}}/>:<>
          <small>JEV’s decision · round {decisionRound+1}</small>
          <div className="preview-objective">{decisionSummary.objective}</div>
          <strong>{decisionSummary.title}</strong>
          <p>{decisionSummary.context}</p>
          {decisionSummary.frame&&<small>{decisionSummary.frame}</small>}
          <div className="preview-decision-moves" aria-label="Chosen fixed-face turns">{displayCycle.alg.trim().split(/\s+/).filter(Boolean).map((move,i)=><code key={i}>{move}</code>)}</div>
          {decisionSummary.outcome&&<small>Recorded result: {decisionSummary.outcome}</small>}
        </>}
        <button className="preview-advance" disabled={!!advancePlayback} onClick={()=>{setAdvancePlayback({from:cycleIndex,to:cycleIndex+1,phase:'fading',request:0,move:-1});window.scrollTo({top:0,behavior:'smooth'});}}>Advance <FlowArrow/></button>
      </section>}
    </RoundPreview>
    <h1>Inside one real solve</h1>
    <div className="flow-overview">{['Observations','Questions','Answers','Execution','Fresh observations'].map((label,i)=><span key={label}>{i>0&&<FlowArrow/>}{label}</span>)}</div><details className="flow-reading-key"><summary>Reading this recording</summary><p>Each round ends with one executed action, which can contain several turns. Colored diagrams explain the recorded inputs; JEV receives the text and values. Bars show option probabilities. Confidence is the provider’s separate statistic, not solve success. Request times and estimated costs come from our app.</p><p>U up · D down · F front · B back · R right · L left. A chosen reference renames the faces without turning the cube.</p></details>
    <p className="wire-caption">Grouped-menu solver · {recording.id} · {recording.steps.length} rounds · {recording.turns} face turns · {(recording.elapsedMs / 1000).toFixed(1)} seconds. Fresh recording from the article’s original starting state. Every request and response below belongs to that same solve. Viewing it makes no JEV calls.</p>
    <div className="flow-sticky-navigation" ref={navigation}>
    <nav className="wire-toolbar round-navigation" aria-label="Decision round navigation">
      <div className="round-control-group">
        <button className="round-arrow" aria-label="Previous round" title="Previous round" disabled={!cycleIndex} onClick={() => {setAdvancePlayback(null);setCycleIndex(i => i - 1);}}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg></button>
        <div className="round-select-wrap"><select aria-label="Decision round" value={cycleIndex} onChange={e => {setAdvancePlayback(null);setCycleIndex(Number(e.target.value));}}>{recording.steps.map((s,i) => <option key={i} value={i}>Round {i+1} / {recording.steps.length}</option>)}<option value={recording.steps.length}>{finalLabel}</option></select><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 10 4 4 4-4"/></svg></div>
        <button className="round-arrow" aria-label="Next round" title="Next round" disabled={terminal} onClick={() => {setAdvancePlayback(null);setCycleIndex(i => i + 1);}}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 6 6 6-6 6"/></svg></button>
      </div>
      <span className="round-request-count"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 6h12M8 12h12M8 18h12"/><circle cx="3" cy="6" r=".7"/><circle cx="3" cy="12" r=".7"/><circle cx="3" cy="18" r=".7"/></svg>{terminal?'Final state':`${cycle.exchanges.length} requests`}</span>
    </nav>


    </div>
    <div key={cycleIndex}>{!terminal&&cycle.exchanges.map((e,i) => <RequestNode key={i} exchange={e} index={i} previous={cycle.exchanges.slice(0,i)} next={cycle.exchanges[i+1]} cube={cycle.before}/>)}</div>
    <section id="wire-execution" className="wire-execution">
      <div className="wire-handoff"><FlowArrow direction="down"/><p>Code executes the chosen routine or setup in the chosen frame. A routine can contain multiple face turns.</p></div>
      <h2>{terminal?`${finalLabel} · after round ${recording.steps.length}`:'Execute and observe'}</h2><ExecutionComparison cycle={cycle}/><details className="execution-record"><summary>Recorded choices and controller details</summary>
      <div className="wire-execution-grid"><div><h3>Latest answer for each question</h3><Value value={allChoices}/></div><div><h3>Controller’s recorded execution</h3><Value value={{goal:cycle.decision?.goal,target:cycle.decision?.target,front:cycle.decision?.front,routine:cycle.decision?.skill,moves:cycle.alg,nextPendingPlan:cycle.nextPendingPlan}}/><Raw title="Complete recorded decision" value={cycle.decision}/></div><div><h3>New cube state</h3><p>Mechanics applies <code>{cycle.alg}</code>. The next cycle recomputes observations from this resulting state.</p><Raw title="Exact state after execution" value={cycle.after}/></div></div></details>
    {cycleIndex < recording.steps.length-1 ? <button className="execution-next" onClick={()=>{setCycleIndex(i=>i+1);window.scrollTo({top:0,behavior:'smooth'});}}>Continue to round {cycleIndex+2} <FlowArrow/></button> : !terminal ? <button className="execution-next" onClick={()=>setCycleIndex(recording.steps.length)}>Play final moves <FlowArrow/></button> : <strong className="execution-next">{recording.status==='solved'?'Solved, independently verified.':'End of recording.'}</strong>}
    </section>
    <footer className="wire-footer"><p>Saved source: <code>{recording.source}</code></p><details><summary>Frozen policy digest</summary><code>{recording.policyDigest}</code></details><a href={recordingUrl} download>Download this complete recording</a></footer>
  </main>;
}
