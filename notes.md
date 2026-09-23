# Teaching JEV: working notes

## Goal

The main deliverable is an article that helps other people tackle complex problems with JEV. The Rubik’s cube is the worked example and source of evidence, rather than the end goal. Readers should leave able to identify useful observations, break a task into decisions, supply learned routines, measure the parts and test the complete process.

The article should teach a reusable experimental method, not promise that JEV can solve any problem. Show what worked, what failed, how much help we supplied and where the evidence stops.

Start by asking: **What would a practiced player notice, remember and decide here?** They may track a goal, a target piece, a recognizable case and a familiar routine. They sometimes reason about individual moves, but need not reconstruct every turn of a learned algorithm.

## What we tried

- **Individual turns:** the primitive policy chose single turns with goal and target support. It failed three matched full scrambles and a later fresh run within 500 requests.
- **Decomposed skills:** JEV chose goals, targets, intentions, reference orientations and supplied beginner algorithms through focused questions. It solved 99/100 unseen cubes, with one HTTP 503 counted as failure. Code supplied substantial interpreted observations.
- **Removing algorithms and predicting turns:** the initial 20-case probe got both next position and sticker direction right in only 4/20 cases. Neutral names, coordinates and generic rotation formulas did not make this reliable.
- **Smaller recognition questions:** “Does this turn affect this piece?” passed 20/20 fresh validation cases. A face-diagram approach predicted position correctly in 16/20 fresh cases. Two wording rounds produced no meaningful improvement.

## What actually helped

- Use meaningful field names before adding prose. In the first-goal comparison, structured facts and equivalent English tied 64/64 on reused labelled cases; English used 9.1% more input tokens. This supports keeping that request compact, not a general preference across all layers.
- Give each question a clear job and the observations needed for that job. A middle-edge extraction question improved when it focused on the occupied slot instead of confusing that slot with the piece’s destination.
- Ask dependent questions sequentially and pass on the actual model answer. A later question should know the chosen goal, target and intention.
- Supply a stable reference of terminology and learned procedures. Selecting and correctly applying a known algorithm is a legitimate capability to measure.
- Measure individual questions before long integrations. Keep exact requests and failures to locate where the chain breaks.
- Extra questions are not automatically better. One position-reading variant recognized positions correctly but its following reference question chose F in all 20 cases.

## Current strategy

**Observe → recognize progress → choose a goal → inspect a target → recognize the case → choose a setup and learned procedure → execute → check again.**

For example: “The bottom layer is complete. This middle edge is in the wrong slot. I need to extract it while preserving the bottom layer. This familiar routine does that when held in this orientation.”

Treat supplied algorithms as the analogue of practiced routines or muscle memory. The interesting work is establishing that their conditions hold, choosing among them and checking their effects. Atomic-move prediction was an informative detour, not a prerequisite.

The frozen brain v3 policy has now solved 100/100 fresh full random-state cubes, independently verified. Reliable code observations are part of the accepted boundary. JEV selects the action and explicitly checks whether a remembered routine still applies after a setup. See [final results](experiments/brain-full-v3-final/RESULTS.md).

## Boundary between code and JEV

Code owns cube mechanics, faithful observations, counts, recognized patterns, completed structures, execution, recording and offline scoring. JEV owns the goal, target, tactical interpretation, reference, setup, routine and recovery. Reporting a completed layer is permitted; prescribing its next action is not.

Do not supply a computed case label or recommended action and count JEV repeating it as recognition. Do not correct intermediate model answers, rank simulated outcomes or silently fall back to a solver. A static teaching reference may explain what a case means and which routine applies; JEV must connect that reference to the current observations.

## How we iterate

Keep a baseline. Compare 3–4 nearby variants on the same 20 distinct development inputs, using bounded parallel runs. Carry forward useful gains; after two rounds without improvement, change representation or decomposition. Treat small score gains as provisional. Freeze the selected wording and check fresh cases before integration.

Test a component both with correct earlier inputs supplied and with real earlier JEV answers. Preserve every failed case. If validation failures guide tuning, use new validation cases afterward.

For a fair broad-request versus decomposed-request comparison, give both the same observations, algorithm reference and available actions. The primitive-versus-skills demo changes the action vocabulary too, so its WIN/FAIL labels do not isolate the benefit of decomposition.

Detailed evidence: [results](docs/results.md), [request coverage](docs/request-coverage.md), and [reasoning experiments](docs/reasoning-experiments.md).

## What each experiment should contribute to the article

- A clear question about teaching JEV, with an example input and output.
- Why we chose that decomposition, ideally connected to what a practiced person notices or remembers.
- A fair comparison, the result and the decision it led to.
- A lesson readers can try in another domain, with limits stated plainly.

Organize the article around those lessons. Keep a short account of useful failures; put exhaustive logs in supporting records. Prefer experiments that resolve an uncertainty in the method over spending on a better cube score alone. Explain both a reusable workflow and one concrete transfer example, such as document routing, without presenting that untested example as a demonstrated success.

## First-layer recognition result

We tested raw face grids without completion flags on 20 balanced development cases. Direct recognition scored 14/20. A checklist plus overall answer in one request scored 12/20, despite all 100 individual region checks being correct. Passing those checks into a separate conclusion request scored 20/20.

A second round varied the top two approaches three ways. Explicitly naming the inspection scope improved the direct version to 19/20; sequential variants stayed at 20/20. On 20 fresh balanced cases, the frozen sequential baseline and scope-focused direct comparator both scored 20/20. The direct version uses half as many requests. This small controlled suite supports this component, not overall solve reliability.

Lesson: clarify what to inspect and what to ignore. If one answer must depend on other answers, pass them into a subsequent request explicitly. Do not assume asking several questions in one call creates a reasoning chain. Retain the cheaper approach as a candidate alongside the decomposed pipeline, rather than assuming more calls must win.

## Article notebook: keep collecting transferable lessons

For each round, record the hypothesis, the meaningful request change, an exact illustrative failure or success, the measured result, the next decision and the limits. Keep this short; link the detailed evidence rather than copying the full experiment log. Distinguish observed behavior from guesses about why the model behaved that way.

Useful lessons from first-layer recognition:

- **Specify scope, including what to ignore.** Explicitly excluding cells outside the bottom layer improved direct recognition from 14/20 to 19/20 on development cases. A possible transfer example is inspecting only the relevant fields of a document; that example remains untested.
- **Separate questions do not automatically share conclusions.** The same-call checklist got all 100 region assessments correct, yet its overall answer was wrong in eight cases. Show the actual all-yes checks followed by an overall no in the article. A dependent second request passed the checks forward explicitly.
- **Keep a cheap baseline alive.** Both the sequential approach and the improved direct comparator passed 20/20 fresh cases. The direct version used half as many requests. Decomposition is a design option to measure, not an automatic upgrade.
- **Define what counts as success.** A uniform bottom face is insufficient: neighboring side stickers must also match their centers. Deliberately include superficially convincing failures in labelled tests.
- **Small validation results have a scope.** These legal, controlled fixtures establish a useful component result; they do not establish robustness across all cube states or a complete solving loop.

First-layer tournament: 320 requests, $0.01310064 estimated cost. Evidence: experiments/first-layer-development/README.md and the saved development/validation rounds. Both notes and the article now include these findings.


## Recognition to goal: the next boundary

On 20 development cubes balanced across four early-goal categories, direct selection scored 8/20. A four-checkpoint recognition call followed by goal selection scored 7/20. One question referred to a definition in another independent question: fixing that context defect raised the chain to 14/20. Preserve the initial failures as evidence of request-design mistakes.

Smaller region checks → progress assessment → goal selection scored 17/20, with 79/80 progress flags correct. Two failures came after entirely correct progress flags. Replaying only the goal question with cached model flags scored 18/20 with the original grids, 16/20 without grids and 14/20 with a shorter reference too. The unchanged baseline’s 17→18 is repeat variation, not a gain from tuning.

Frozen regional chain: **19/20 fresh goals**, compared with **7/20 direct**. Its one failure misread a blue D edge as matching the yellow center, then carried that mistake into a premature corners goal. No intermediate correction. The 20 validation states are unique and separate from development, but use the same controlled families. No live solved-state cases or detailed last-layer decisions were tested.

Article lessons: make every independent question self-contained; narrow recognition to visible facts; test recognition and downstream decisions separately; measure whether a summary can replace original evidence before removing it. An earlier component’s perfect small score does not automatically transfer to broader concepts. Next: a bounded integration with actual recognized progress and goal selection, keeping the old solver as a comparator. Study cost: 360 requests, $0.01989288. Full evidence: experiments/progress-goal-development/README.md. Article updated with the exact failed chain.


## First recognition-to-action integration

Six paired diagnostic attempts: three setups needing cross, corners or middle repair, each with supplied-fact goal selection and the frozen regional chain. Same downstream skill policy, no retries or recovery, 60 requests/200 turns/two minutes per attempt. Baseline completed 3/3 tasks (two solved, one valid last-layer handoff); regional completed 1/3 (middle case solved). 114 requests, $0.008074206. All recorded moves independently replayed. Production policy unchanged.

Failures: cross-region misreading caused premature corner work; a correct cross assessment still led to the wrong cross goal; after building a full daisy, the chain chose daisy again and hit the existing completed-target abstention. That last failure exposed an evaluator/reference gap: allowing either daisy or cross whenever cross=false ignores whether the daisy is already complete. The earlier 19/20 is valid only against that coarse label and must not be presented as executable-goal reliability.

Article lesson: test the states your own actions create, and check whether your success labels capture useful progress. A high component score can conceal a missing transition. Preserve scores and describe the gap rather than quietly relabelling past results. Next: a bounded recognition/goal tournament for incomplete daisy, full daisy, partial transfer and complete cross, plus goal contradictions with correct progress. Use these failures for development and fresh states for validation. No more live calls this round. Evidence: experiments/progress-integration-v1/README.md.


## Daisy transition: make the useful summary explicit

We narrowed the lesson to the daisy-first method and labelled four situations: incomplete daisy, full daisy, partial transfer and completed cross with unfinished corners (five each). The choices describe that taught method, not every valid cube-solving approach. Literal sticker fields are permitted observation formatting; no matches or counts were supplied in the live chain.

Development: direct 12/20; full-grid checks then goal 11/20; focused sticker fields then goal 13/20. Both recognition variants got all 160 checks right. Supplying golden checks to the final question separately scored 12/20, confirming a downstream problem in these cases.

Second round reused the focused variant’s actual recorded checks, unchanged. Explicit option conditions scored 18/20. Asking JEV to count petals and solved bottom edges first scored 20/20 with both tested goal wordings; all counts were right. We chose the shorter wording. Fresh complete pipelines: direct 13/20, checks-only 18/20, counts chain 20/20. Both recognition pipelines got 160/160 checks, and both counts were right in every count-chain case. Checks-only’s two failures prematurely chose transfer with missing petals.

