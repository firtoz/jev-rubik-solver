# Teaching JEV: research notebook

The study is complete. The article is the main deliverable; this notebook preserves the experiments and the lessons that informed it. The final grouped-menu solver solved 98/100 fresh cubes within 100 face turns. See the [final report](docs/research/budget-round-results.md) for costs, failures and comparisons.

## What seems to work

- **Describe what a player needs to notice.** Piece locations, sticker directions and completed structures gave JEV useful inputs. A focused middle-edge question improved when it distinguished the occupied slot from the piece’s destination.
- **Supply familiar routines and disclose that help.** The final policy chooses existing algorithms. Predicting every individual turn proved too unreliable in our early probes. The result measures applying a supplied method.
- **Give dependent questions their actual inputs.** A checklist and a conclusion in the same request can disagree. Passing the checklist answers into a later request improved our first-layer recognition cases. Independent questions can still be batched.
- **Carry a plan through preparation, but check it again.** Remembering a selected routine helped prevent repeated clearing moves. Blindly copying that memory failed when the situation changed, so JEV had to decide whether the plan still applied.
- **Keep factual calculations in code when they are reliable.** Counts and sticker matches are cheap to compute. Asking JEV to rediscover them added errors in the observation-boundary comparison. JEV still chose the goal, target, reference, preparation and routine.
- **Judge changes by their effect on the complete task.** Better daisy labels left eight stage trajectories unchanged. Grouped F2L recognition saved tokens but added requests. Cost, latency, turns and success rate can move in different directions.
- **Distinguish a new cube from a new input.** Changing pieces omitted from a request produced identical model inputs in one study. That tests repeatability. It does not broaden recognition coverage.

These lessons come from this task and its supplied references. For another application, they are hypotheses to test on that application's cases.

## What we tried

Single-turn choices failed the early full scrambles within their request limits. Focused questions with beginner routines later solved 99/100 under a 1,000-turn ceiling. Observation and plan-memory experiments reached 100/100 under that same ceiling. The final move-efficiency work added F2L pairs, full PLL routines and grouped recognition, reaching 98/100 under the stricter 100-turn ceiling. These are separate policies and test sets.

The final method asks JEV to choose a goal, target, reference, preparation and routine from code-measured observations. Code executes those choices and checks the resulting cube. Static teaching can explain when a routine applies, but code must not choose the matching routine, repair an incorrect answer or rank simulated outcomes during solving.

## How we compared ideas

We compared a few variants on the same labelled development inputs, froze a promising candidate, then checked fresh cases before integration. A component was tested with correct earlier answers supplied and with real earlier JEV answers. Failures stayed in the records. Cases used for tuning were retired from later validation.

The primitive-versus-routines replay changes the action vocabulary as well as the request sequence. It illustrates the resulting behaviour, but cannot isolate the benefit of decomposition. Paired stage tests with identical starting states were more useful for comparing a single change.

## Detailed experiment history

The [detailed notebook](docs/research/notebook-archive.md) preserves the chronological entries. In those entries, “current”, “next” and budget figures describe the experiment at that time. Original `experiments/` paths and retired scripts identify historical records, not commands to run from this checkout. See the [research index](docs/research/README.md) for available records and [offline verification](research/README.md) for the supported reproduction command.

For the article, keep the final method and the most useful lessons in the main text. Use the appendix for detailed comparisons, unsuccessful variants and limits. A proposed application such as document routing still needs its own evaluation.

## Preparing the article for readers

The website now uses saved recordings. Paid reproduction is available through the local CLI, and the final 100 attempts can be verified offline. The main article explains the method and the final choices; the appendix and archived notes retain unsuccessful approaches and supporting comparisons.

During the documentation review, we fixed stale setup instructions and record links, restored two response-JSON views, and separated the current verifier from the broader historical audit. Recordings and measured results were left intact.
