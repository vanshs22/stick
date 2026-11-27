# Roles, handoffs and the score-and-alter loop

One agent can play every role in turn. The roles keep their jobs separate through files, so each stage has an owner, an input, an output and someone who can say no.

| Role | Reads | Writes | Skill to load | Can veto with |
|---|---|---|---|---|
| Director (the only role that talks to the user) | brief, style pack, `upgrade.json` | `direction.json`, gate requests | `skills/video-director` | the three human gates |
| Writer | direction | `script/script.json` (line `emotion`, beats) | `skills/script-writing`, `skills/viral-script` | script + viral critics |
| Cinematographer | script, pack `camera` data | storyboard `props.camera`, shot order | `skills/camera-grammar` | `check_cinematography`, logic critic (facing) |
| Art director | cast, world, pack look | storyboard `cast`, `props3d`, `look` | `skills/design-craft`, `skills/character-design` | logic critic (overlap, inside furniture, continuity), visual critic |
| Editor | storyboard, timeline | overlays, anchors, captions placement | `skills/edit-craft`, `skills/overlay-design`, `skills/captions` | storyboard, captions, layout critics |
| Sound designer | script, audio plan | `audio/audio-plan.json`, cues | `skills/music-sfx`, `skills/audio-production` | voice, music, sfx critics |
| Critics (read-only, independent) | any artifact | `review/critics/*.json`, `review/SCORECARD.json` | `tools/critique.mjs` | block a stage |

## Human gates (three)
1. Concept and style (direction + pack + `upgrade.json`).
2. The 10 second proof.
3. Final.
Everything else is agent to critic. The existing approval receipts (`tools/state.mjs`) stay the record.

## Score-and-alter loop
```
node tools/critique.mjs <P> all        # or stage:<stage>
node tools/scorecard.mjs <P>           # per-stage score, round count, next action
node tools/fix_plan.mjs <P>            # what to change and the smallest re-run
```
- Stage score = lowest critic score in the stage. Pass marks: script 85, storyboard 85 (no blocker), audio 80, captions 90, sfx 85, overlays 85, final 90. Overall (weighted) at least 88.
- At most 3 fix rounds per stage. A stage that gains under 5 points over two rounds is escalated: stop and ask the user.
- The fixer MAY change: storyboard fields (`cast.at`, `rotY`, `lookAt`, `mood`, `pose`, `camera`, `overlays`, `anchors`, `sfx`), caption placement, audio gains.
- The fixer may NOT change: script text or line emotion without a new script round, approved or locked fields, the style pack.
- Every fix names the finding id it answers. Re-run only the critic that raised it, then the scorecard.

## What the logic critic covers and does not
Covers (storyboard JSON, before any render): characters overlapping each other, standing inside furniture or scenery, back turned to what they look at or talk to, mood against the line emotion, same character or prop changing between shots. Floor footprints only: arms, hats, and animated paths are not checked. Footprints and radii live in `remotion-template/src/three/cast-data.json`; add one for every new prop or character kind or the critic cannot see it.
Also covered: overlay anchor, shot window, read time and price tag on a number (`overlays` critic); music mood against the beat's line emotions (`mood`); where each sound cue really starts in `data/mix.wav` (`sync`); a named speaker needs a speaking character.
Not yet covered (planned): caption or overlay over a face in rendered pixels, 180 degree rule in dialogue, mouth shape against the narration envelope at render time.