Transferable lesson: an intermediate answer can be correct yet inconvenient for the next decision. Ask what compact summary a person would use. Here JEV-produced counts were more usable than eight correct flags. Earlier context removal hurt a different handoff, so this is a measured representation choice rather than a general rule to remove context. We changed representation and prompt together, so we cannot attribute the gain to counting alone.

Scope: fresh states share controlled generator families; incomplete daisies have two or three petals; no later stages or autonomous moves tested. The next experiment is bounded integration of this daisy/cross component with JEV-owned routing, not automatic promotion into the full solver. Preserve earlier failures and coarse scores. 340 requests, $0.0121674 estimated cost, no retries. Evidence: experiments/daisy-transition-development/README.md. Article now includes the full recorded three-call example.


## Daisy integration: correct transitions, one capped trajectory

Frozen checks → model counts → goal, then the existing assisted skill executor. Four diagnostic development starts (incomplete/full daisy, partial transfer, earlier failed R). Each capped at 60 requests/200 turns/two minutes; no retry or recovery. Three verified cross completions, one request-capped incomplete attempt. 140 requests, $0.00646443 estimated cost. All 20 completed recognition/count/goal decisions matched offline mechanics. The capped attempt built the full daisy and transferred two edges before its eighth action decision exhausted the budget; it did not loop back into daisy work.

The R case also happened to solve the entire cube, verified by replay, but JEV selected the first-layer handoff from the limited menu. Do not count this as tested solved-state recognition. Downstream piece facts and algorithm reference remained unchanged. No full-solver promotion.

Article lesson: separate incorrect decisions from unfinished work under execution limits. Keep the capped case in the denominator (3/4), while recording correct component decisions (20/20); these answer different questions. The next useful experiment is a separately bounded continuation, preserving the original failure, to determine whether that trajectory finishes without changing its prompts. Do not silently extend an evaluation cap to turn a failure into success. Records: experiments/daisy-integration-v1/README.md. Article updated.


## Request viewer preference

Added /request-flow from the four saved daisy integrations (140 exact exchanges). The user explicitly prefers a minimal whiteboard over a polished presentation: inputs and outputs in adjacent boxes, arrows showing copied values and code-added facts, with exact prompts/native JSON expandable. Keep this format simple. Source body export is allowlisted; no credentials or live calls. Tests compare all exported bodies and the first two handoffs against saved data.

## Observation boundaries: research and next controlled comparison

Official guidance (checked 2026-09-21): JEV 1.13 documentation recommends deterministic counting/arithmetic in code, relevant context and self-contained questions. Its smart-home example batches independent conditional questions, then routes using the model's category. Sources: https://docs.typesafe.ai/model-jaggedness/jev-1.13 and https://docs.typesafe.ai/demos/smart-home. These are provider recommendations, not measurements from our cube study.

The official DOOM announcement says the model receives structured text, but we did not find its exact published payload. A separate community implementation supplies health, ammo, enemy bearings/distances, visibility and wall observations. It also overrides aiming and firing and can select a fallback target in code. Do not attribute that implementation to the official demo or present its performance as unaided model reasoning. Sources: https://typesafe.ai/blog/introducing-system-one-models-and-jev and https://github.com/AmoghCreator/doom-jev/tree/main/agent.

Hypothesis: compact player-relevant facts and independent conditional questions can retain useful decisions with fewer round trips. Compare code-measured petal/bottom matches against JEV-produced matches, with code aggregating counts in BOTH arms. Both receive the same downstream prompts, literal observations and fixed routine menu. The recognition arm's answers pass forward unchanged, even when wrong. Compare structured records and equivalent player-style sentences. No claim that moving deterministic bookkeeping into a model is inherently more intelligent.

Evidence will live in experiments/observation-boundary-v1. Labels and acceptable action sets are offline only. The fixture generator filters for targets with an available routine, so this is a controlled component test, not representative full-cube reliability. Cap: 400 live requests/$0.05 additional commitment including uncertain reservations. Development then frozen fresh validation; integration is gated on both candidates reaching 19/20 complete chains. Preserve any budget-blocked attempts. No live calls made while preparing this entry.

### What seems to work (living, evidence-qualified)

- Teach the boundary between preparation and execution with a few clear contrasts. The final middle-layer candidate passed 39/40 fresh decisions and 10/10 autonomous starts; generic effects alone stayed at 14/20 in development. These examples provide explicit expertise. Focused observations and reduced repeated teaching changed together, so their separate contributions remain unproven. See [two-round findings](docs/minimum-teaching-results.md).
- Give each question enough local evidence and explicit scope. First-layer results support this within the tested families; broader progress recognition still made mistakes.
- Pass genuinely dependent answers into a later request. Batch independent conditional questions instead of assuming a same-call checklist supplies its conclusion.
- Test the representation handed to the next step. Correct flags were not always sufficient; compact counts improved our daisy transition experiment, though wording also changed.
- Let routines represent learned motor skills and disclose them. This is task-specific teaching, not an algorithm-free demonstration.
- Keep deterministic computation a deliberate design choice. Provider guidance favors code; our new comparison measures the assistance boundary instead of declaring either extreme better.
- Memory should be explicit and bounded. We now supply the current target and last two actions; this is a design hypothesis, not a measured memory improvement.
- Use varied labelled cases, fresh validation and integration. Include states produced by earlier actions. Report component accuracy separately from task completion and retain failed/capped attempts.
- Record facts, interpretations and untested transfer ideas separately. Cube evidence may suggest useful patterns for other tasks, but does not establish general complex-problem competence.

### Boundary development round: routine selection is the bottleneck

Four variants on the same 20 states: code/structured 10/20 full chains, code/player 10/20, JEV/structured 9/20, JEV/player 10/20. 232 requests, $0.019930932. Conditional target questions passed 20/20 in three variants and 19/20 in JEV/player. Goals passed 19/20 in three variants and 20/20 in JEV/player. Whole-case recognition passed 19/20 for JEV/structured and 17/20 for JEV/player. These small differences do not establish a general format winner. Mechanical checks are exact by construction, not a model achievement.

Many failures occurred with correct goal/target/situation/reference but a wrong routine or abstention. Example development-10: all arms recognised a petal, chose cross and the current R reference, then selected the transfer half-turn despite the side color not being aligned. Recognition accuracy alone did not ensure useful execution. Both selected candidates are player wording, with code/player winning its tie on tokens under the predeclared selection rule.

Implementation finding: local-frame renaming could produce LF where the routine reference says FL. One allowed revision canonicalises position spelling, copies the chosen target record beside the action question and emphasises that its identity does not encode its current position. No comparison, recommended action or candidate outcome is added. Re-test only action requests using saved upstream answers first; fresh validation must test the full chain. Results will separate this revision from the original round. Do not claim that canonical spelling alone causes any improvement, because target emphasis changes too.

### Boundary results: stop at the failed integration gate

The action-only revision used 28 live calls ($0.006351156), reusing earlier answers for 40 case/arm records. Code/player declined 10→9 complete chains; JEV/player improved 10→11. Under the stated no-regression rule, we did not adopt it. This is not evidence that canonical slot names are harmful. The original formatting limitation remains in the frozen comparator and should be corrected in future work regardless of this small mixed score.

Fresh full-pipeline validation: **code/player 12/20; JEV/player 8/20**. BOTH got all 20 goals, selected targets, situations and references correct. Code/player routine correctness was 12/20 (including five no-action cross handoffs); JEV/player routine correctness was 10/20, with recognition correct in 16/20 and complete chains in 8/20. Thus action-bearing complete chains were 7/15 and 3/15 respectively. No transport errors. The recognition arm added 20 calls: 70 vs 50, with summed API latency about 32.67 vs 23.44 seconds. These are summed request durations, not parallel batch wall times. Validation costs $0.005582010 vs $0.004659270.

Representative failures: validation-10, -11 and -12 all recognised petals and selected cross, then chose a side half-turn before alignment. Validation-6 selected stage-bottom-edge but disturbed an existing petal. Recognition failures can be irrelevant to the selected move: validation-2/JEV performed an acceptable lift yet failed the stricter complete-chain score because a reported check was wrong. Preserve both component and end-to-end scores rather than conflating them.

Total study: **380 live requests, $0.036523368**, no retries or uncertain reservations added. Both arms missed the 19/20 integration gate, so **zero integration attempts** were run. The request/cost caps were not exceeded. Full details and exact payloads: experiments/observation-boundary-v1; minimal viewer: /request-flow. Production policy and historical 99/100 remain unchanged.

Transferable finding: batching conditional target selection worked well on these controlled inputs. Removing calls did not automatically improve the action decision. The routine question now presents 52 setup/routine combinations plus three U moves and abstention, making a large recognition-and-precondition task. Next hypothesis: ask JEV an explicit alignment/landing-occupancy question before selecting a smaller fixed family of routines through its own answer. Code must not infer the case or rank simulated outcomes. Test that handoff in isolation on fresh labelled cases, retain canonical coordinates and distinguish opaque piece IDs from position names. This proposal is not tested here; do not start another paid round without a new scope/budget.

Update to “what seems to work”: count measured flags deterministically, batch independent target questions, and spend dependent calls on preconditions that actually block a useful action. This is supported as a direction by the failure locations, not yet established as an improved routine-selection method. A smaller number of requests is an efficiency metric, not evidence of a smarter policy.

## Budget update (2026-09-21)

The user added $5 to the account, bringing funding to $10, and authorised a cumulative project ceiling of **$9**. Keep $1 outside the experiment allowance. The project ledger is not reset: previous spending and outstanding reservations count toward the $9 ceiling. Each call reserves its conservative maximum before dispatch, so a request is blocked if it could cross $9. At or above $9, no further calls may start. Existing per-study caps remain unchanged unless separately revised. Historical $5-budget records remain accurate descriptions of their original runs.

## Explicit action preconditions (active goal, 2026-09-21)

The preceding goal turn made progress by implementing and validating the raised $9 cumulative ceiling; no additional model calls occurred during that budget update. The current goal now explicitly permits reliable code observations and retains JEV ownership of goals, setups, frames and routines.

Next hypothesis: isolate the missing precondition judgment rather than immediately changing the successful goal/target questions. Prepare 20 petal-transfer cases (10 aligned, 10 unaligned) and 20 landing cases (8 clear, 8 occupied for a below-top target, 4 occupied for a top target). Prior target, frame and routine are supplied for this component test. Code reports current sticker directions, center matching and slot occupancy; the fixed selected routine supplies its landing requirements. JEV decides insert/align or execute/clear/lower. This does not test routine selection yet.

Compare three forms: an explicit rule with short options, explicit conditions on options, and a separate readiness check passed into a dependent choice. Freeze the strongest per family, preferring fewer requests then cost on ties, before 40 disjoint validation cubes. Maximum 260 calls/$0.04 including outstanding reservations; no retries, three workers. Sources and expected answers remain separate from API bodies. Evidence: experiments/action-preconditions-v1.

