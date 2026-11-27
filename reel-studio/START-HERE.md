# Start here (any AI, any style, any topic)

You make short vertical videos with this folder. No paid API. You think; the toolkit measures, renders and refuses shortcuts. Read this page, then `RUNBOOK.md` (one page). Everything else is opened only when `next.mjs` names it.

## The flow in one picture
```
install -> brief -> style -> [reference?] -> topic -> research -> VIRAL PLAN + script -> visual concept -> storyboard (look at stills) -> assets -> audio -> typography -> captions -> build -> look + listen -> ship
```
Run `node tools/next.mjs <project>` after every step: it prints the ONE next step, the skill to read and the exact commands. At a gate it says ASK THE USER and stops. There are only FIVE gates (direction, script, storyboard frames + assets, sound, final): everything a tool can measure is refused by the tool and never asked of the user. You never approve for the user.

## The 10 rules that decide quality (details in `skills/reel-craft/SKILL.md`)
1. **Plan the script before writing it.** `node tools/script_studio.mjs new <P> --format <f>`, write 3 hooks, fill `script/viral-plan.json`, then the script, then `script_studio.mjs score`.
2. **Hook in 3 seconds**, no greeting; a new fact, picture or sound every 3 seconds; the last line echoes the first.
3. **Show what the voice cannot say.** Every line gets a device (card, mockup, proof, counter, sticker) with a reason; real evidence is captured, never drawn.
4. **Casting:** two speakers means `cast` + `speaker` + `emotion`; a female role has a female voice; each face has its own `presenter.look` or character look.
5. **Sound belongs to a visual event** (anchor word or transition). Soft under the voice. Real music/backgrounds are fetched with licences (`tools/assets/fetch.mjs`).
6. **Look before you render long.** `build_video.mjs <P> --estimate --scale 0.25` then `preview_shots.mjs <P>`: one still per shot. Fix composition there (minutes), not after a 15-minute render.
7. **Look after every render.** Contact sheet, then `critique.mjs <P> all`, then `audio/ears.py <P>`. The critics passed films that had the wrong face on a speaker: your eyes come first.
8. **Reference image or video?** Read `skills/reference-style/SKILL.md` first. `reference/ingest.mjs`, then `style_brief.mjs --template` (it measures light, blur, warm/cool, face, palette), LOOK and fill the sheet (character design, materials, set, lighting, camera, colour), `--validate`, `style_map.mjs` (closest pack, overrides, an honest fidelity table), `blueprint.mjs` (video), `twist.mjs --idea "..." --levers ...`. Copy the LOOK, never the content; tell the user what the engine cannot match; prove it with `critique.mjs <P> style` and `style_check.mjs`.
9. **Your own style on a pack:** put `style-overrides.json` in the project (`{"colors":{...},"safe_zone":{...},"effects":{...}}`); the pack stays untouched. For a new look from scratch copy `style-packs/_template`.
10. **Deliver:** `build_video.mjs <P> --upscale` writes the 1080x1920 master (QA runs on it) and a 2160x3840 Lanczos file made from it. Say what you could not verify (listening, taste).

## Speed (same pixels, less waiting)
2D cards render in about a minute per film; a 3D shot costs about 3 minutes without a GPU (set `REMOTION_GL=angle` on a machine with one: far faster). Shots are cached by content hash: fix one shot, only that shot re-renders. Use `--scale 0.5` for iteration. Rendering uses all cores but two.

## When something is wrong
`node tools/doctor.mjs` (what is missing and the exact fix), `TROUBLESHOOTING.md`, `docs/STATUS.md` (what is tested and what is not). Production mode never edits `tools/`; toolkit development mode may, and must add a test.

Camera and cut decisions are common to every style: read `skills/camera-grammar/SKILL.md` before the storyboard; the style pack names its cadence profile and the checkers compare the real shot lengths with it.

Portrait or landscape: set `"aspect"` (`9:16` or `16:9`) in `brief.json`. Every style pack works in both; `node tools/other_layout.mjs <project>` shows the same shots in the other layout (see `skills/camera-grammar`).

## Where the craft lives (read before the step it covers)
`docs/STYLE-GUIDE.md` (new looks) · `docs/CHARACTER-BIBLE.md` (characters, faces, emotions) · `docs/CAMERA-GRAMMAR.md` · `docs/OVERLAY-GRAMMAR.md` · `docs/AUDIO-MUSIC.md` · `docs/CAPTIONS-TYPOGRAPHY.md` · `docs/PHOTOREAL.md` · `docs/LONGFORM-LANDSCAPE.md` · `docs/INKBEAT.md` · `docs/TECH-STACK.md` · `docs/REQUIREMENTS.md`. Show every gate in the chat with `node tools/present.mjs <project> <view>`; three approvals by default (direction, blueprint, final).
