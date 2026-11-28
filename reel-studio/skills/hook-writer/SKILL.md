---
name: hook-writer
description: Writes and chooses the first 3 seconds of a short: five hook options from proven patterns, scored, one winner with its first-frame picture and first sound. Use at the script stage before any other line is written.
---

# Hook writer

The hook is a promise plus a stake, spoken in under 3 seconds, matched by the first picture. Read `foundation/playbooks/hook-cta.json` (`node tools/playbook.mjs query hook-cta --when hook`) and write the options in `script/hooks.json`.

## Procedure
1. Name the viewer's gap in one sentence (what do they want that they cannot get?).
2. Write five hooks, one per pattern that fits the format: warning/negation, absurd stake, social proof, world rule, cold-open dialogue, tutorial promise. Each is at most the playbook's `max_words`, contains a number or a concrete noun, has no greeting and no 'in this video'.
3. For each hook write the first frame (what the viewer sees in frame 0), the first word on screen, and the first sound (a hit, a riser, silence, a voice).
4. Score each 0-3 on: curiosity gap, stake, specificity (number/noun), speakability (fits 3 s at the style's words per second), match with the first frame. Keep the highest; if the top score is below 11/15 write five more.
5. The last line of the script must echo the hook (loop) or flip it.

## Output `script/hooks.json`
`{ "options": [{ "pattern", "text", "first_frame", "first_word_on_screen", "first_sound", "scores": {...}, "total" }], "winner": <index>, "why": "..." }`

## Refuse
Greetings, channel names, 'today we', questions with an obvious answer, a hook the first frame cannot show.

## Short-story hooks (see skills/story-writer/SKILL.md)
For 10-20 s story shorts: 14 words or fewer, person + goal + clock or contradiction, mid-action, no greeting. Run `node tools/script_lint.mjs` (hook-length, hook-setup, hook-hard).
