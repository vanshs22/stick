---
name: script-critique
description: Reviews and improves a video script like a tough editor - hook, clarity, pacing, claims, visualisability - and returns a structured critic report. Use after every script draft and before the user sees it.
---

# Script critic

Read `script/script.json` and `research/research.json`. Write `review/script-critic.json` (schema `critic-report`, critic `script`), validate it, then fix what it finds and re-check. Max 3 rounds.

## Checklist (each failure becomes a finding with `line_id`, `evidence` = the exact words, `expected`, `fix`, `fix_target`)
1. Hook: stated in <= 11 words, specific, visualisable in one second, not a greeting or a topic announcement. (blocker)
2. First 3 seconds promise something the rest delivers. (major)
3. One idea per line; no line over 18 words unless the style pack allows it. (minor)
4. Every claim id exists in the research and is `verified`. Any number without a source is a blocker. (blocker, fix_target `research`)
5. Every line can be shown: it has a `visual_hint` that a real page, object, character action or diagram can satisfy. (major)
6. Flow: each line leads to the next; no repeated point; objections answered; a real proof beat exists. (major)
7. Length: `est_seconds` within +/- 15 percent of the brief. (major)
8. CTA before "save", "save" last, keyword matches the brief. (minor)
9. Voice test: read it aloud in your head. Phrases that no person says are rewritten. (minor)
10. Originality: no sentence copied from a competitor or reference. (blocker)

## Score
Start at 100. Subtract 25 per blocker, 10 per major, 3 per minor. `pass` needs score >= 80 and no blocker; `revise` otherwise.

## Rewrite rule
When a line fails, rewrite that line and any neighbour that depends on it. Show the user a short diff ("L04: before -> after, because ...") at the script gate, not the whole critic report.
