# Workflow: from a request to a sealed video

```
intake -> style -> topic -> research -> script -> script_critic -> STORYBOARD (frame by frame)
       -> audio -> typography -> captions -> production (go for the full render)
       -> build -> critics -> targeted fixes -> final -> deliver (seal)
```
Gates (user approves, tied to file fingerprints): direction, script_review, storyboard_review, sound_review, final. Everything else is checked by tools and critics.
`state.mjs request` writes `review/approvals/<stage>.md` and stops; `approve --quote "<words>"` records the user's own words; editing an approved file makes the approval stale. `--delegated` is allowed only for intake to script_critic, when the user said to run through; the receipt marks those as DELEGATED. `seal` writes `renders/<name>.receipt.json` (it cannot stop someone hand-editing `state.json`, and says so).

## Where the choices are shown
| gate | the user sees | tool |
|---|---|---|
| style | a numbered sheet of real preview stills, compare two, detail, combine, "like this reference" | `gallery.mjs --kind styles`, `combine_styles.mjs`, `new_style_from_reference.mjs` |
| storyboard | contact sheet, one image per shot with the reason; alternatives per shot; replace a frame or add a reference image | `storyboard_review.mjs`, `storyboard_alts.mjs`, `storyboard_edit.mjs`, `state.mjs frame` |
| audio | voice samples (voices, speeds), music beds, sound-effect set, pronunciations | `audio/preview_audio.mjs`, `choose.mjs voice` |
| typography, captions | animated previews on the project's own picture and words | `gallery.mjs --kind typography|captions|layout` |
| final | the film, contact sheet, critic summary; reject, replace shot, change music/captions/transition/pacing | `critique.mjs`, `state.mjs change`, `fix_plan.mjs` |

## Critics
`tools/critique.mjs <P> <name|all|stage:x|vision ...>`. Automatic (measure real files): research, script, storyboard (with the cinematography critic), captions, voice, music, sfx, frames, video, final, reference. Vision (the agent must open the images; the tool checks which images were listed): character, environment, camera, composition, typography, ui, transitions. Every finding: severity, shot/line, timestamp, evidence, problem, expected, fix target, fix. Reports in `review/critics/*.json`, summary in `SUMMARY.md`, plan in `FIX_PLAN.md`.

## Targeted correction
`render_segments.mjs` renders each shot to its own silent clip, cached by a hash of the shot, its captions, the template code, style data and public assets. `assemble.mjs` joins the clips, lays the mix and normalises loudness. Changing one shot re-rendered 1 of 5 clips in 21 s instead of 132 s (quarter size, software GL).

## Cinematography
No schedule. A shot's `camera` names framing, angle and movement; a move must give why, from, to, target, duration, profile, curve, focus and constraints. `check_cinematography.mjs` rejects a move with no real reason, a move that does not do what its name says, too-fast moves, a subject leaving the safe frame, jump cuts, axis crossings, screen-direction flips, teleporting characters or props, and unexplained transitions. Static shots are valid. See `docs/CINEMATOGRAPHY.md`.
