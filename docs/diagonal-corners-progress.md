# Diagonal corner routine experiment

The candidate adds the fixed14-turn alternative corner-permutation routine from the [CubeSkills four-look guide](https://www.cubeskills.com/uploads/pdf/tutorials/4-look-last-layer.pdf). It replaces two successive T permutations for arrangements with no matching side-corner pairs.

Code still supplies measured pair colors and counts. JEV chooses adjacent versus diagonal permutation, reference and final alignment. Static numeric applicability teaching and the additional routine are explicit assistance. No current-state case matching or candidate-outcome ranking runs in code.

All24 oriented corner permutations passed complete stage tests, split12 development and12 unchanged-policy regression validation. These are finite-domain cases previously used with the incumbent, not a fresh population holdout. Every stage completed and stopped correctly within0–15 turns, preserving lower layers and upper orientations. Independent wire/native response/action replay passed.

The study ledger contains81 requests costing$0.005462100. Full integration on the same four development scrambles is evaluated separately; isolated success does not establish the95/100 under100-turn objective.

One development HTTP529 was retried successfully. Thus81 ledger attempts represent80 successful decisions plus one uncertain failed-attempt reservation, retained in the cost. The transport failure is not a model-decision error.

## Full development outcome

Three of four starts solved within100 turns:75,93 and100. The remaining attempt stopped at90 before its11-turn final permutation. Each trajectory was replay-verified. Runs took81.4–115.8seconds and the full study cost$0.025341624, including three retried HTTP529 reservations. Project commitment:$8.106648732.

None of these four trajectories needed the new diagonal routine: all used a single T permutation. Consequently, the improved3/4 count cannot be attributed to the new routine. Stochastic earlier trajectories changed. Its move savings remain supported only by the complete corner-stage tests.

Next: fresh random-state development coverage to measure other trajectories and long-move tails, before any final100-case evaluation.

## Eight fresh random-state starts

The frozen policy solved5/8 within100 turns. Successful turn counts were84,85,87,95,96 (mean89.4). All eight trajectories passed source/request/response/mechanics replay.

Three attempts stopped before their selected final routines. Offline checks show those routines would solve at104,102 and101 turns, respectively. They remain failures, and those extra moves were never executed. The8/8 advancement gate was missed; no final100 evaluation was launched.

Runs took87.4–125.5seconds.1138 ledger attempts cost$0.059376156 including reservations for eight retried HTTP529s, all resolved. Project commitment:$8.166024888.

One successful full trajectory used the diagonal routine. Remaining failures involved costly F2L preparation (44turns in one run) or early-stage costs combined with the15-turn Z permutation. The next focused test concerns extracting one F2L piece without trapping its partner.
