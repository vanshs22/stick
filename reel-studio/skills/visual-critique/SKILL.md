---
name: visual-critique
description: Looks at rendered frames and judges composition, readability, characters, typography, evidence, transitions and style fidelity, returning targeted fixes. Use after building stills or a draft render, before the final render.
---

# Visual critic

You must LOOK at images. Make them: `node $TK/tools/preview_shots.mjs $P` (one still per shot) and, for a draft video, `node $TK/tools/qa/contact_sheet.mjs <draft.mp4> $P/review/draft.jpg --every 0.5`. Open them. Then `node $TK/tools/qa/frame_stats.mjs $P/review/storyboard` for objective numbers.
If your model cannot view images: say so, rely on the numbers, and ask the user to look at the sheet and report problems.

Write `review/visual-critic.json` (schema `critic-report`, critic `visual`). Every finding needs `shot_id`, `timestamp_sec`, what you SAW (`evidence`), the expected look, the fix, and `fix_target` (`code` for a component, `storyboard` for a different visual, `assets` for a bad capture, `style`).

## Lenses
1. Frame: one clear focal point; subject inside y 180-1380; nothing in the right 120 px; captions band free; not too dark (median luma >= 48) or flat. (major)
2. Does it match the narration at that second? Does the picture appear just before or on its word? (blocker if not)
3. Typography: sizes, hierarchy, overflow, orphan words, contrast, accent word visible. (major)
4. Characters: same design and colours in every shot, readable face and silhouette, pose fits the line, mouth moves with speech. (major)
5. Evidence: the capture is the real thing, legible, source named, important area highlighted, no private data. (blocker)
6. Transitions: the motion direction continues, no accidental flash or dead frame, sound pairing present. (minor)
7. Style fidelity: obeys the pack rules (palette, lighting, camera, type); nothing from another style leaks in. (major)
8. Collisions: moving things do not cross labels or captions by accident; nothing clipped by the frame. (major)
9. Quality: no placeholder text, no MISSING COMPONENT, no lorem, no debug overlay, no flicker between consecutive frames. (blocker)

## Loop
Fix, re-render only the affected stills, re-check. Max 3 rounds; then list what is left for the user. Score = 100 - 25/blocker - 10/major - 3/minor; `pass` >= 80 and no blocker.

Colour and grading problems: `node $TK/tools/rs.mjs color-correction effects`.