### Precondition result: explicit single questions were sufficient

All three variants passed 20/20 transfer and 20/20 landing decisions in development. The two-call readiness chain doubled calls without improving this score. The direct rule form won the predeclared requests/cost tie-break in both families. Frozen fresh validation: **20/20 transfer, 20/20 landing**, no failures or retries. Study total: **200 requests, $0.005167764**, including development. Source: experiments/action-preconditions-v1.

Representative distinction: an unaligned yellow-up petal now receives an `align` decision rather than a premature half-turn; a blocked landing slot produces `clear` for a bottom/middle target and `lower` for a top target. These are model choices based on supplied observations and a fixed routine's requirements. Code provides the color match and occupancy facts. No candidate moves or successor states are inspected by the policy.

What this supports: a focused question can reliably apply a routine precondition in these controlled cases, without an additional model-generated readiness summary. What it does not support: actual routine selection, setup rotation choice, preserving other solved structures or full-cube reliability. Target, frame and routine were supplied, and each test asked for an intention rather than executing moves. All landing examples use one required slot from six fixed routines; multi-slot routines need separate coverage.

Next step toward the active goal: integrate these checks with JEV-selected targets and routines, keeping the goal/target question stable. Split routine selection from setup instead of offering 52 combined setup/routine options. Test whether explicit alignment and clearance decisions lead to correct U setups and useful executed moves. Keep bottom-edge preservation requirements explicit; do not use code to correct an unsafe routine. The canonical coordinate spelling fix should be retained for the next candidate. Historical 99/100 remains a different policy and is not acceptance evidence for the new one.

Living lesson update: use the fewest calls that actually pass the measured decision, while retaining a separate call where the next question needs an earlier model choice. Routine selection and precondition checking are different components. Correctness of the latter alone does not establish the former.

## Connecting the checks to executed moves (2026-09-22)

Previous goal turn made progress: two isolated precondition families passed fresh validation, with exact records and article notes. Pricing rechecked today at https://docs.typesafe.ai/models: $0.042/M input tokens, unchanged. Project commitment before this round: $4.156887126 of $9.

New candidate keeps the successful batched goal/target and situation/reference questions. It separates routine selection from setup, then uses the validated precondition question. JEV chooses U setups from a fixed cycle reference. The static routine catalogue describes starting conditions, upper slots that must be free of petals and bottom slots disturbed by that sequence. Those effects are calculated once offline on a fixed cube, mechanically tested in each reference frame, and never evaluated against candidate current-state outcomes at runtime. JEV compares the reference with the current protected bottom slots and chooses the routine; code does not filter or rank the routines.

Study: 20 reused development states, then 20 fresh states disjoint from both previous boundary sets. If at least 19/20 complete action cycles pass, run four bounded early-stage trajectories, 60 requests/200 turns/two minutes each. Total round ceiling 400 calls/$0.08 including reservations. One-cycle scoring includes actual action effects; a U setup is accepted if it clears the model-selected routine's blocked landing slots while preserving the target and protected pieces, even if another routine might have avoided that setup. This is progress under a chosen plan, not shortest-move optimisation. Expected answers and outcome checks stay offline. Evidence: experiments/brain-early-v1.

### Separated action cycle results

Frozen candidate: **15/20 development, 15/20 fresh validation**, 126 calls, **$0.004540998**, no provider errors/retries. The development set is the same 20 used by the earlier code/player candidate (10/20), so that gain is a paired comparison. The new validation is disjoint from BOTH prior boundary sets; do not compare its 15/20 directly with the old 12/20 as if cases were paired. No trajectory integration: the 19/20 gate failed.

All six development transfer cases passed. New validation failures shifted upstream: cases 4, 7 and 9 chose cross too early; cases 2 and 8 mislabelled a middle edge as bottomSide. Case 2 still produced a useful lift. Earlier 20/20 component results did not cover these states reliably. A model-selected `none` target in development case 3 also exposed a null-target bug in the offline scorer; the original error is preserved and the scorer now reports such abstention as failure. No model choices were changed or repeated.

Two development clearance outcomes need different interpretations. Case 7 had UF and UL occupied, UR and UB free, required UF; U or U2 could work, but JEV abstained. Case 9 had opposite free slots UR/UL while the selected routine required adjacent UR/UB: no single U rotation can clear both. Its setup abstention was correct, but the selected routine was a dead end. This is a planning/recovery gap rather than a bad setup answer. The policy must let JEV choose a different routine or target; code must not select a fallback.

Next hypotheses: expose the observed number of yellow edges not yet collected as an explicit measurement instead of asking JEV to add two counts; focus the situation question on the selected piece’s current fields rather than identity-like names; independently measure clearance direction and routine reconsideration. These are not proven changes. Keep the valid canonical frame fix and static motor metadata. Article and exact-action viewer updated; production solver unchanged. No full-cube acceptance claim.

## Explicit observations and model-directed reconsideration (2026-09-22)

Previous goal turn made progress: separated executed cycles scored 15/20 on development and fresh validation and exposed upstream errors plus distinct clearance failures. No live evaluation process remained when this continuation inspected the system.

V2 hypotheses: (1) add the observed count of yellow edges that are neither petals nor solved bottom edges, avoiding model addition; (2) present only the selected piece's current position and yellow direction for situation/reference selection, avoiding identity/position confusion; (3) for a single blocked landing, JEV selects an observed empty slot, then the U turn moving it into place; (4) after a model setup abstention, ask JEV whether to choose another routine, with at most one reconsideration. No code-selected alternative, candidate simulation or tactical correction. The prior routine/precondition reference remains fixed.

Test the same 20 development states, then 20 fresh states excluding all previous boundary and brain-early validation cubes. Limits remain 400 requests/$0.08 for this separate version, no retries, two workers. Four trajectory probes only if at least 19/20 fresh cycles pass. This combined revision diagnoses the candidate as a whole; its score cannot identify the causal contribution of each edit. Evidence: experiments/brain-early-v2.

### V2 results and trajectory audit

Evidence: `experiments/brain-early-v2/{development,validation,integration}-results.json` and `integration-audit.json`. Development 19/20; fresh validation 20/20. Four bounded cross trajectories: 3 complete (33, 17, 14 requests), 1 capped at 60 requests. Total 262 calls/$0.009004968. Replay independently applies every recorded sequence with cubing and checks bottom edge coordinates; all states and reported outcomes agree. No full-cube acceptance claim.

One-cycle development failure selected a U turn where opposite empty slots could not satisfy adjacent required slots. Fresh success did not eliminate that weakness. The capped trajectory had one bad clearance: model selected free UF correctly, then answered U' for UF→UB (expected U2). It subsequently recovered without correction, but did not finish within the cap. Representative exact input: `{currentPosition:"UF",requiredPosition:"UB"}`; output U', confidence .15, probabilities U' .44/U2 .41/U .15. Other completed actions in that trajectory passed offline diagnostic scoring. The cap remains a failure, never extended retroactively.

Interpretation: a successful sampled action suite can miss a tiny spatial lookup failure that compounds across a trajectory. More decomposition also costs repeated calls. Transferable lesson: exhaust a small finite subproblem when possible before adding more prompt layers. Next experiment compares the existing cycle notation with explicit human direction descriptions on all 12 nonidentity top-slot transfers. Keep answers offline and the larger policy frozen. Results cannot establish general spatial reasoning or full-cube performance.

### Finite rotation probe

Hypothesis/change: a fixed description in ordinary direction words may convey rotation better than arrow cycles. Tested both forms on every one of the 12 nonidentity source/destination pairs; expected moves were established by cubing offline, never sent. Evidence: `experiments/top-slot-transfer-v1/results.json`, exact exchanges also in the whiteboard's action-cycle source. Cycle form 10/12; direction form 12/12. Both cycle errors were opposite pairs: UF→UB chose U' and UL→UR chose U, both expected U2. 24 calls, $0.000426384, no retries.

Interpretation: this reproduces the trajectory's UF→UB weakness on an isolated request and makes ordinary direction wording a promising replacement. The variants differ in both labels and teaching wording, so we cannot attribute the effect to one of those changes. Full finite domain coverage is not repeated-call reliability, and it does not test choosing the empty slot or multi-slot geometry. Next candidate should adopt the direction form, preserve other successful components, then test fresh trajectories with the standard acceptance request ceiling. Do not reclassify the 60-request capped attempt as success. Remaining work includes multi-slot reconsideration, all later stages and a frozen 100-cube evaluation.

Living lesson: simple symbolic notation can be harder for this model than equally informative ordinary words. Measure the small transformation itself. More decomposition is not always better if repeated calls consume the execution limit; remove or combine calls only after measuring the resulting behavior. Current project commitment including outstanding reservations: $4.170859476 of $9.

## Direction wording and full-policy composition (2026-09-22)

Previous goal turn made progress: audited v2 integration and isolated rotation errors on a complete finite domain. V3 changes only single-empty-slot clearance wording to the measured direction form; transfer rotation and multi-slot clearance remain unchanged. Fresh validation excludes every earlier validation set. It scored 19/20; the failure chose cross with no transfer target before gathering was finished. Four trajectories from this fresh set completed the cross in 34, 67, 17 and 11 requests. All executed cycles passed the offline diagnostic and every state replayed correctly. Total 197 requests/$0.006547758. Evidence: `experiments/brain-early-v3`.

Limits/interpretation: these are different cubes from v2, and the trajectory ceiling increased from 60 to 120 requests. One needed 67. Do not attribute all improvement to wording or compare 4/4 versus 3/4 as a controlled treatment effect. V3's occasional goal failure and earlier multi-slot failure remain unresolved.

Full-policy audit: `goal-policy.ts` supplies current faces, counts and completed structures; its reference offers every goal to JEV. `skill-policy.ts` and `measured-policy.ts` route on JEV-selected goal and intention. Target eligibility is the selected goal's fixed piece vocabulary, with no outcome ranking. Four reference views rename coordinates; code does not pick the matching view. `semanticFacts` computes current spatial relationships, sticker-center matches and counts. `skillOptions` is a fixed goal-specific routine vocabulary. Setup options describe fixed turn effects independent of the current cube. No policy calls a solver, applies candidate moves or corrects a tactical choice. These routines and teaching rules are substantial explicit assistance, consistent with the trained-human/muscle-memory boundary. Historical results do not transfer automatically.

New hypothesis: the measured early cycle can connect to the existing later-stage teaching under a single JEV goal choice. `scripts/brain-full-v1/policy.ts` asks the eight-goal question, adds the factual uncollected-edge count and static early teaching, then follows that answer. For early goals it asks the independent conditional target questions without repeating the goal request. Later goals use the audited measured policy. Incorrect goals remain incorrect; a mocked boundary test verifies that no code override occurs and scramble text never reaches requests.

