import {test,expect} from 'bun:test';
import {decide} from '../scripts/less-help-routed/policy';
import {solved} from '../src/lib/cube';
test('routed policy follows wrong model intention and destination without repair',async()=>{
 const seen:any[]=[];const result=await decide(await solved(),'FR','routed',async req=>{seen.push(req);const key=Object.keys(req.questions)[0];if(key.startsWith('match_'))return Object.fromEntries(Object.keys(req.questions).map(k=>[k,'different']));if(key==='intention')return {intention:'align'};if(key==='destination')return {destination:'B'};return {turn:'U2'};});
 expect(result).toEqual({intention:'align',destination:'B',action:'U2'});
 expect(seen[1].state.target.stickers.every((s:any)=>s.modelReportedMatch==='different')).toBe(true);
 expect(seen.at(-1).state.requiredSide).toBe('back');
});
test('leave comes only from model done choice',async()=>{
 let count=0;const r=await decide(await solved(),'FR','routed',async req=>{count++;return Object.keys(req.questions)[0]==='intention'?{intention:'done'}:Object.fromEntries(Object.keys(req.questions).map(k=>[k,'same']));});expect(r.action).toBe('leave');expect(count).toBe(2);
});
