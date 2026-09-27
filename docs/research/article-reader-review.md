# Article review for first-time readers

Editorial walkthrough of `/how-it-works`, using three knowledge profiles. This is an inspection of the article and its sources, not usability research with actual participants.

| Reader | Questions the article must answer | Where the revised article answers them |
| --- | --- | --- |
| Cube expert, new to JEV | What is JEV? What is sent and returned? Is “teaching” training? Who selects the case and executes the turns? | Opening “The model” explains the state/question/options API and structured choice response, links the official API, and distinguishes prompt/reference design from training weights. The decision path and miniature F2L example show the handoff. |
| JEV user, new to cubes | What are edges, corners and routines? Why can solving one piece disturb another? What do F2L, PLL and move counts mean? | Opening “The puzzle”; expandable notation/stage guide; inline F2L and PLL expansions; plain-language extraction explanation; four-turn example and half-turn metric. The stage guide is optional for experienced cubers. |
| Expert in both | What method is actually implemented? What assistance is supplied? Which changes produced which results? How strong is the evidence? | Hybrid-method description, staged rather than one-look orientation, full routine libraries, no live case matching/search/fallback, explicit predicate-check caveat. Results identify full-menu versus grouped-menu plus preparation changes and distinguish separate final sets from paired stage tests. Appendix preserves prompts, failure traces, limits, timing caveats and accounting. |

Removed the unexplained “Previous policy” label. Before the results table, the article defines **Full-menu solver** and **Grouped-menu solver**, including the latter's preparation change. Both use F2L/PLL routines. The recording instead compares **Single turns** with **Beginner routines**. A version map explains why the appendix also contains 99/100 and 100/100 results under a 1,000-turn ceiling. These are not scores from the final 100-turn comparison.

The main narrative introduces the problem, explains the API and cube basics, shows the decision method and one illustrative case, compares named systems, and closes with transferable experimental practice. Detailed historical work remains in the appendix. This avoids requiring readers to know the conversation or internal version names.

Evidence checks:
- Official JEV API reference inspected for state, questions, choice and probability response semantics. Link included at first introduction.
- `experiments/f2l-efficiency-v1/catalog.json` pair-03 checked: corner UFR/yellow-R, edge UF/green-F, algorithm U' F' U F. Main example is explicitly illustrative, not a fabricated live answer or explanation.
- `experiments/brain-full-v3-final/RESULTS.md` confirms the mapped 100/100 result used 1,000 turns.
- Final and historical reports retain the 98/100 and 97/100 metrics; article distinguishes cost, speed and reliability evidence.
- Read the server-rendered main article from beginning through the appendix map. Checked the absence of “Previous policy”, duplicate anchors and em dashes. Production build and TypeScript passed.
- Browser attachment timed out, so visual layout and real user comprehension are not claimed verified. Existing responsive layout plus the new two-column orientation block collapses to one column below 700px.

No policy, model requests, budget or experiment records were changed for this editorial goal. No JEV API calls were made.
