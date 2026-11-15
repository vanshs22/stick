# The agent team

One request (`node studio.mjs new "..."`) moves through a fixed line of workers. Every worker has a critic that scores its output and can send it back once.
Work is saved in `jobs/<id>/job.json` after each stage, so a stopped job resumes. The expensive render only starts after you approve a cheap preview.

| # | Stage | Worker (`agents/`) | Critic (what it checks) | AI use |
|---|---|---|---|---|
| 1 | research | `research.mjs` trend researcher (Agent-Reach, public web) | none (advisory) | none |
| 2 | script | `writer.mjs` script writer / editor | hook strength, length vs target seconds, beat count, call to action, viral score | 1 call, only if no script or a fix is needed |
| 3 | style | `styler.mjs` style selector | none (rules + what you liked before) | none |
| 4 | storyboard | `storyboard.mjs` storyboard, scene and caption writer (runs `director/`) | hook, duration, emotion variety, card variety, shot variety, viral score; a failed check rewrites the script once | 1 call (scene planner), cached |
| 5 | sound | `sound.mjs` music and SFX selector | after the mix: sound at every cut, no pile-ups, only sounds the mixer has | none |
| 6 | prepare | `editor.mjs` editor (voice, word timing, auto-fixes, mix, contact sheet) | | none |
| 7 | preview | `critics.mjs` visual critic | 6 real frames: brightness and contrast for the 3D families; too dark raises exposure and looks again | none |
| 8 | approval | director (`studio.mjs`) | you decide: `approve`, or `revise "notes"` | none |
| 9 | render | `editor.mjs` | | none |
| 10 | final | `critics.mjs` final critic (loudness, peaks, black/frozen frames, length, size) | | none |
| 11 | learn | `learning.mjs` learning agent | | none |

Not separate agents, on purpose: the "prompt writer" and "scene writer" are the storyboard (the renderer is code, so the plan is the prompt). Everything an AI could do is validated against fixed lists and merged over the rule plan, so a missing or wrong answer cannot break a video.

## Learning
`node studio.mjs feedback <id> good|bad "notes"` turns words into small numeric preferences per style (`memory/prefs.json`): "too dark" raises exposure, "captions small" enlarges them, "too fast" slows the voice, "music loud", "too many sound effects". The next video in that style applies them. `memory/runs.jsonl` keeps every run (scores, recurring critic issues, feedback); the style selector prefers the style you rated best, and the writer prompt gets your last notes.
Brand kit: `memory/brand.json` `{ "presenter": {...}, "accent": "#hex" }` keeps the host's look and colours the same across videos.

## Speed and quality ladder
`--turbo` (0.5x, 20 fps, draft encode) for previews, `--fast` (0.75x, 24 fps), full (1x, 30 fps). The studio previews in turbo, asks you, then renders once.
