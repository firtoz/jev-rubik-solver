import {expect,test} from 'bun:test';
import {renderToStaticMarkup} from 'react-dom/server';
import {readFileSync,existsSync} from 'node:fs';
import {cube3x3x3} from 'cubing/puzzles';
import {Alg} from 'cubing/alg';
import {DecisionObservation} from '../src/components/DecisionObservation';
import {roundSummary} from '../src/lib/round-summary';
const file='public/recordings/brain-v3-fresh-flow.json';
test.skipIf(!existsSync(file))('fresh solve renders every observation and replays forward and backward',async()=>{
 const r=JSON.parse(readFileSync(file,'utf8'));
 const puzzle=await cube3x3x3.kpuzzle();
 let pattern=puzzle.defaultPattern().applyAlg(r.previewSetup);
 for(const step of r.steps){
  expect(pattern.patternData).toEqual(step.before);
  for(const e of step.exchanges){
   expect(renderToStaticMarkup(<DecisionObservation state={e.request.state} kind={Object.keys(e.request.questions)[0]} cube={step.before}/>)).toContain('decision-observation');
   expect(Object.keys(e).sort()).toEqual(['cost','elapsedMs','nativeResponse','request','response']);
  }
  expect(roundSummary(step).title.length).toBeGreaterThan(0);
  const prior=pattern;
  pattern=pattern.applyAlg(step.alg);
  expect(pattern.patternData).toEqual(step.after);
  expect(pattern.applyAlg(new Alg(step.alg).invert()).patternData).toEqual(prior.patternData);
 }
 expect(pattern.patternData).toEqual(puzzle.defaultPattern().patternData);
 const start=puzzle.defaultPattern().applyAlg(r.previewSetup),moves=r.steps.map((s:any)=>s.alg);
 for(const [from,to]of [[0,5],[17,18],[r.steps.length-1,0],[r.steps.length-1,r.steps.length],[0,r.steps.length],[r.steps.length,0]]){
  const current=start.applyAlg(moves.slice(0,from).join(' '));
  const forwards=new Alg(moves.slice(Math.min(from,to),Math.max(from,to)).join(' '));
  expect(current.applyAlg(to>from?forwards:forwards.invert()).patternData).toEqual(to===r.steps.length?r.steps.at(-1).after:r.steps[to].before);
 }
});