Full development probe: two short scrambles and two random-state scrambles, each at most 500 requests/1000 turns/10 minutes; total at most 1000 requests/$0.12, serial, no retries. A recurring state triggers a JEV recovery choice (continue/retarget/undo), never automatic undo. The random-state generator can use an internal solver before evaluation; only resulting state enters policy. Policy dependency sources are frozen in `experiments/brain-full-v1/sources.json`. This is exploratory integration, not the final 100-state evaluation.

### Full composition found a contract mismatch

All four v1 development starts abstained before finishing the cross: 59 calls/$0.002754864. Evidence: `experiments/brain-full-v1/results.json`; independent replay in `audit.json` confirms every move and all four unsolved outcomes. No later-stage decisions were reached, so this run says nothing about their reliability.

Representative sequence: initial uncollected count 2 → daisy lift; count 1 → cross alignment; count 1 → cross transfer; count 1 and no petals → cross again, transferTarget=none, stop. The older goal reference explicitly allowed direct cross solving and encouraged continuation during transfer; the new early controller's cross branch only transfers yellow-up petals. Appending a daisy-first instruction left conflicting strategy definitions in the request. Code faithfully followed the model and did not repair the mismatch.

Interpretation: components can each be reasonable and still disagree on what a shared label means. This integration failure is evidence against the assembled contract, not evidence that more raw state or more API calls will help. Transferable lesson: give each decision label one consistent meaning across teaching, choices and downstream capabilities. Before integrating versions, audit those meanings as carefully as data types. Next: replace (not append to) the old goal teaching with a consistent eight-goal reference, test labelled goals across early and later stages, and only then retry fresh full trajectories. Keep all four failures and frozen sources intact. The prior 99/100 solver is still separate.

## One meaning per goal (2026-09-22)

Previous turn made progress: all four full integration failures exposed a mismatch between a general direct-cross goal and the petal-transfer-only controller. This round replaces the entire goal instruction and option definitions instead of appending an exception. The fixed eight-goal reference now gives cross only one meaning: transfer gathered yellow-up petals. Every goal remains offered; JEV evaluates the prerequisites. Code reports completed structures and uncollected yellow-edge count, never a recommended goal.

Development: 32 unique states, four for each goal, with offline mechanical labels. Compare compact completion facts/counts against the same reference plus detailed face observations. Both scored 32/32. Compact consumed 24,380 input tokens/$0.001023960; detailed consumed 53,404/$0.002242968. Compact chosen before validation because accuracy tied and token usage was lower by 54%. Evidence: `experiments/goal-contract-v1/development-results.json`.

These fixtures deliberately supply previousGoal=cross and a one-action U memory independently of how the fixture was constructed. That is a controlled irrelevant-memory stress test, not a recorded solve history. Labels stay offline. This sample covers all eight labels but is composed of structured states created with fixed routines; it is not representative random-state solving. Both forms differ in observation scope, not teaching or options. Fresh validation is 32 more distinct states, excluding development. Gate: at least 31/32 before four full integration starts under the original attempt ceilings. No repeated calls or retries.

Transferable lesson: resolve contradictory task definitions before adding information. A compact question can be sufficient when the supplied facts match the actual decision boundary. Current evidence supports this specific goal-routing task, not a universal preference for shorter prompts.

Fresh goal validation: compact passed 32/32 disjoint cases, costing $0.001023960. Total component comparison: 96 calls/$0.004290888. No word changes after selection. Local tests confirm balanced labels, state uniqueness, mechanical reconstruction and absence of answers/scramble in requests.

The full v2 integration keeps v1's two short scrambles for comparison and generates two fresh random-state scrambles. The only policy edit is replacing fullGoalRequest with the consistent compact reference. Routine selection and recovery remain unchanged. This distinction matters: reuse makes the short starts development comparisons, while the two new random starts are exploratory coverage, not a final test. Dependency snapshots remain separate from v1.

### Corrected full-policy development results

V2 solved all four development starts: short-1 115 requests/122 turns; short-2 152/144; random-1 161/160; random-2 226/227. Total 654 requests/$0.042736680. No retries or manual corrections. `experiments/brain-full-v2/audit.json` independently reconstructs starts from scrambles, replays every executed sequence and checks final edge/corner identities and orientations. All four passed. This supports the goal-contract diagnosis but is still a very small development batch; only two starts are full random states.

Next test started: ten fresh random-state validation attempts using exactly the same recursively hashed policy sources. Fixtures exclude both full development datasets and each other. Each attempt retains 500 requests/1000 turns/10 minutes; batch limit 2500 requests/$0.20, no retries. Evidence will be under `experiments/brain-full-v2-validation`. Do not tune against these outcomes while calling them validation. The final 95/100 requirement remains untested for this architecture.

## Validation monitoring and acceptance preparation (2026-09-22)

Previous turn made progress: the coherent goal component passed fresh cases, all four full development runs solved, and ten frozen-policy validation runs started. This continuation verified the original process handle remains live; it was not restarted. First three validation runs independently replay-verified as solves. The batch is incomplete, so no final acceptance claim.

Verification now checks recursive policy-source snapshots/digests against current files, start uniqueness, every recorded before/after state, final piece identities/orientations, standard face-turn counts, ledger/event request-count agreement and 500/1000/10-minute ceilings. Partial reports explicitly distinguish verified terminal rows from the full denominator. This guards against accepting the runner's status alone. Development also passed this stronger verifier, including one model-directed recovery on random-2.

Prepared but not started: final evaluation on 100 fresh random-state cubes, gated on all ten validation attempts independently passing. Same frozen policy, four independent workers, no retries, 50,000-call/$3 study cap within global $9, and complete failure accounting. Per-run exact records avoid rewriting the whole corpus on every request. Source of pricing rechecked today: https://docs.typesafe.ai/models, still $0.042/M input tokens, pinned jev-1.13.0. No policy/prompt tuning during validation or final evaluation. The final set is retired if its failures guide later changes.

### Validation service failure

The still-running v2 validation batch hit `JEV HTTP 529` on attempt 7, after 57 dispatched requests and 12 face turns. It is preserved as an unsuccessful autonomous attempt. No retry was made in this frozen no-retry study, and the 10/10 final-evaluation gate is therefore blocked. A preceding successful recovery choice is not the failed response; the failed HTTP exchange is preserved separately in immutable request/error events. We cannot assume this cube would otherwise have solved.

The other first eight attempts solved. Keep collecting the predeclared remaining attempts with unchanged prompts. Candidate next experiment, conditional on the completed diagnosis: allow at most one transport retry for 429/529, with identical request content, backoff and both requests counted/reserved. This changes service handling, not JEV's tactical decisions, and must be evaluated on a fresh set. Do not replace or retry attempt 7 inside the original denominator. The future final test must record the selected transport policy as part of its frozen configuration.

The independent verifier now also checks recorded goal/reference choices against actual JEV answers, later-stage operation choices against the executed skill, fixed routine/frame translation, and that undo operations were explicitly chosen by JEV. These checks passed the completed development runs and terminal validation records examined so far. All full-policy prompts remain unchanged.

### Completed no-retry validation and bounded transport follow-up

V2 validation completed **9/10**, 1,699 dispatched requests and $0.100502598 committed (including the uncertain failed-call reservation). Independent verification checked all ten starts, moves, model-selected execution, outcomes, source freeze and limits. Nine solves remain nine, not 9/9; HTTP 529 is the tenth failure. The original 10/10 final gate failed. No evidence establishes whether the interrupted attempt would eventually solve.

Next study started in `experiments/brain-full-v2-transport-validation`: ten new random-state cubes excluding earlier full studies, same recursive policy digest, only transport handling changed. At most one retry for 429/529 with identical request body and built-in backoff; other failures still stop. Both network attempts count toward 500/run and 2500/study, and reservation checks conservatively cover both before dispatch. Study cap $0.20 within project $9. No prompt or tactical changes. Local mocks passed: one 529 then success emits two identical bodies and retains failed reservation; two 529s stop after two calls. This new dataset does not replace the old failed attempt.

Transferable lesson: separate decision errors from delivery failures when diagnosing, but include both in autonomous outcome rates. Retry policies are part of the evaluated system and must be fixed before testing. A ten-run follow-up still cannot establish the final 95/100 target or precisely estimate the provider's error rate.

### Bounded-retry validation also finished 9/10

Evidence: `experiments/brain-full-v2-transport-validation/{results,verification}.json`. All ten records were audited; nine solved. 1,659 dispatched requests/$0.098137536 committed. The final attempt failed on a 30-second request timeout (`Execution cancelled`), not 429/529, so the configured retry did not apply. Uncertain reservation retained. This batch produced no 429/529 response, so it is not live evidence that the new retry rule improved outcomes. The final gate remains closed; no 100-cube test started.

The failed trajectory also exposed a decision-memory problem BEFORE the timeout. After two lifts, JEV alternated U to clear for `stage-bottom-edge` and U' to clear for `cross-flip-bottom`, repeatedly returning to the same state. Recovery chose continue once, then retargeted from DB to DL before the timeout. Current memory carries target and the last two move sequences, but loses which routine the setup was preparing. Thus request-level valid clearances can cancel across cycles when the next routine choice forgets the plan.

Next bounded experiment: compare no plan memory against explicit previous model-selected routine/reference/target/preparation on labelled post-setup states. Let JEV choose whether to complete or abandon that plan; never automatically execute a cached routine. This tests the human-solver hypothesis of remembering an intention between observations. Keep the goal component and fixed routines stable. Separately test one bounded same-body retry for request timeout/network failure while respecting the overall attempt deadline and retaining uncertain charges. Do not assume delivery fixes alone solve the planning loop or that this interrupted cube would have succeeded.

Living lesson: a last-action log is not necessarily useful working memory. A setup action has a purpose, and recording the model's own pending intention may prevent locally reasonable steps from undoing one another. This is a hypothesis based on one trajectory, not yet a demonstrated improvement. Both 9/10 validation batches and their failures remain preserved.

## Remembering the purpose of a setup (2026-09-22)

Previous turn made progress: second full validation was independently verified 9/10, and its interrupted trajectory exposed alternating preparations for different routines. No live full-solve process remained when this continuation started.

Hypothesis: retaining the model's pending target/reference/routine/preparation would prevent losing the purpose of a U setup. Component dataset: recorded post-clearance states from the three full-policy batches, deduplicated by cube state and filtered to admit an immediately executable useful routine. This intentionally measures finishing a successful setup, not arbitrary routine selection. Twenty development states, twelve held-out physical states, plus six stale-memory perturbations of those held-out states. Expected acceptable routines are computed offline; multiple ready routines can be accepted. Menus and current observations are identical across variants.

Development: baseline 12/20; structured plan memory 19/20; narrative memory 19/20. Structured chosen for direct traceability of stored fields, not because it used fewer tokens (35,913 vs narrative 35,605; baseline 32,523). Exact records: `experiments/plan-memory-v1/development-results.json`. The known loop belongs to development.

