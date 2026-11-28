# What the three Drive folders teach (and what we took)

Folders read: `plugin` (Stick3D-Pack-v4, a 3D stick-figure master prompt, a Claude Code prompt), `1DmL...` (animated-shorts-kit, MASTER_PROMPT.md), `19Gb...` (cartoon-short-kit, cartoon-audio-short SKILL.md, reachmora-2d-longform). Raw rule files are copied to `docs/references/drive-kits/`. We take RULES and measurements only. We do not copy their characters, names, example stories or code verbatim (ReachMora asks for its credit if its skill is shared; the animated kit builds on mromidev/claude-animated-shorts, MIT).

## What they have that we were missing
| area | what the kits do | status in our toolkit |
|---|---|---|
| Camera grammar, measured | avg shot 4.2 s, about 1 hard cut per video, 13 short dissolves per 65 s at place and time changes, camera moving 77 percent of the time, push-in 53 percent, velocity peak at 40 percent of a move, moves land on the noun | DONE: camera playbook entries `measured-move-mix`, `move-envelope-on-the-word`, `one-take-travels-between-subjects`, `dissolve-at-place-or-time-change` |
| Story formula | looks stupid, people laugh, gets worse, he was right, karma; one-sentence hook; 145-250 words at 3.3-3.8 w/s; ending on the twist | DONE: hook-cta entries `story-arc-looks-stupid-then-right`, `hook-strange-action-he`, `script-800-900-chars-mid-action` |
| Acting and physics | feet on surface, walk phase = distance, anticipation, parented props, doors as real openings, no teleporting; micro-acting and secondary motion | DONE: acting entries `physical-honesty-checklist`, `secondary-motion-and-micro-acting` |
| Audio ratio | music 50 percent of voice (-6 dB gated RMS), SFX 50 percent with peaks capped, -14 LUFS, limiter, no ducking that changes the ratio, under 8 SFX per 20 s | DONE (rule): audio entry `music-and-sfx-at-half-the-voice`. TODO: wire into our mix tool as a gate |
| Character shape rules | egg head, variable ink 2.3-2.6 ratio heavy on shadow side, wedge brows, no nose, askew hats, wedge shoes, asymmetry budget | DONE: `skills/character-design/SHAPE-RULES-measured.md` (our style 2 look already matches most of it) |
| Creative freedom and ledger | 3 ideas per scene, pick the most unexpected, neighbours must differ | DONE: reel-director skill section |
| Hard gates | logic and framing checkers on every frame, no render while one fails | DONE (rules in final-quality-control). TODO: a code checker for our 3D shots (subject inside frame, camera clear of geometry, no walk-through) |
| Look: ink pass | normal+depth edge pass draws black ink on 3D geometry (near side of depth jumps, creases from the normal dot), 2-step toon ramp, painted canvas textures, 48-tap depth of field | TODO (engine): add an optional `look.ink` post pass to three/engine.js. Our style 2 world is lit and realistic like r21/r26, so this is for the toon styles |
| Timing | word timestamps from the script, silence-aligned fallback | we already align with Whisper and the script; keep |
| Process | one agent per problem with its own files, a judge agent each round, keep every version, render previews on the user's PC, contact sheet before the long render | DONE in our crew skills; keep the versioning rule |

## Honest limits
These kits target a toon-world look (inked 3D, flat cards). Our reference frames r21 and r26 are lit and realistic, so we use the camera, story, acting, audio and shape rules everywhere, and the ink pass only for toon styles.
