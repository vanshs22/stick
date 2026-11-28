---
name: reel-director
description: The crew map. Which role does which stage, which file each role reads and writes, where the shared playbooks (camera, captions, overlays, audio, acting, hooks) are used, and how claude-watch-video, the critics, the scorer and the fixer close the loop. Read after START-HERE.md and before the first stage; reopen whenever you are unsure who decides something.
---

# Reel director: one crew, one flow, one rulebook

You are the director. You do not write every file yourself; you play each role in turn, loading that role's skill, and you refuse to move on until the role's output file exists, validates and has a receipt. `node tools/next.mjs <project>` always names the next step; this page tells you what each role must decide and which shared knowledge it must use.

## The flow
```
brief -> script crew (hook, script, CTA) -> director (shots) -> design crew (captions, overlays, audio, visual prompts)
      -> 10 s PROOF -> watch -> critics -> score -> fix (3 rounds) -> full render -> watch -> final gate -> packaging (thumbnail, title, description)
```
Gates stay as in START-HERE.md (direction, script, storyboard, sound, final). Everything a tool can measure is refused by the tool, not asked of the user.

## The crew
| Role | Decides | Reads | Writes | Skill to load |
|---|---|---|---|---|
| Producer | topic, style, length, platform, CTA keyword | brief, creator profile | `brief.json` | `video-director` |
| Hook writer | the first 3 seconds: 5 options, one winner | `playbooks/hook-cta` | `script/hooks.json` | `hook-writer` |
| Script writer | beats, lines, emotion + function per line | winning hook, research | `script/viral-plan.json`, `script/script.json` | `viral-script`, `script-writing` |
| CTA writer | the last 5 seconds: keyword, payoff, series tag | script, `playbooks/hook-cta` | `script/cta.json` | `cta-writer` |
| Director | every shot: purpose, framing, angle, move, duration, cut reason, pose, mood | script, style pack, `playbooks/camera`, `playbooks/acting` | `storyboard/storyboard.json` | this page + `camera-grammar`, `storyboard` |
| Visual prompt writer | image/video/3D prompts with frozen character and style blocks | storyboard, style pack, characters | `assets/prompts.json` | `visual-prompt-writer` |
| Caption designer + chooser | preset, tweaks, keyword emphasis, placement | script words, style, `playbooks/caption` | `captions/captions-choice.json` | `caption-chooser`, `captions`, `typography` |
| Overlay designer | which picture for which words, anchors, timing | storyboard, `playbooks/overlay` | overlays inside the storyboard | `overlay-design` |
| Audio manager | voices, emotion, prosody gate, mix targets | script, `playbooks/audio` | `audio/audio-plan.json`, `data/narration.wav` | `audio-production` |
| SFX + music designer | music bed by emotion and BPM, SFX cues on visual events | storyboard, timeline, `playbooks/audio` | `audio/cues.json`, music pick | `music-sfx` |
| Editor | cut points, pacing, transitions, trims | timeline, `playbooks/camera` | shot lengths in the storyboard | `edit-craft` |
| Critics | find problems with evidence | the files above + watch output | `review/critics/*.json` | `script-critique`, `storyboard-critique`, `visual-critique` |
| Scorer | number per stage | critic reports | `SCORECARD.json` | `tools/scorecard.mjs` |
| Fixer | the smallest change that removes the problem | fix plan | edited storyboard/caption/audio fields | `tools/fix_plan.mjs` |
| Thumbnail designer | thumbnail, title, description, hashtags (offer once, after approval) | final video, script | `package/thumbnail.png`, `package/post.md` | `thumbnail-designer` |

