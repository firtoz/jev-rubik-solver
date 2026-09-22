import {readFileSync,writeFileSync} from 'node:fs';
const dir='experiments/goal-readable-v1';
const data=JSON.parse(readFileSync(`${dir}/results.json`,'utf8'));
if(data.rows.length!==128||data.rows.some((r:any)=>r.correct===undefined))throw new Error('Comparison incomplete');
const median=(numbers:number[])=>{const s=[...numbers].sort((a,b)=>a-b);return s.length%2?s[Math.floor(s.length/2)]:(s[s.length/2-1]+s[s.length/2])/2;};
const variants=['fields','sentences'];
const scores=variants.map(variant=>{
 const rows=data.rows.filter((r:any)=>r.variant===variant),ok=rows.filter((r:any)=>r.exchange);
 return {variant,correct:rows.filter((r:any)=>r.correct).length,total:rows.length,errors:rows.filter((r:any)=>r.error).length,batches:['batch-a','batch-b'].map(phase=>({phase,correct:rows.filter((r:any)=>r.phase===phase&&r.correct).length,total:32})),inputTokens:ok.reduce((s:number,r:any)=>s+r.exchange.response.usage.input_tokens,0),estimatedCost:ok.reduce((s:number,r:any)=>s+r.exchange.cost,0),medianMs:median(ok.map((r:any)=>r.exchange.elapsedMs)),summedMs:ok.reduce((s:number,r:any)=>s+r.exchange.elapsedMs,0),failures:rows.filter((r:any)=>!r.correct).map((r:any)=>({id:r.id,expected:r.expected,actual:r.actual,error:r.error}))};
});
const paired={bothCorrect:0,fieldsOnly:0,sentencesOnly:0,bothWrong:0};
for(const a of data.rows.filter((r:any)=>r.variant==='fields')){const b=data.rows.find((r:any)=>r.variant==='sentences'&&r.id===a.id);paired[a.correct?(b.correct?'bothCorrect':'fieldsOnly'):(b.correct?'sentencesOnly':'bothWrong')]++;}
const report={scores,paired,usage:data.usage,scope:'64 reused legal cube states, 63 distinct inputs. Same facts, same teaching, same criteria. Synthetic memory. No new held-out claims, no solver change.',representative:data.rows.filter((r:any)=>r.id==='batch-a-1').map((r:any)=>({variant:r.variant,expected:r.expected,request:r.exchange?.request,response:r.exchange?.nativeResponse}))};
writeFileSync(`${dir}/summary.json`,JSON.stringify(report,null,2));
console.log(JSON.stringify({scores,paired,usage:data.usage},null,2));