Held-out result: structured memory only **10/18**, comprising 10/12 regular cases and **0/6 stale-memory checks**. Every stale-memory failure copied `lift-middle-right` despite incompatible starting positions. One regular failure resumed a lift needing another clearance instead of the already prepared staging move; another abstained. The simple memory prompt is NOT adopted into the solver. Total comparison 78 calls/$0.005727288.

Interpretation: memory improved the convenient development cases but became an instruction-like anchor. A generic caveat to recheck conditions did not stop copying. Transferable lesson: working memory should be checked as fallible context, especially when it contains action names. Score stale/incorrect memory as well as useful memory. Post-setup progress scoring is narrower than overall solve success.

Next development revision: an explicit, compact resume/reconsider decision compares the pending routine's fixed starting conditions with current target, frame, sticker direction and protected bottom slots. Resume is a new JEV commitment to its prior routine, not automatic replay. Landing occupancy still gets its separate model question. The old 18-case validation is now retired and reused as development to test this revision; it cannot validate the revised prompt. Solver unchanged pending fresh evidence.

### Explicit plan commitment: promising isolated result

The compact resume/reconsider question passed 18/18 retired development cases ($0.000410256). Frozen before fresh validation. Fresh component suite: 24 new legal cube states, four each matching plan, changed target, changed reference, wrong starting position, wrong sticker direction, and affected protected bottom slot. All **24/24** passed ($0.000549276). Earlier decisions and pending memories are synthetic fixture context in this suite, not actual model history; current geometric fields come from mechanically generated cubes. This tests the applicability decision, not a complete action or solve. Evidence: `commit-validation-fixtures.json` and `commit-validation-results.json` under `experiments/plan-memory-v1`.

Implemented an untested full-run v3 candidate: when there is a pending plan, JEV explicitly chooses resume or reconsider. Resume maps that new model choice to its own earlier routine; precondition/landing selection still follows. Reconsider requests a fresh routine with the old memory absent. Code never checks the case to choose resume, never overrides a bad answer, and does not automatically replay an earlier routine. Mocked integration tests verify both branches, including deliberately wrong resume being followed faithfully. The driver still needs to carry pending plans from recorded model setup choices and test the known loop plus fresh starts.

Lesson update: “include memory” was too vague. Named actions in memory can dominate an otherwise valid instruction. A small commitment decision with explicit current-versus-remembered requirements worked in this limited fresh suite. Integration and recovery behavior remain unproven; no final evaluation started. Exact exchanges added to the existing whiteboard viewer; article now includes both the failed direct-memory variant and the narrower successful check.

## Connecting explicit plan commitment to full runs (2026-09-22)

Previous turn made progress: simple plan memory failed stale-context checks, while explicit resume/reconsider passed 24 fresh cases; integration branches were mocked but not yet exercised live. This round's v3 runner retains the model's selected target, front, planned routine and executed clearance as pending memory. The next routine decision asks JEV to commit or reconsider. Only an explicit resume maps to that earlier selected routine. Memory is discarded after execution of something other than a clearance, including undo. Wrong model commitments remain wrong; no state-based correction occurs in code.

Transport change: at most one identical-request retry for HTTP 429/529 or a request timeout/network failure while the overall attempt deadline permits it. The wrapper calls the existing evaluator with one network attempt at a time, rechecking all budget/request/time limits before each dispatch. Uncertain reservations remain. Tests cover no third request, no retry beyond the deadline, and no retry for malformed model responses. This is separate from the decision-memory change, so a small integration batch cannot isolate all causes of improvement.

Development started: known-loop cube from interrupted prior validation, a short scramble, and two new random-state starts. Limits 500 requests/1000 turns/10 minutes per attempt, 1000 requests/$0.12 across the batch. The original failed attempt remains untouched. Recursive policy and transport sources plus runner snapshot saved under `experiments/brain-full-v3`. A dedicated independent verifier checks pending-plan provenance and explicit model commitments in addition to state replay, choice/execution agreement, limits and the absence of interactive-runner intervention.