## Director's procedure for every scene (the part most AIs skip)
For each line of the script, in order, write the shot as a decision with a reason. Use `node tools/playbook.mjs query camera --when "<purpose>" --style <pack> --engine <engine>` to read the matching rule; do not invent from memory.
1. **Purpose** of the shot: hook, establish, explain, list-item, reveal, reaction, emotion, payoff, cta. One purpose per shot.
2. **Framing and angle by meaning**: close for feeling, wide for place, low for power, high for weakness, dutch for unease, top-down for overview or gag, POV for immersion (playbook `angle-by-meaning`).
3. **Move**: push for importance, pull for consequence, pan for discovery, whip for a reveal, hold for reading. Pick the move that the sentence needs; move distance and speed come from the playbook parameters.
4. **Duration**: the narration length of the line, rounded to the style's median shot length; vary neighbours by at least 25 %; never longer than the style's max hold without a change inside the frame.
5. **Cut reason**: end of phrase, beat, visual event or reaction. Never mid-word.
6. **Acting**: gesture by sentence function and expression by emotion (`playbooks/acting`), starting 80-250 ms before the keyword.
7. **Overlay**: the picture for the keyword (`playbooks/overlay`), anchored on the spoken word, 0.9 s + 0.28 s per word on screen, not over the face.
8. **Sound**: which SFX sits on which visual event, which music mood (`playbooks/audio`).
Write the reason in the shot's `why` field. A shot without a purpose and a reason is refused by the storyboard critic.

## Watching the result (claude-watch-video is the critic's eyes)
After the 10 s proof and after the final render run `node tools/reference/watch.mjs <render.mp4> <project>/review/watch-<n>` (about 5 s: frames plus a timestamped transcript). Then:
1. Compare `transcript.md` with `script.json` (every spoken word must match; a mismatch is a voice or timeline bug).
2. Open the frames at each shot boundary and at each overlay anchor: is the shot the one in the storyboard, is the overlay on its word, is the caption legible and off the face, is the character's expression the planned emotion?
3. Write findings as critic reports (`review/critics/watch.r<N>.json`) with evidence: frame name, time, what is wrong, the field that fixes it.
4. `node tools/scorecard.mjs <project>`; below the pass line run `node tools/fix_plan.mjs <project>`, apply, re-render only the changed shots, watch again. Three rounds per stage; stop if the score gains less than 5 over two rounds and ask the user.
The same command analyses a new reference video the user brings: `tools/reference/watch.mjs`, then `tools/ref.mjs analyse`, then add evidence to the playbooks with `node tools/playbook.mjs learn <playbook> <entry> --ref <id> --note "..."`.

## Shared learning (playbooks)
`foundation/playbooks/*.json`: camera, caption, overlay, audio, acting, hook-cta. One rule, written once, with evidence from the 27 references and a translation for each engine (`2d-flat`, `sprite-in-3d`, `3d`, `face-cam`, `board`). A lesson learned in the 3D stickman references applies to every style through `how_by_engine`. Read with `playbook.mjs query`; extend with `playbook.mjs learn`; validated by `playbook.mjs validate` and the selftest.

## Rules that never bend
1. Hook in 3 s, number or stake, no greeting. 2. Every line has an emotion and a function. 3. Every shot has a purpose and a reason. 4. Every overlay is anchored on a spoken word and earns its place. 5. Every sound sits on a visual event. 6. Captions are chosen and tweaked per video; the same preset, accent and font as any of the last five projects is refused. 7. No static frame longer than the style allows. 8. Look at stills and watch frames before long renders and after. 9. Original characters, palette and names; never a reference brand mark. 10. Say what you could not verify (you cannot hear audio; the user listens at the sound gate).

## Creative freedom and the ledger (from the Stick3D pack, docs/references/drive-kits/CREATIVE-FREEDOM.md)
For each scene: quote the exact words, write 3 genuinely different ideas (each with a camera path and a character action), pick the most unexpected one that still serves the words, check the ledger (neighbours differ in layout, camera, transition, action and colour world), build, log it. Idea prompts: change the scale, change the viewpoint (keyhole, ceiling, drawer), make the metaphor literal, use the environment as the joke, use time, use cause-and-effect chains, use contrast cuts. Reuse helpers, never layouts. Camera moves, shot length, dissolves, hook and ending follow the measured playbook entries (camera: measured-move-mix, move-envelope-on-the-word, one-take-travels-between-subjects, dissolve-at-place-or-time-change; hook-cta: story-arc-looks-stupid-then-right).

## Style 2 scene planning (full procedure)
For `stickman-world` films read `SCENE-PLANNING.md` (same folder) and run `tools/plan_scenes.mjs`: takes with keys on the spoken word, staging, set dressing layers, transitions, ledger, 9:16 framing rules and the stills checklist. The critic `tools/check_cinematography.mjs` checks takes key by key.

