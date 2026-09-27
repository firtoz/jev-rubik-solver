# Diagonal corner routine experiment

> Historical study note. Status, budgets and original commands describe this experiment at the time. See the [research index](README.md) for current code and available records.

The candidate adds the fixed 14-turn alternative corner-permutation routine from the [CubeSkills four-look guide](https://www.cubeskills.com/uploads/pdf/tutorials/4-look-last-layer.pdf). It replaces two successive T permutations for arrangements with no matching side-corner pairs.

Code still supplies measured pair colors and counts. JEV chooses adjacent versus diagonal permutation, reference and final alignment. Static numeric applicability teaching and the additional routine are explicit assistance. No current-state case matching or candidate-outcome ranking runs in code.

All 24 oriented corner permutations passed complete stage tests, split 12 development and 12 unchanged-policy regression validation. These are finite-domain cases previously used with the incumbent, not a fresh population holdout. Every stage completed and stopped correctly within 0–15 turns, preserving lower layers and upper orientations. Independent wire/native response/action replay passed.

The study ledger contains 81 requests costing $0.005462100. Full integration on the same four development scrambles is evaluated separately; isolated success does not establish the 95/100 under 100-turn objective.

One development HTTP 529 was retried successfully. Thus 81 ledger attempts represent 80 successful decisions plus one uncertain failed-attempt reservation, retained in the cost. The transport failure is not a model-decision error.

## Full development outcome

Three of four starts solved within 100 turns: 75,93 and 100. The remaining attempt stopped at 90 before its 11-turn final permutation. Each trajectory was replay-verified. Runs took 81.4–115.8 seconds and the full study cost $0.025341624, including three retried HTTP 529 reservations. Project commitment: $8.106648732.

None of these four trajectories needed the new diagonal routine: all used a single T permutation. Consequently, the improved 3/4 count cannot be attributed to the new routine. Stochastic earlier trajectories changed. Its move savings remain supported only by the complete corner-stage tests.

Next: fresh random-state development coverage to measure other trajectories and long-move tails, before any final 100-case evaluation.

## Eight fresh random-state starts

The frozen policy solved 5/8 within 100 turns. Successful turn counts were 84,85,87,95,96 (mean 89.4). All eight trajectories passed source/request/response/mechanics replay.

Three attempts stopped before their selected final routines. Offline checks show those routines would solve at 104,102 and 101 turns, respectively. They remain failures, and those extra moves were never executed. The 8/8 advancement gate was missed; no final 100 evaluation was launched.

Runs took 87.4–125.5 seconds. 1138 ledger attempts cost $0.059376156 including reservations for eight retried HTTP 529s, all resolved. Project commitment: $8.166024888.

One successful full trajectory used the diagonal routine. Remaining failures involved costly F2L preparation (44 turns in one run) or early-stage costs combined with the 15-turn Z permutation. The next focused test concerns extracting one F2L piece without trapping its partner.
