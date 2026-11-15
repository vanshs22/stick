---
name: storyboard-critique
description: Reviews a storyboard for visual concept, variety, continuity, camera, composition, transitions and timing before anything is built. Use after the storyboard stage and after each storyboard change.
---

# Storyboard critic

Inputs: `storyboard/storyboard.json`, `script/script.json`, `data/timeline.json`, `review/storyboard.jpg` (look at it). Output `review/storyboard-critic.json` (schema `critic-report`, critic `storyboard`). Max 3 rounds.

## Lenses (one finding per failure, with `shot_id`, `evidence`, `expected`, `fix`, `fix_target` = storyboard unless noted)
1. Visual concept: does each picture explain its sentence? Could a viewer with the sound off follow the point? (blocker)
2. Evidence: wherever the script names a real thing, is real evidence planned? `fix_target` assets or research. (major)
3. Variety: no 3 identical shot types in a row; at least 3 different `shot_type`s in the video; not every shot a text card. (major)
4. Pacing: the hook shot is strong; average shot 1.5-4 s; no shot under 0.8 s or over 6 s unless intended. (major)
5. Continuity: characters, colours, props and geography agree between neighbouring shots. (major)
6. Composition on the sheet: subject inside the safe zone, one clear focal point, nothing covered by the caption band, readable at phone size. (major)
7. Transitions: each suits the movement; no whip into a calm shot; transition sounds exist or are `none`. (minor)
8. Anchors and sound: every entrance has an anchor; sound events are tied to visuals; none piles up. (major)
9. Style: obeys the style pack rules (lighting, camera language, typography). (major)
10. Buildability: every `component` exists or is listed in `new-components.md` with enough detail. (major)

## Score and verdict
100 minus 25 per blocker, 10 per major, 3 per minor. `pass` >= 80, no blocker.
Fix by editing the storyboard (not the script) unless a finding says `script`. Then rebuild the timeline and the stills and re-check.
