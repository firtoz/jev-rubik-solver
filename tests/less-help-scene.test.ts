import {test,expect} from 'bun:test';
import {apply,solved,hash,facts} from '../src/lib/cube';
import {scene,actions,decide} from '../scripts/less-help-scene/policy';
import fixtures from '../experiments/less-help-scene-v1/screen-fixtures.json';
test('scene fixtures have distinct observed scenes, legal starts and mechanically accepted actions',async()=>{
 expect(new Set(fixtures.map(c=>JSON.stringify(scene(c.state)))).size).toBe(20);
 for(const c of fixtures){expect(hash(await apply(await solved(),c.scramble))).toBe(hash(c.state));expect(facts(c.state).firstLayer).toBe(true);
 for(const gold of Object.values(c.labels) as any[])for(const action of gold.accepted)expect(facts(await apply(c.state,actions[action])).firstLayer).toBe(true);
 }
});
test('wrong target and local model answers are not repaired',async()=>{
 const calls:any[]=[];const result=await decide(await solved(),async req=>{calls.push(req);const keys=Object.keys(req.questions);if(keys[0]==='target')return {target:'BL'};if(keys[0].startsWith('match_'))return Object.fromEntries(keys.map(k=>[k,'different']));if(keys[0]==='intention')return {intention:'done'};throw Error('unexpected');});
 expect(result).toEqual({target:'BL',intention:'done',action:'leave'});expect(calls[1].state).toEqual({});expect(calls[2].state).not.toHaveProperty('edges');
});
