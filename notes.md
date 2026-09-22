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
