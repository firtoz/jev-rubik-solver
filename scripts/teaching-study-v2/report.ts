import {readFileSync,writeFileSync} from 'node:fs';
import {label} from '../less-help-scene/fixtures';
import {hash} from '../../src/lib/cube';
const dir='experiments/teaching-study-v2';
const integration=JSON.parse(readFileSync(`${dir}/integration-results.json`,'utf8'));
if(integration.rows.length!==10||integration.rows.some((r:any)=>typeof r.correct!=='boolean'))throw Error('Integration unfinished');
const audit=JSON.parse(readFileSync(`${dir}/verification.json`,'utf8'));
if(!audit.reports.some((r:any)=>r.phase==='integration'&&r.total===10))throw Error('Verify first');
const details=[];const cache=new Map();
for(const r of integration.rows){let firstError:any=null;const seen=new Set();let repeats=0;
 for(const [index,c] of r.cycles.entries()){
  const key=hash(c.before);if(seen.has(key))repeats++;seen.add(key);
  if(!cache.has(key))cache.set(key,await label(c.before));const gold=cache.get(key)[c.answer.target];
  if(!firstError&&(!gold?.eligible||gold.intention!==c.answer.intention||!gold.accepted.includes(c.answer.action)))firstError={cycle:index+1,kind:!gold?.eligible?'target':gold.intention!==c.answer.intention?'intention':'routine/frame',expectedIntention:gold?.intention,chosen:c.answer};
 }
 details.push({id:r.id,success:r.correct,requests:r.exchanges.length,cycles:r.cycles.length,noOps:r.cycles.filter((c:any)=>!c.alg.trim()).length,repeatedStates:repeats,firstError,terminalError:r.error??null});
}
writeFileSync(`${dir}/failure-analysis.json`,JSON.stringify(details,null,2));
const successes=details.filter(r=>r.success).length;
const text=`# Minimum teaching study: two-round result

The final candidate passed **39/40 fresh complete decisions** and **${successes}/10 autonomous middle-layer runs**. Required gates were 36/40 and 9/10. ${successes>=9?'Both sample gates passed.':'The integration reliability target remains unmet. No further development rounds are authorized by this study.'}

| Development teaching | Round1 | Round2 |
|---|---:|---:|
| General effects |14/20|14/20|
| Contrasting examples |18/20|20/20|
| Applicability conditions |16/20|20/20|

Round1 examples passed 38/40 held-out decisions but only 2/10 integrations. Round2 used retired integration failures in development, narrowed intention observations and teaching, and removed repeated examples from routine selection. These simultaneous changes and different evaluation samples prevent causal attribution to one wording change. Round2 fresh decision coverage: done 4, extract 6, align 24, insert 6. The lone decision failure selected insertion correctly but picked the wrong side at front B.

## Assistance supplied

Code supplies legal cube mechanics, positions, centers, current layer and solved flags for target selection. JEV chooses the target, compares colors, chooses the operation family, setup destination and turn, insertion front and routine. Its answers pass unchanged. Code routes on its selected family and executes a fixed routine. No runtime outcome simulation, applicability verdict, best-branch selection or tactical repair. The program checks termination and limits.

All arms receive expert-written generic routine effects and U cycles. The final candidate additionally receives four explicit case-to-intention examples (upper matched/unmatched; middle matched/unmatched). Those examples are compact applicability teaching, not evidence of independently discovering cube strategy. This study identifies a tested teaching tradeoff, not the globally least possible assistance.

## Autonomous results

| Start | Solved | Requests | Cycles | No-op actions | Revisited states | First incorrect decision |
|---|---|---:|---:|---:|---:|---|
${details.map(r=>`|${r.id}|${r.success?'yes':'no'}|${r.requests}|${r.cycles}|${r.noOps}|${r.repeatedStates}|${r.firstError?`${r.firstError.kind} at cycle ${r.firstError.cycle}`:'none'}|`).join('\n')}

Each attempt allows 160 requests, 200 face turns and 120 seconds, without retries or intervention. Every capped/failed attempt remains in the denominator. Complete cubes and observed scenes are fresh against retired fixture/reached states; finite local situations may repeat. Starts are legal routine-generated middle-layer cases with a solved bottom, not a random full-cube reliability sample.

## Cost and reproduction

Cumulative round1+round2 ledger: **${audit.ledger.requests} requests, $${audit.ledger.cost.toFixed(8)}** including retained reservations, within the $0.25 study cap. Global cap remains $9. No changes to the proven solver.

Policies and exact source snapshots: [round1](../experiments/teaching-study-v1/sources.json), [round2](../experiments/teaching-study-v2/sources.json). Protocols, fixtures, every request/native response and results live alongside them. Offline verification: \`bun scripts/teaching-study/verify.ts\` and \`bun scripts/teaching-study-v2/verify.ts\`. These reconstruct requests and chosen actions, replay cubing transformations and independently check raw middle/bottom piece predicates. \`bun scripts/teaching-study-v2/report.ts\` regenerates this report. Live runners use immutable started markers to prevent accidental repeat spending; do not delete them to reproduce runs.

## Article lessons and limits

- A model can score well on sampled one-step tasks and still repeatedly fail in autonomous execution. Test the states its own actions produce.
- Keep relevant observations local, and distinguish preparation from execution. The results support this as a useful design hypothesis, not an isolated causal finding.
- Examples encode expertise. Declare their content rather than claiming the model inferred all strategy from generic physics.
- A correct intention still needs a correct reference frame and routine. Measure the whole chain and retain recoverable mistakes as well as final failures.
- These middle-layer results do not replace the original full-cube evaluation or establish a general method for every complex problem.
`;
writeFileSync('docs/minimum-teaching-results.md',text);console.log(JSON.stringify({successes,total:10,details,ledger:audit.ledger}));
