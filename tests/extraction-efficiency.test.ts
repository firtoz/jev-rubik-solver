import {test,expect} from 'bun:test';
import {decide} from '../scripts/extraction-efficiency-v1/sequential';
test('wrong model-selected slot is passed downstream without correction',async()=>{
 const requests:any[]=[];
 const choice=await decide('URB','BR','edge',async r=>{
  requests.push(r);const key=r.questions.slot?'slot':'extraction',answer=key==='slot'?'F':'F-forward';
  return {model:'jev-1.13.0',answers:{[key]:{type:'choice',choice:answer,probabilities:{[answer]:1},confidence:1}},usage:{input_tokens:0,output_tokens:0}};
 });
 expect(choice).toBe('F-forward');expect(requests[1].state.selectedSlot).toBe('F');
 expect(Object.keys(requests[1].questions.extraction.criteria)).toEqual(['F-forward','F-reverse']);
});
test('integrated controller executes the chosen reverse opening and keeps the partner upper',async()=>{
 const {readFileSync}=await import('node:fs');
 const {decide:controller}=await import('../scripts/extraction-efficiency-v1/controller');
 const {apply,pieces}=await import('../src/lib/cube');
 const f=JSON.parse(readFileSync('experiments/extraction-efficiency-v1/fixtures.json','utf8')).find((f:any)=>f.id==='edge-1-10');
 const answers=['FR','F','continue','extract-edge','R','R-reverse'];let n=0;
 const result=await controller(f.state,async r=>{
  const key=Object.keys(r.questions)[0],choice=answers[n++];
  return {model:'jev-1.13.0',answers:{[key]:{type:'choice',choice,probabilities:{[choice]:1},confidence:1}},usage:{input_tokens:0,output_tokens:0}};
 });
 expect(n).toBe(6);expect(result.alg).toBe("B U' B'");
 const ps=pieces(await apply(f.state,result.alg));
 expect(ps.find(p=>p.piece==='DRF')!.position.includes('U')).toBe(true);
 expect(ps.find(p=>p.piece==='FR')!.position.includes('U')).toBe(true);
});
