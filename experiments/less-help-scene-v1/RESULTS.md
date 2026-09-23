# Separate scene selection and local decisions

20 new observed scenes. 14/20 complete selection/intention/action decisions; screen gate of 18/20 failed. No held-out or integration run launched.

Target selection chose an eligible edge in all 20 cases. The local decision chain caused all six failures: five intention errors (alignment versus insertion) and one wrong insertion side. Cases 14, 16 and 19 selected the blue-orange upper edge already aligned to the blue back center, but chose align/leave instead of insertion. Case 6 recognized insertion correctly but selected middle-left@B instead of middle-right@B.

Scene selection receives all eight non-bottom edges with measured positions, sticker directions and solved flags. It offers all four middle-edge targets, including solved ones. The downstream effect-based local policy receives only its selected target. Code retrieves geometry by model choice and executes its selected sequence; it does not classify tactics or repair errors. Static algorithm effects remain supplied assistance.

This is development evidence, not held-out acceptance. All scenes are unique as transmitted to selection; downstream local subcases repeat. The prior 19/20 on the reused local development set did not generalize. Four completed-middle scenes test no-op behavior. The legal start generator preserves the bottom layer and uses routine-generated states, not uniform random middle-layer states. Tests verify mechanics and wrong-answer propagation.

88 calls, $0.002389590. Project commitment $5.636067402. Exact records: [screen-results.json](screen-results.json). Source snapshot: [sources.json](sources.json).

Next distinct representation: build current geometry in JEV's chosen frame, making the side/up stickers and left/right center colors explicit; generic routine effects stay constant. Do not tune on these cases and later call them held out.
