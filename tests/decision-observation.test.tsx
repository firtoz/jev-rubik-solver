import { expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { DecisionObservation } from '../src/components/DecisionObservation';
import recording from '../public/recordings/brain-v3-flow.json';

test('all recorded decision observations render, including whole-cube reference targets',()=>{
  let wholeViews=0;
  for(const round of recording.steps)for(const exchange of round.exchanges){
    const state=exchange.request.state as any;
    const html=renderToStaticMarkup(<DecisionObservation state={state} kind={Object.keys(exchange.request.questions)[0]} cube={round.before}/>);
    expect(html.length).toBeGreaterThan(0);
    if(Object.values(state.referenceViews||{}).some((view:any)=>view.target==='whole')){
      wholeViews++;
      expect(html).toContain('whole');
      expect(html).toContain('side Rows');
    }
  }
  expect(wholeViews).toBeGreaterThan(0);
});
