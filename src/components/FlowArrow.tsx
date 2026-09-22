/** Decorative directional icon. Link and button text supplies the accessible name. */
export function FlowArrow({direction='right'}:{direction?:'right'|'down'|'external'}) {
  return <svg className={`flow-arrow flow-arrow-${direction}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>;
}

/** Format display-only captions without changing recorded text or source data. */
export function FlowText({text}:{text:string}) {
  return <>{text.split('→').map((part,i)=><span key={i}>{i>0&&<><FlowArrow/><span className="flow-sr-only"> to </span></>}{part}</span>)}</>;
}
