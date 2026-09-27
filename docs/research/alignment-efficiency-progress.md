# Alignment teaching experiment

Recorded F2L choices repeatedly used U' where U or U2 would reach the requested position in one turn. This test changed only the general teaching of turn effects. Code still reports positions and executes JEV's choice.

| Format | Development | Fresh relation validation |
|---|---:|---:|
| Original cyclic notation | 4/8 | Not run |
| Explicit coordinate movements | 8/8 | 24/24 |
| Explicit movements in words | 8/8 | Not run |

The coordinate form used fewer tokens than words and remained frozen for validation. Across both sets it covers all32 upper-edge/corner source-destination pairs, including no-turn cases. Expected answers were generated and checked by cube mechanics outside requests.48 calls cost$0.001132950.

Full integration on the same four development starts solved2/4, tying the incumbent. Successes took83 and100 turns, compared with the incumbent's75 and95; stochastic trajectory differences prevent a clean causal comparison. Failures stopped at95 and91. All11 selected F2L alignments were correct single-turn movements, but this did not establish an overall move-count gain.

Full runs took61.1–78.9seconds and543 requests total, costing$0.018302844. Every request, native response and executed move passed independent replay. Project commitment:$8.075845008.

The next candidate is a fixed14-turn corner-permutation routine from the CubeSkills four-look guide, mechanically verified on the no-matching-pair domain. It still needs JEV selection tests before integration. The95/100 under100 turns goal remains unmet.
