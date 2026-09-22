// Offline fixture labelling, never imported by the live policy.
import { apply, solved, turns, pieces, hash } from '../../src/lib/cube';
import { preconditionObservation, liftRequirements } from '../../src/server/action-preconditions';
export async function makeFixtures(split:'development'|'validation',excluded:string[]=[]) {
  let seed=split==='development'?881153:933721;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed>>>8;};
  const used=new Set(excluded),result:any[]=[];
  const starts:Record<string,[string,string]>={
    'lift-bottom':['DF','D'],'lift-middle-right':['FR','F'],'lift-middle-left':['FL','F'],
    'stage-bottom-edge':['DF','F'],'flip-top-edge':['UF','F'],'flip-top-edge-left':['UF','F'],
  };
  const buckets=[['transfer','insert',10],['transfer','align',10],['landing','execute',8],['landing','clear',8],['landing','lower',4]] as const;
  for(const [family,expected,n] of buckets) {
    let found=0;
    for(let attempt=0;attempt<10000&&found<n;attempt++) {
      const scramble=Array.from({length:3+random()%20},()=>turns[random()%18]).join(' ');
      const state=await apply(await solved(),scramble),key=hash(state);
      if(used.has(key))continue;
      let accepted=false;
      for(const p of pieces(state).filter(p=>p.kind==='edge'&&p.stickers.yellow)) {
        for(const front of ['F','R','B','L']) {
          for(const routine of family==='transfer'?['daisy-to-cross']:Object.keys(liftRequirements)) {
            const observation=preconditionObservation(state,p.piece,front,routine),t=observation.target;
            if(family==='transfer'&&(t.position!=='UF'||t.yellowDirection!=='U'))continue;
            if(family==='landing'&&(t.position!==starts[routine][0]||t.yellowDirection!==starts[routine][1]))continue;
            const ready=family==='transfer'?t.sideMatchesCenter:observation.selectedRoutine.requiredFreeSlots.every(s=>!observation.yellowUpPetals[s]);
            const answer=family==='transfer'?(ready?'insert':'align'):ready?'execute':t.layer==='top'?'lower':'clear';
            if(answer!==expected)continue;
            result.push({id:`${split}-${result.length+1}`,family,expected,ready:ready?'yes':'no',stateHash:key,scramble,state,target:p.piece,front,routine,observation});
            used.add(key);found++;accepted=true;break;
          }
          if(accepted)break;
        }
        if(accepted)break;
      }
    }
    if(found!==n)throw new Error(`Missing ${family}/${expected}`);
  }
  return result;
}
