import {expect,test} from 'bun:test';
import recording from '../public/recordings/brain-v3-flow.json';
import {roundSummary,transitionSummary} from '../src/lib/round-summary';
test('round summaries describe recorded outcomes and distinguish rewind from execution',()=>{
 for(const round of recording.steps){const summary=roundSummary(round);expect(summary.title.length).toBeGreaterThan(0);expect(summary.outcome).not.toContain('Cube updated');}
 expect(roundSummary(recording.steps[16])).toMatchObject({title:'Insert yellow–green–orange corner',context:'Directly above its home.',outcome:'Corner solved · cross preserved'});
 expect(roundSummary(recording.steps.at(-1)! ).outcome).toBe('Cube solved');
 expect(transitionSummary(recording.steps,17,16).title).toBe('Rewind 1 round');
 expect(transitionSummary(recording.steps,0,5).title).toBe('Advance 5 rounds');
});

import fresh from '../public/recordings/brain-v3-fresh-flow.json';
test('captions identify the recorded pattern and measured result',()=>{
 expect(roundSummary(fresh.steps[28])).toMatchObject({title:'Right middle-layer insertion',context:'Green matches front; red belongs right.'});
 expect(roundSummary(fresh.steps[37])).toMatchObject({title:'Sune · preparation',outcome:'0 → 1 oriented corners'});
 expect(roundSummary(fresh.steps[38])).toMatchObject({title:'Sune · finish orientation',outcome:'1 → 4 oriented corners',frame:'In the chosen reference frame · front L'});
 expect(roundSummary(fresh.steps[40])).toMatchObject({title:'Ua-perm · cycle three edges',outcome:'Cube solved'});
 const mismatch=structuredClone(fresh.steps[37]);
 const state:any=mismatch.exchanges.at(-1)!.request.state;state.corners.ULF='F';
 expect(roundSummary(mismatch).context).toContain('does not match');
});
