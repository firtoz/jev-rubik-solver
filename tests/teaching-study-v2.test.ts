import {test,expect} from 'bun:test';
import {decide,variants} from '../scripts/teaching-study-v2/policy';
import {solved} from '../src/lib/cube';
test('all teaching arms use identical observed inputs and propagate deliberately wrong choices',async()=>{
 const captures:any[][]=[];
 for(const v of variants){const calls:any[]=[];const r=await decide(await solved(),v,async req=>{calls.push(req);const k=Object.keys(req.questions)[0];if(k==='target')return {target:'FR'};if(k.startsWith('match_'))return Object.fromEntries(Object.keys(req.questions).map(k=>[k,'different']));if(k==='intention')return {intention:'extract'};return {action:'middle-left@B'};});expect(r.action).toBe('middle-left@B');captures.push(calls);}
 for(let i=0;i<captures[0].length;i++){expect(captures[1][i].state).toEqual(captures[0][i].state);expect(captures[2][i].state).toEqual(captures[0][i].state);}
 expect(captures[2][2].state.sideStickers.every((s:any)=>s.comparison==='different')).toBe(true);
 expect(captures[0][2].questions.intention.criteria.insert).not.toContain('currentLayer=');
 expect(captures[2][2].questions.intention.criteria.insert).toContain('upper layer and its side sticker matches');
});