Early v3 development evidence: the known-loop start solved in 186 requests/169 turns, independently verified. Its first three actions matched the earlier failed prefix (L, R U R', U). At the next decision JEV explicitly resumed `stage-bottom-edge` and executed B, instead of switching to `cross-flip-bottom` and clearing back with U'. It then lifted the edge and moved on to cross transfer. This is a concrete instance of preserving setup purpose; it is not a held-out reliability result. The short scramble also solved (122 requests/141 turns). Fresh starts still in progress at this entry.

### V3 full development passed, validation started

All four v3 development attempts solved and independently verified: known-loop 186 requests/169 turns; short-1 122/141; random-1 202/204; random-2 161/151. Total 671 requests/$0.039077094. No interactive intervention. The known-loop comparison is diagnostic development evidence; only two of these starts are new full random states. Transport and memory changed together, so overall solve-rate differences are not an isolated treatment estimate.

Ten fresh random-state validation starts now running with the same policy+transport digest. `scripts/brain-full-v3/evaluate.ts validation` excludes all known fixture states (including states reconstructed from saved scrambles). At most four independent attempts run concurrently; dependent questions remain sequential. Limits: 500 requests/1000 turns/10 minutes per attempt, 2500 requests/$0.20 for the batch, and shared reservation-aware $9 cap. Each retry rechecks the limits before dispatch. Per-run files retain exact exchanges and full snapshots, with a small summary file. No tuning during validation. The prepared final mode requires ten independently verified validation successes before generating 100 new starts.

### V3 validation passed; final set started

V3 validation solved **10/10** new random-state cubes. Independent verification passed all ten, including exact move replay, JEV choice/execution agreement, pending-plan provenance, frozen sources, pinned provider model, no interactive-runner intervention and all limits. Total 1,774 requests/$0.102348246. Solves used 143–202 requests, 120–207 turns and approximately 57–78 seconds. Both earlier 9/10 batches remain separate; they were not relabelled or replaced.

Final evaluation started with `bun scripts/brain-full-v3/evaluate.ts final`: 100 fresh random-state starts generated only after the policy/transport digest was frozen and validated, excluding all prior fixture states. Four concurrent independent attempts. Per-attempt ceiling 500 network requests (including retries), 1000 face turns, ten minutes. Batch cap 50,000 requests/$3, shared project cap $9. All failures and budget-capped attempts remain in the denominator. No prompt changes or outcome-guided tuning on this set. If these failures guide later tuning, retire this final set.

Project commitment before final start: $4.573941960 including outstanding reservations, leaving $4.426058040 to the approved cap. Official pricing rechecked at https://docs.typesafe.ai/models on 2026-09-22: pinned jev-1.13.0 remains $0.042/M input tokens. Current results live in `experiments/brain-full-v3-final/results.json`, with exact per-attempt records alongside it. Acceptance remains unproven until all 100 outcomes are independently verified and at least 95 solve within limits.


## Final brain v3 evaluation: 100/100 (2026-09-22)

- **Hypothesis:** reliable observations, consistent goal definitions and an explicit commitment check for pending routines would support complete solves without code choosing tactics.
- **Change:** froze the validated v3 policy before generating 100 fresh random-state cubes. No tuning during the final test. Fixed beginner algorithms remained explicit assistance.
- **Evidence:** 100/100 independently verified solves. 17,665 network requests, 24,030,420 input tokens; median 76 seconds, 173.5 requests and 159.5 face turns per attempt. Maxima: 131 seconds, 291 requests, 295 turns, all within the declared limits. Two transport retries, 193 plan resumes, four reconsiderations and 13 recovery decisions. Final commitment $1.014653640, comprising $1.009277640 settled estimates and $0.005376 retained uncertain reservations. Project commitment $5.588595600 against the $9 cap.
- **Representative behavior:** after the known-loop setup, JEV explicitly resumed its pending staging routine instead of selecting a different clearance that undid progress. Exact requests, native responses and state transitions are preserved in the per-attempt records.
- **Interpretation:** the complete policy meets the 95/100 acceptance criterion on this test set. This is not an isolated causal measurement of the memory change. Earlier failed validations remain preserved, and the old v26 99/100 result belongs to a different policy.
- **Transferable lesson:** give a small decision model dependable facts and a stable procedure reference. Carry its unfinished intention forward, then ask it to verify that the intention still fits current conditions. Blindly reminding it of the previous action failed stale-memory cases.
- **Limits and next step:** this result uses taught routines and code-derived facts, not unaided discovery of cube algorithms. It does not establish universal problem-solving ability or guaranteed future availability. Further work should test the same observation/decision/commitment pattern in another domain with fresh labels.

Records: [results](experiments/brain-full-v3-final/RESULTS.md), [acceptance](experiments/brain-full-v3-final/acceptance-report.json), [independent replay](experiments/brain-full-v3-final/verification.json), [freshness](experiments/brain-full-v3-final/freshness-verification.json), [assistance audit](docs/brain-policy-boundary.md). Freshness audit found no overlap with 1,224 prior canonical states. Full local suite: 99 passing tests, 10,217 assertions; typecheck passed. No further paid calls are needed for this acceptance result.

Final presentation checks: production build and typecheck passed; article HTTP smoke returned 200 with the new result and historical-policy labels.

## Inspectable final-policy whiteboard

The request-flow page now defaults to a complete recorded brain v3 solve: 40 actions and 179 exact request/response exchanges. External cube facts, teaching and memory are separated from JEV decisions. Handoff annotations distinguish copied choices from model-controlled observation lookups and coordinate transforms. In particular, the early situation label is recorded but not passed into routine selection; the selected reference is used to rebuild geometry. This distinction matters when describing which intermediate questions actually contribute to the working pipeline. All payloads remain downloadable, and viewing makes no API calls. Regenerate offline with `bun scripts/export-final-flow.ts`.

The whiteboard now links an unfolded sticker net with native cubing.js permutation/orientation arrays, a selected-piece decoder and examples of derived measurements. It explicitly separates position indices from permanent piece IDs and shows that JEV’s goal request receives named facts, not raw permutations. Numeric IDs are the mechanics library’s storage convention, not a claimed prompting improvement. The 3D preview uses the original setup only for display; request bodies remain unchanged.

## Goal observation readability: frozen paired comparison

- **Hypothesis:** English descriptions might make named completion facts easier to interpret, or add unnecessary reading cost. The existing first request already receives semantic facts, not cubing.js numeric arrays.
- **Change:** compare unchanged structured fields with equivalent English sentences. Preserve all measurements, synthetic memory, exact teaching and eight answer options; keep field identifiers in parentheses so rules still refer to the same concepts. No new recommendations or case matching. Both forms frozen before calls.
- **Prior evidence:** observation-boundary formats had mixed downstream scores; compact versus detailed goal observations tied 32/32 with fewer tokens for compact. Neither isolates this precise serialization change. Official docs accept text or JSON state; that alone does not predict which works better (https://docs.typesafe.ai/models, checked 2026-09-22; $0.042/M input tokens).
- **Evaluation adjustment:** offline generation could not supply another balanced set excluding the old goal cases: the final edge-only stage has very few legal states with every corner already fixed. Reuse the existing 64 distinct goal-contract cubes for a paired format comparison, without tuning either form. These are not new held-out cases. There are 63 distinct observation-plus-memory inputs because two physical states collapse to identical measured facts. Synthetic previous goals and one-turn memories are controlled irrelevant-context tests, not claimed real histories.
- **Limits:** at most 128 live calls, four concurrent, no retries, $0.02 committed including reservations, within the $9 project limit. Exact requests and outputs will be saved under experiments/goal-readable-v1. The proven solver is unchanged.

### Readability result: tie, retain structured facts

- **Evidence:** fields 64/64; English 64/64, both 32/32 in each frozen batch. All 64 pairs correct, no transport errors or retries. Fields: 48,888 input tokens, $0.002053296, median 421.9 ms. English: 53,328 tokens, $0.002239776, median 422.5 ms. Total 128 calls/$0.004293072; project commitment now $5.592888672. [Full result and representative input/output](experiments/goal-readable-v1/RESULTS.md), [exact exchanges](experiments/goal-readable-v1/results.json).
- **Interpretation:** no measured accuracy winner. English cost 9.1% more input tokens, while latency was effectively tied. Both expose the same already meaningful facts and use matching field identifiers in the teaching reference. That may explain why both work, but it is a hypothesis about the tie, not measured internal reasoning. Retain fields for cost and direct traceability; leave the proven policy unchanged.
- **Transferable lesson:** separate readable semantics from sentence formatting. Named counts and completion flags can already be human-readable. Making the UI explain an encoding does not imply the model needs the same explanatory prose on every call.
- **Limits/next:** old labelled cases, synthetic memory, only 63 distinct rendered inputs; all-perfect accuracy hides finer differences. This comparison says nothing about forcing JEV to decode numeric permutations, other request families, or full solve performance. A useful next format test would target a harder spatial/routine choice with actual baseline errors, rather than repeat this saturated suite.

The flow viewer now separates each exchange into preparation explanations (not prompt text), the complete sent body, the complete native response and the next handoff. It labels measured app latency/cost separately from provider fields. Rounds use neutral numbers and request counts; the goal and turns remain recorded outputs rather than titles that imply they were chosen beforehand.

For article explanations, prefer “concept + evidence from this cube” over narrating every preparation operation. The goal request now explains each completion flag with a short definition and actual counts (for example, daisy=1 because one top edge shows yellow upward; cross=false because 0/4 bottom edges are solved). API instructions and criteria get a brief purpose explanation and official reference links. These annotations are for readers and do not change live prompts.

## Fresh recording and viewer check (2026-09-22)

- **Hypothesis/change:** the viewer should handle a new solve without assumptions about the original recording. Ran one fresh random-state scramble through unchanged frozen brain v3, within 500 requests, 1,000 turns, ten minutes and $0.05 extra commitment. Official input pricing rechecked at https://docs.typesafe.ai/models: $0.042/M.
- **Evidence:** solved in 41 actions, 144 turns, 196 requests and 109.3 seconds, estimated $0.010254174. Independent verifier checked all state transitions, JEV choice/execution agreement, frozen sources and final solved state. No recoveries. Project commitment now $5.603142846, below $9. [Record and verification](experiments/brain-v3-viewer-2026-09-22T21-49-38-503Z/verification.json).
- **Viewer:** exported exact allowlisted exchanges as `public/recordings/brain-v3-fresh-flow.json`; retained the original final-test recording separately. All fresh observations render, forward/inverse playback reproduces recorded states, and the browser displays the new last round and independently verified result.
- **Lesson/limits:** test presentation on unseen trajectories as well as fixed examples. This is a viewer regression check and one additional solve, not another reliability evaluation. Outcome captions use measured before/after facts rather than invented model explanations.

## Algorithm labels and decision explanations

Presentation now aliases the recorded routine IDs to established names where applicable: Sune, Anti-Sune, T-perm, Ua-perm and Ub-perm, cross-checked against CubeSkills OLL/PLL references. Beginner insertions retain descriptive names; no famous name is invented for an arbitrary short sequence. Exact prompts, IDs and frozen solver remain unchanged.

Fresh-recording caption review: round 29's UF green/red edge matches the right middle-layer insertion conditions; round 38 uses Sune with zero white-up corners and white facing L at ULF as taught preparation (0 to 1 oriented corners), whereas round 39 matches the finishing pattern (1 to 4). Round 41's three remaining edge destinations match the taught Ua cycle with the back edge fixed. Useful article/UI structure: observed pattern, chosen named routine, measured outcome. Label this as a reconstruction from recorded inputs and teaching, never as the model's private reasoning or a claim that every chosen routine matched its conditions. Keep local-reference coordinates explicit.

Presentation preference: use the shared SVG FlowArrow for UI transitions and caption arrows, including dynamic outcomes. Keep literal arrows in exact recorded prompt/response text unchanged.

## Request responsibility audit (2026-09-22)

- **Finding:** current brain v3 goal selection is an explicit Boolean decision table. Middle-edge intention, early situation/reference, transfer readiness and repeated-Sune selection also contain direct case-to-answer rules. Routine selection combines more requirements, while setup asks for a spatial mapping. Plan commitment checks equality/preservation conditions; recovery leaves more discretion but is not thereby proven effective reasoning. Early `situation` answers are recorded but do not feed routine selection. The later top-stage target menu can contain only `whole`, so that target answer contributes no selection.
- **Evidence:** audited `scripts/brain-full-v3/policy.ts`, `scripts/goal-contract/policy.ts`, `scripts/brain-early-v3/policy.ts`, `scripts/plan-memory/check.ts`, `src/server/measured-policy.ts`, `src/server/skill-policy.ts`, `src/server/action-preconditions.ts` and v3 recovery. The fresh recording contains 41 goal questions in 196 exchanges. Full v3 achieved 100/100 held-out solves (`experiments/brain-full-v3-final/RESULTS.md`); this establishes reliability of the heavily taught procedure, not independent strategy discovery. Prior grid-position prediction validated at 16/20; code-observation/player boundary chains at 12/20 versus recognition/player at 8/20. These are different tasks and do not establish a general reasoning ceiling.
- **Official guidance:** rechecked https://docs.typesafe.ai/model-jaggedness/jev-1.13 and https://docs.typesafe.ai/demos/smart-home. Provider recommends semantic judgments, exact criteria, arithmetic in code, reduced indirection and batching independent conditional questions. Typed outputs do not imply choices can only represent Boolean lookups. Official DOOM announcement still describes structured text, without enough exact prompt detail to attribute a particular reasoning architecture to it.
- **Interpretation:** moving a lookup from code into a prompt changes execution ownership, but the designer still supplies its decision logic. Natural-language paraphrases of the same table do not establish greater reasoning. Learned routines fit our muscle-memory analogy; state-specific recommendations or applicability verdicts supplied by code would cross our intended boundary.
- **Proposed next experiment, not run:** preserve the verified solver; compare a direct-table baseline against relational teaching for one middle-edge decision family. Supply current positions, sticker colors, centers, goal and generic routine descriptions. Let JEV infer the obstruction/intention, then choose frame/routine from its own answer. Avoid redundant `whole` choices and unused situation outputs. Use matched development cases for alignment, left/right insertion, flipped/trapped edges and preservation; freeze before fresh validation. Include cases where one changed relation should change the answer and irrelevant-detail changes should not. No candidate simulations or correction at runtime. Measure acceptable complete decisions, preservation, calls and failures, then short integrations. This tests removal of explicit answer mappings rather than merely changing JSON into prose.
- **Transferable lesson:** audit how much of an answer is already encoded in supplied features and criteria. Optimize for meaningful judgment and measured end-to-end reliability, rather than number of model-owned branches. Generic teaching still supplies expertise and must remain disclosed. No new paid calls or policy modifications in this audit.

### Less-help middle-edge experiment: frozen before calls

Hypothesis: general routine effects may support relational decisions without the explicit case-to-answer table. Compare explicit rules, relational routine teaching, and minimal sequence-only teaching. The explicit arm is a matched experimental baseline, not identical production requests. All arms receive the same selected target's current slot/stickers, center colors, goal, frame and action menu. Code does not supply solved/aligned/intent flags. The second request receives the first answer unchanged. We supply the target to isolate this family; this does not test target selection or full solving. Action options are eight named/front-specific insertions, three U turns and leave.

Prepared 20 development and 20 validation states, four each solved, flipped in home slot, trapped in wrong middle slot, unaligned upper and aligned upper. All are legal routine-generated cubes with intact bottom layers, unique across these two sets. Not a random-state reliability sample. Offline simulation verifies acceptable action sets and preservation; no simulation result enters requests. Source, protocol and fixtures frozen in `experiments/less-help-v1`. Select the strongest reduced-help variant on development (ties favor minimal); validate against explicit on untouched validation. No revisions this round. Caps 200 requests/$0.05, max four independent workers, no retries, global reservation-aware $9 budget. Pricing rechecked $0.042/M input. Preserve errors in denominator. Offline tests pass.

### Less-help screening results and evaluation limitation

- **Evidence:** development complete intention+action scores: explicit 11/20, relational 6/20, minimal 9/20. Minimal selected by the frozen rule; validation explicit 9/20, minimal 7/20. 200 calls, zero provider errors/retries, $0.00671916; cumulative project commitment $5.609862006. Exact exchanges and per-family results: `experiments/less-help-v1/RESULTS.md`, `results.json`, `summary.json`.
- **Representative failure:** development-1 has blue-red at UR, blue facing R/red U. Explicit chooses extract then middle-right@R; the acceptable next action is U-prime alignment. The target's destination category (middle edge) may be mistaken for current location. Both reduced-help variants pass all four development flipped cases; minimal passes all four trapped cases. Upper alignment fails 0/4 across all arms. Solved-piece handling also fails frequently. This is not a usable replacement.
- **Interpretation:** this matched baseline is much weaker than production because observations omit solved/layer/alignment facts and reference+action selection is combined. Thus scores cannot attribute degradation solely to reduced teaching. Clear present-location words might help without supplying an action, but that remains untested. All menu actions mechanically preserve the bottom layer regardless of choice, so preservation is not an independent model success.
- **Evaluation defect:** 40 different cube states collapse to 14 development and 17 validation observations, with 7 shared across splits. Retire this validation label for capability claims; these results are screening only. Future fixture uniqueness must be checked after request construction, not only by cube hash. Balance current slots and frames and include paired contrasting cases. No tuning or extra calls were performed after the announced 200-call cap.
- **Transferable lesson / next:** removing perceptual summaries and tactical instructions simultaneously confounds the experiment. Keep trustworthy geometry readable, remove explicit case-to-action rules separately, and test current-location recognition before combining it with routine/frame choice. An action API can be schema-valid and preserve an invariant while still making no useful progress. Frozen working solver unchanged.

## Less-help v2: readable present geometry (2026-09-23)

Hypothesis: some v1 failures confuse eventual middle-layer membership with present location. Supply current layer/location in words and sticker/adjacent-center pairs, without solved, aligned or action verdicts. Disambiguate the goal's wording. Keep explicit, relational and minimal teaching arms matched on these observations and menus. Ask an independent current-layer recognition question alongside intention; it cannot see the sibling answer and its output is diagnostic only. Action still receives the uncorrected intention.

Prepared and froze 40 unique actual observations, 20 per split with no overlap. Quotas per split: 2 solved, 2 flipped-in-home, 4 trapped, 8 upper-unaligned, 4 upper-aligned. The finite target-only solved/flipped spaces are split rather than duplicated. States are unique within this experiment; do not claim novelty against all historical cubes. Reliable observations add semantic geometry but no tactical verdict. Offline tests verify legal states, preservation, accepted actions, no request label leakage, and uniqueness after observation construction. Caps 200 calls/$0.05, four workers, no retries, reservation-aware global $9 cap. Select reduced-help arm on development, freeze, validate against explicit. No production changes. Comparison to v1 changes wording and representation together and is diagnostic, not causal isolation. Sources and protocol: `experiments/less-help-v2`.

### Less-help v2 result: location is readable, decisions still fail

- **Evidence:** development complete scores explicit 10/20, relational 9/20, minimal 7/20; current-layer readback 20/20 in every arm. Relational selected before follow-up. Validation explicit: location 20/20, intention 16/20, action 10/20, both 10/20. Relational: location 20/20, intention 15/20, action 7/20, both 7/20. All 40 actual inputs distinct across phases. 200 calls, no retries/provider errors, $0.00807744; global commitment $5.617939446. Records: `experiments/less-help-v2/RESULTS.md`, `summary.json`, `results.json`.
- **Representative failures:** explicit development-3 sees blue facing B at UB, adjacent center blue, red facing U; reports upper correctly but chooses align/U-prime instead of left insertion with front B. Development-4 chooses alignment correctly but picks U-prime rather than U. These locate errors in relational classification and action mapping, rather than current-layer readback.
- **Interpretation:** clearer observations remove one ambiguity but do not produce reliable action decisions. CurrentLayer is supplied by code, so 100% recognition is reading a fact, not deriving it from raw geometry. The relational arm can handle some decisions with less direct mapping, but is not good enough for integration. Minimal did not outperform relational here; no universal preference for shorter teaching follows. Comparisons to v1 change multiple things and case mix, so do not attribute a causal improvement.
- **Transferable lesson:** test whether a model distinguishes the relevant relationship, not merely whether it can repeat the observation. Correct upstream answers can coexist with wrong downstream actions. Keep generic routine knowledge and reliable perception explicit, and measure the application separately. No full runs or production changes.
- **Next:** isolate side-color/center comparison and setup direction using unique contrast pairs. Compare isolated routine selection with the same selection after model intention. This can distinguish component failures from composition failures before more broad prompt rewrites. Stopped at the declared 200-call cap.

## Active less-help goal: isolated diagnostics (2026-09-23)

Goal turn classified as progress: prepared frozen exhaustive probes and obtained live evidence. Match fields and sentence forms each passed 16/16 ordered side-color pairs. U-turn source/destination selection passed 12/12 with a generic position-cycle reference and 4/12 with clockwise/counterclockwise descriptions alone. 56 calls, $0.000875952, no errors/retries. Records: `experiments/less-help-probes-v1/results.json`. These are small exhaustive domains, not held-out general reasoning evidence. The cycle reference states universal move effects and does not pick a move for the current case. Correct isolated comparisons do not prove composition works. Next compare a direct action question against a sequence that explicitly carries model-produced color relationships into decisions, both with the same generic action vocabulary.

### Composition screening: accurate relations do not ensure useful actions

Hypothesis/change: supply universal routine effects for all four fronts and generic U cycles. Compare direct action selection with relations -> intention -> action. All model answers are copied unchanged; no applicability verdict from code. Mechanical tests verified source/destination, sticker orientation, ejection and preservation effects for all eight routine/frame variants. Reused 20 development observations; not a fresh validation result. Eighty calls, $0.003905160, no retries/errors. Records: `experiments/less-help-compose-v1/RESULTS.md` and exact `results.json`.

Evidence: direct 11/20 acceptable actions; composed 12/20, with 17/20 intentions correct. In development-4 both comparisons were different and intention align, but action middle-left@F contradicts that intention and fails the offline acceptable U choice. Other errors confuse insertion side and quarter versus half turns. A 1-case gain does not establish improvement, and neither candidate warrants integration.

Interpretation: isolated color comparison and rotation-with-cycle probes pass, but carrying abstract match0/match1 answers through a larger action question remains unreliable. Indirection, mixing reference-frame selection with action choice, and distraction by multiple routines are plausible causes, not proven explanations. General routine effects are supplied expertise and disclosed as assistance; they do not pick an action for the current state. Next structurally different experiment: attach model comparison results to their named sticker records and separate setup selection from routine/frame choice, without adding conditional case-to-answer rules. Preserve all failed results; two changes could confound causal attribution, so compare handoff formatting on fixed calls first if feasible.

Goal remains active: 40 unique held-out complete-decision gate and ten autonomous integrations have not been attempted for a qualifying candidate. This turn produced new diagnostic and composition evidence; it is progress, not a waiting/no-progress turn. No proven solver modifications.

## Goal progress: explicit roles and effect-based decisions (2026-09-23)

Prior goal turn was progress: exact color/rotation probes and composition screening changed the next experiment. This turn inspected those records and tested two structural refinements.

1. Attached model color matches to sticker records; route on JEV's intention into setup destination/turn or insertion front/side. Full menu arm 10/20; routed 14/20 complete decisions (130 calls/$0.003838716). Tests verify wrong intentions and destinations are followed without tactical repair. Source/results: `experiments/less-help-routed-v1`.
2. Name upward sticker separately from side-facing stickers; destination receives only side-facing color and centers. Compare older intention teaching against general physical-effect options. Roles 16/20; effects **19/20 complete decisions**, including all four insertion cases (141 calls/$0.003454542). Failure development-12 chooses insertion when U2 alignment is needed. Exact source/requests/results: `experiments/less-help-roles-v1`.

Interpretation: keeping relevant relationships explicit in the observation and giving a concrete effect to each choice appears more useful than a long abstract instruction plus short operation labels. Model still chooses intention, setup destination, rotation, front and insertion side; code performs no candidate ranking or tactical repair. Static move cycles and insertion effects are learned-routine assistance. These are development comparisons with multiple representation changes; no causal isolation or held-out reliability claim. Full goal still requires 36/40 held-out and 9/10 integrations. Cumulative commitment $5.630013816.

Validation design: local target-only space has exhausted aligned and solved subcases in prior experiments. To avoid repeating the v1 uniqueness error, next observation should include all four middle-edge records, useful for preservation and eventual model target selection. Screen that format before freezing, then generate 40 new complete observations excluding development. Distinguish unseen configurations from unseen local subcases. Do not add decorative metadata to manufacture uniqueness. No production solver changes.

## Context-screen regression (2026-09-23)

Prior turn was progress (19/20 development candidate). This turn tested its sensitivity to relevant broader observation, freezing sources and screening before any held-out generation. Full other-middle-edge records: **13/20**; compact protected-middle-slot facts: **15/20**, versus previous local effects candidate 19/20. Each used 70 calls. Combined cost $0.003663996, project commitment $5.633677812. Both failed the predeclared 18/20 screen gate, so no held-out or integration runs were launched. Source/requests: `experiments/less-help-context-v1` and `experiments/less-help-context-v2`. The original runner needed a TypeScript-only annotation after execution; original source snapshot remains preserved.

Representative effects: full context caused premature insertion on seven unaligned-upper cases; protection context caused repeated alignment on four already aligned upper cases plus the baseline alignment failure. These data suggest strong sensitivity to extra context; do not claim deterministic causation from one batch. More information can change an otherwise successful local judgment. No context fields contained recommended actions, predicted outcomes or repair logic.

Validation-design caution: expanding inputs merely to make held-out identities unique is not a capability improvement. Other pieces and protection are legitimately relevant to choosing what to work on, but evidently distract this focused intention question. Next architectural option is to keep broad scene observations in a separate model target-selection request, then retrieve only the selected piece's local observations. Test the selection+decision chain on new scenes and disclose that its individual local subcases can have appeared before. This aligns with actual integration rather than adding irrelevant context to each local query. The 40-case gate must grade the whole selection/action chain and report coverage of all required action families; do not count reserialized old local inputs as unseen cases. Prepared acceptance runner has not yet earned its checks. Goal remains incomplete; existing solver unchanged.

## Separate scene selection: new development evidence (2026-09-23)

Prior turn was progress: two context screens revealed regressions. Tested broad scene -> model target -> unchanged narrow effects chain. Scene includes eight non-bottom edge records, current sticker geometry and measured solved flags. All four middle targets remain offered; no code selection. Twenty new legal scenes, unique at the actual scene request boundary. Four are middle-complete to test leaving solved edges alone. Offline labels for every target require unfinished-target selection while any remain, correct intention, accepted action, bottom preservation and preservation of other solved middle edges.

Result **14/20 complete chains**, eligible targets **20/20**. Failures: five align/insert intention mistakes, one wrong insertion side. Blue-orange above the blue back center repeatedly received align/leave instead of insertion; one correctly classified insertion chose left instead of right. Done 4/4 and extraction cases passed (see summary for counts). The 19/20 reused development score did not generalize. Screen gate18 failed; no held-out or integration calls. 88 calls, $0.002389590; commitment $5.636067402. Exact records `experiments/less-help-scene-v1/screen-results.json`; frozen policy dependencies in sources.json; mechanics and wrong-answer-propagation tests pass.

Lesson: accurate model target selection does not fix errors in its local action choice. Keep scene selection separate, but test local frame representations before another acceptance attempt. Next materially different representation is mechanical current geometry in JEV's chosen view with explicit left/right center colors, keeping generic effects unchanged. No candidate-outcome simulation or correction may enter runtime. If that also plateaus, report the limit and options under the goal's stop rule rather than cycling through wording. All new development scenes are retired from future held-out evaluation. Goal remains incomplete, and proven solver unchanged.

## Plateau stop: scoped chain versus model-selected local view (2026-09-23)

Previous goal turn was progress: new scene screen isolated target selection from failing local decisions. This turn tested the promised structurally different representation. JEV picks target, then a viewing side; code translates only current geometry, then JEV chooses one of six general-effect actions. Geometry vs measured color-match variants score **11/20** and **12/20**, respectively, on the reused scene set. Tests verify view invariants and propagation of wrong model choices. 120 calls, $0.003398304, no retries/errors. Exact records: `experiments/less-help-view-v1`.

Interpretation: the scoped recognition/intention/setup/routine pipeline stalled at 14/20 on new scenes; the local-view direct-action alternative did not improve it and introduced extraction failures. The best 19/20 reused-development result does not establish generalization. Small deterministic comparisons working in isolation does not imply their composition works. No claim about an absolute JEV capability ceiling follows.

**The goal's plateau condition is now reached. Stop live iterations and report the bottleneck/options rather than repeat wording changes.** The acceptance gates are still unmet: no qualifying 40-case heldout test or ten integrations. Detailed completion audit and options are in `docs/less-help-goal-status.md`. Commitment $5.639465706, below $9. Do not mark the goal complete. Further live work needs user direction on preserving this boundary, changing teaching constraints, or authorizing a new research hypothesis/stop rule. This is the first turn at that stop condition, not a three-turn blocked audit. No proven solver changes.

## Article limitation and proposed next goal (2026-09-23)

Observed limitation: JEV 1.13 answered small isolated color comparisons and taught U-rotation lookups accurately, but the tested reduced-help pipelines did not reliably combine those facts into useful cube actions. More context sometimes reduced accuracy. A 19/20 reused-development score fell to 14/20 on new scene chains; the alternative local-view policy reached 11–12/20 on that scene screen. This is a limitation of the tested model/prompt/policy combinations, not proof that JEV cannot reason or that decomposition never works.

Transferable lesson: test both each component and the complete decision chain. State precisely which knowledge is provided by code, by teaching, and by the model's selection. Neither many model calls nor model ownership of an if/else table establishes independent reasoning. Correct structured output is weaker than a useful action.

Proposed next goal, not launched: find the least additional teaching that makes the middle-layer policy reliable. Compare frozen general-effect teaching against a few contrastive examples and concise general applicability teaching, recording each added assumption. This deliberately broadens the earlier prohibition on explicit applicability rules; do not relabel success as achieving the old goal. Combining each representation's strengths is a hypothesis, not a state-based code router: JEV must still choose any subtask/routine. Code owns accurate observation and faithful execution only, with no candidate ranking, oracle suggestions or correction. Keep the prior acceptance targets (36/40 fresh complete decisions and 9/10 autonomous integrations), use at most two development rounds, freeze before heldout evaluation, and stop/report on failure rather than tune indefinitely. Suggested additional cap $0.25, also subject to the cumulative $9 cap. Article should report a reliability-versus-teaching tradeoff instead of a universal model capability claim. Await user choice before resuming paid experiments or changing the active goal.

## New goal: minimum additional teaching (2026-09-23)

User explicitly changed the goal: applicability guidance and contrasting examples are now allowed teaching, while JEV retains every tactical choice. Original less-help goal remains unmet; do not relabel the new result as its success. At most two development rounds and $0.25 additional expenditure, also within global $9. Baseline commitment $5.639465706. Round1 freezes matched effects/examples/guidance arms on 20 reused scene-development cases. Observations, model color-comparison handoffs and execution flow identical; only instruction/criteria teaching differs. Examples add six static worked contrasts; guidance adds explicit intention applicability conditions and a generic insertion-side/extraction reference. Code never supplies per-state chosen tactics. Wrong-answer and matched-observation tests pass.

Predeclared selection: lowest teaching tier with >=18/20 complete chains (effects, examples, guidance, a design ordering not a scientific measure of assistance). If none qualify, one development revision remains; after two rounds stop/report. Selected policy frozen before generating 40 unused complete observations, excluding historic fixture states and transmitted scenes. 36/40 plus all four action families gates ten autonomous integrations (160 requests/200 turns/two minutes each). No retries, max four independent workers; count failures/caps. Strict $0.25 study reservations plus global cap rechecked before each call. Records in `experiments/teaching-study-v1`; proven solver unchanged.

### Minimum-teaching round 1 and frozen held-out result

Matched development scores: effects14/20, examples18/20, guidance16/20. Static examples selected as the least-assisted passing tier under the predefined ordering; this does not establish a universal minimum or prove examples inherently less informative than rules. No second development round used. Same observations and route architecture, differences limited to teaching. Six worked contrasts are explicit expert knowledge, including an alignment-vs-insertion pair, solved-vs-flipped pair, current-slot extraction, and left/right insertion example.

Frozen examples candidate achieved **38/40 complete decisions** on fresh complete scene observations. Selected target families: align20, extract12, done4, insert4. Failures retained. Local subcases may repeat; starting states and transmitted scene observations exclude prior fixture sets. Gates passed and ten autonomous middle-layer starts now running unchanged, each capped160requests/200turns/2minutes, no retries. No claim of goal completion until those attempts and independent replay checks finish. Study commitment after heldout $0.012918108. Exact records `experiments/teaching-study-v1`; working solver unchanged.

### Integration limitation and next-round focus

The frozen examples candidate passed 38/40 standalone complete decisions but solved only **2/10 autonomous middle-layer starts**; eight attempts reached their execution cap. Saved results: `experiments/teaching-study-v1/integration-results.json`. This is the recorded outcome, pending independent replay verification. Study ledger reports 1,754 requests and $0.04713807 across screening, held-out decisions and integration.

Repeated align/leave choices on already aligned edges expose a gap between isolated decision accuracy and sustained progress. A plausible explanation is that integration revisits difficult local situations and repeats the same mistake; the existing evidence does not establish an absolute model capability limit. Static contrasting examples helped the standalone score without making the controller reliable.

Proposed focus for the remaining development round: distinguish preparation that is still needed from preparation already complete, using reliable present-state observations and generic teaching. JEV must decide whether to align, insert, extract or finish, and choose the frame/routine. No automatic no-op repair or progress-based action selection in code. If these evaluation failures guide changes, retire both evaluation sets before fresh testing. Retain the active goal's 36/40 and 9/10 gates, two-development-round maximum, $0.25 total study cap and $9 project cap. No additional live calls launched for this note.

Transferable lesson: evaluate the states a policy reaches through its own actions. A high one-step score can hide a repeatable failure that dominates an autonomous run. Describe this as a measured reliability limitation of the tested controller, not proof that JEV cannot reason.

### Final development round: focused intention teaching

Previous goal turn made progress by inspecting terminal results and recording the integration limitation. Independent replay now confirms 38/40 decisions and 2/10 integrations, including exact request reconstruction, all applied moves, and raw middle/bottom solved predicates (`experiments/teaching-study-v1/verification.json`).

Hypothesis: the preparation decision is distracted by full frame/center/upward-sticker context. Round 2 supplies only current layer and side sticker/center pairs with JEV's uncorrected comparison results to that question. All downstream requests use the existing base effects policy. Unlike round 1, examples and applicability text are added only to intention, not repeated in the routine question. Matched arms compare generic physical effects, four short contrasting examples, and explicit applicability rules attached to each option. The effects arm still receives generic teaching about making progress; it is not untaught. Guidance deliberately supplies case-to-intention expertise in language. Code does not evaluate those conditions or repair decisions. Tests verify matched observations and propagation of deliberately wrong relations/actions.

Development: 20 scenes, including retired integration intermediate states, with intended coverage of four done, four extraction, six alignment and six insertion situations; JEV still chooses the target, so report actual selected-family coverage too. Retire v1 held-out and integration sets, including reached states. Select highest complete score reaching 18/20; ties prefer effects, examples, guidance. This changes the first round's least-passing selection rule because 18/20 alone proved insufficient; minimum assistance can only be claimed among candidates with comparable demonstrated reliability. Freeze all sources before calls; new evaluation excludes all retired scene/state identities. Local patterns can recur. No third development round. Cumulative v1+v2 $0.25 cap, global $9, conservative reservations, four workers and no retries. Working solver unchanged. Full logs: `experiments/teaching-study-v2`.

### Final-round development result

Matched complete-chain scores: effects **14/20**, examples **20/20**, applicability guidance **20/20**. Examples wins the predefined tie-break. Four short contrasts suffice on these development cases; this is not yet reliability evidence. General effects alone still fail despite the focused observation. This supports testing explicit teaching of the preparation boundary, but representation and example wording changed together versus round 1, so their separate causal contributions remain unresolved. Round2 screen used264 calls/$0.007040082; cumulative study2018 calls/$0.054178152. Freeze unchanged examples candidate before fresh evaluation. Exact requests/responses and selected-family labels in `experiments/teaching-study-v2/screen-results.json`.

### Final-round frozen held-out decisions

Examples candidate passed **39/40** complete decisions; independent replay verified requests, answers, transformations and scoring. Actual selected families: done4, extraction6, alignment24, insertion6. The failure chose the correct insertion intention for blue-orange at the back, then chose left insertion at front B instead of the appropriate right insertion. Thus the preparation boundary improved on this sample, while frame/side application remains fallible. Different held-out samples prevent interpreting 38/40 versus39/40 as a significant improvement. Ten fresh autonomous starts launched unchanged; their result, not this one-step score, determines integration success. Cumulative study2204 requests/$0.058924740. Records: `experiments/teaching-study-v2/heldout-results.json`, `verification.json`.

### Final integration result and completion audit

The frozen examples candidate solved **10/10 fresh middle-layer starts**, with 5–48 requests, 8–52 face turns and 2.35–23.51 seconds per attempt. No no-op actions or repeated states occurred. Two successful runs made a wrong insertion-side choice, then recovered through later JEV choices; no code repair was added. The independent replay verifier confirms 39/40 held-out decisions and10/10 final solved states, with the bottom preserved at every action endpoint. These exceed the declared36/40 and9/10 sample gates. Ten runs are a small sample, not a guarantee of population-level90% reliability or full-cube performance.

Round1's2/10 failures remain recorded. Both allowed development rounds are complete. Total study spending/reservations **$0.065233728 for2,449 requests**, below$0.25; project commitment **$5.704699434**, below$9. No further paid calls needed for this goal. Production solver code unchanged. TypeScript and focused mechanics/choice-propagation tests pass. Exact sources, phase-start freeze markers, fixtures, native exchanges, ledger and independent verification are preserved. Outcome report: `docs/minimum-teaching-results.md`; per-run errors/recovery: `experiments/teaching-study-v2/failure-analysis.json`.

Interpretation: a small amount of explicit applicability teaching plus narrowly scoped observations produced a useful controller on the defined middle-layer domain. General effects alone did not qualify. This does not identify a globally minimal prompt: four examples encode substantial case-to-intention knowledge, and only the selected examples arm received final evaluation. The result satisfies this bounded study, not the earlier stricter goal of avoiding applicability mappings. Article should explain both the successful assistance boundary and the failed inference that a strong standalone score automatically ensures reliable integration. Next research, if requested: broader middle-layer coverage and a controlled ablation separating observation focus from example wording, before integrating into the full solver.
