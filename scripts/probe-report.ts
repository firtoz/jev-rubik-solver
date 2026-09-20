import { writeFileSync } from 'node:fs';
const dir = 'experiments/decision-probe-v1';
const data = await Bun.file(dir + '/results.json').json();
const esc = (v: unknown) =>
  String(v).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );
const groups: Record<string, any[]> = {};
for (const r of data.results) (groups[r.fixture] ??= []).push(r);
const rows = Object.entries(groups)
  .map(
    ([name, results]) =>
      `<tr><th>${esc(name)}</th>${['broad', 'structured']
        .map((style) => {
          const r = results!.find((r) => r.style === style);
          return `<td>${esc(r.choice)} <span class="${r.accepted ? 'pass' : 'fail'}">${r.accepted ? '✓' : '✕'}</span><small>Confidence ${Math.round(r.confidence * 100)}%</small></td>`;
        })
        .join('')}</tr>`,
  )
  .join('');
const details = (data.results as any[])
  .map(
    (r) =>
      `<article><h3>${esc(r.fixture)} · ${esc(r.style)}</h3><p>Selected <b>${esc(r.choice)}</b>. ${esc(r.rationale)}</p><p>Provider confidence: ${r.confidence}; ${r.response.usage.input_tokens} input tokens; ${Math.round(r.elapsedMs)} ms; $${r.cost.toFixed(8)}.</p>${Object.entries(
        r.response.answers,
      )
        .map(
          ([key, a]: any) =>
            `<h4>${esc(key)}</h4>${Object.entries(a.probabilities)
              .map(
                ([option, p]: any) =>
                  `<div class="prob"><span>${esc(option)}</span><meter min="0" max="1" value="${p}"></meter><span>${Math.round(p * 100)}%</span></div>`,
              )
              .join('')}`,
        )
        .join(
          '',
        )}<details><summary>Exact request</summary><pre>${esc(JSON.stringify(r.request, null, 2))}</pre></details><details><summary>Native response</summary><pre>${esc(JSON.stringify(r.response, null, 2))}</pre></details><details><summary>Offline action effects</summary><pre>${esc(JSON.stringify(r.changes, null, 2))}</pre></details></article>`,
  )
  .join('');
writeFileSync(
  dir + '/report.html',
  `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>JEV · Six decision probes</title><style>body{font:16px/1.6 system-ui;background:#131714;color:#e4eadd;max-width:1050px;margin:40px auto;padding:0 24px}h1,h2,h3{line-height:1.2}small{display:block;color:#a9b5a4}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:14px;border-bottom:1px solid #394237}article{border:1px solid #394237;padding:24px;margin:24px 0;border-radius:12px}.pass{color:#b1e889}.fail{color:#ff9a85}pre{overflow:auto;font-size:12px;background:#090c09;padding:16px;max-height:550px}summary{cursor:pointer;padding:10px 0}.prob{display:flex;gap:12px;align-items:center}.prob span:first-child{width:150px}meter{width:220px}b{color:#d3ee9d}</style><h1>Six situations. Twelve requests.</h1><p>Frozen development probe · jev-1.13.0 · No retries or autonomous rollouts</p><p><b>Additional estimated API cost: $${(data.budgetAfter.usage - data.budgetBefore.usage).toFixed(8)}</b>. Both formats met 5/6 fixture rubrics. These are individual decisions, not cube solves.</p><table><thead><tr><th>Situation</th><th>Broad prompt</th><th>Structured prompt</th></tr></thead><tbody>${rows}</tbody></table><h2>What this tells us</h2><p>The structured batch correctly located/classified all seven target pieces, but still failed to choose the alignment action. Target selection improved only narrowly (52% versus 45%). Both formats stopped for inspection on the recovery case: that passes the recovery rubric but does not demonstrate autonomous progress.</p><p>The pair uses identical states, goals and action menus. The broad baseline is a new controlled prompt, not a replay of the old five-call runner. Structured input adds semantic facts and an operation contract, plus independent diagnostic questions. These changes are bundled, so this test cannot attribute differences to one feature. Diagnostic answers are not available to the action question in the same request.</p><p>Confidence is the provider's distribution statistic, not a measured probability of solving. Temporary-disruption testing supplies the remaining move explicitly and tests continuation of a recorded operation, not invention of that operation. Fixture construction, accepted answers and future outcomes are excluded from requests.</p><h2>Next experiment</h2><p>Isolate alignment: hold the state and eight-option menu constant, ask for immediate intention first (align / insert / extract / reconsider), then feed that answer into the operation question. Compare against the frozen one-call result. Test rotated counterparts before trying rollouts. No further live calls have been made.</p><h2>Inspect every decision</h2>${details}</html>`,
);
console.log(dir + '/report.html');
