# Critics

Run: `node tools/critique.mjs <project> <name|all|stage:<stage>|vision ...>`. Reports: `review/critics/<name>.json` (schema `critic-report`), `SUMMARY.md`; `node tools/fix_plan.mjs <project>` groups findings by what must change.
Score = 100 - 25 per blocker - 10 per major - 2 per minor. Verdict: fail with a blocker, revise with a major, otherwise pass. Maximum 3 rounds per critic, then the user decides.

## Automatic critics (measure real files)
| critic | checks | what it cannot judge |
|---|---|---|
| research | claims have sources that exist, source ids valid, 2+ domains, URLs load | whether a claim is TRUE |
| script | hook length/type (greetings fail), pace (wpm), sentence length, repeated lines, claims without evidence ids, CTA | whether it is interesting |
| storyboard | every line in one shot in order, variety, shot lengths, safe areas, transitions, cinematography critic | taste of framing |
| captions | text equals narration, chunk timing, reading speed, one highlight per chunk, placement, coverage | readability on the picture (vision critic) |
| voice | clipping, long silences, what a speech recogniser hears vs the script (pronunciation) | whether it sounds good |
| music | headroom, clipping, voice-over-music level (voice minus music in speech) | whether the music fits the mood |
| sfx | every sound has a shot and an event, density, repeats | whether it sounds right |
| frames | blank, flat, clipped or off-safe-area frames in the render | uncanny faces, artifacts (vision critic) |
| video / final | unplanned cuts, hook, ending, colour jumps, pacing, captions present; resolution, fps, length, loudness, black/frozen frames, missing approvals | whether the story works |
| reference | pace, framing, look, caption zone and loudness vs analysed references; warns when too close | originality of ideas |
| cinematography | framing/angle/move rules, continuity, motivated moves | emotional effect |

## Vision critics (need the agent's eyes)
character, environment, camera, composition, typography, ui, transitions, plus vision passes for frames, video and reference. `--packet` lists the images and a rubric; `--submit` accepts findings only if the agent names the images it opened; `--unavailable` records that the checks were NOT performed (verdict revise, the report lists the unperformed checks).

## Verified
Each automatic critic was run on a real render or on a deliberately bad fixture. Findings on real output included: a blank last frame in an early render (fixed since, re-checked on a re-rendered clip), old sound cues with no event, a mix-level measurement that was misaligned (24 kHz narration against a 48 kHz mix, fixed). The selftest keeps a good-vs-bad script fixture, a bad research fixture and the vision refusal as regression tests.
