# Style guide: use a style, make a style, add a new one

A **style** is how a film LOOKS (colour, type, cards, characters, camera, sound palette). It never changes how the film is MADE. Every style, 2D or 3D, portrait or landscape, goes through the same five gates, the same script editor and critics, the same voice, mix, captions and QA. Choosing a style is choosing a wardrobe, not a different studio.

## What stays the same for every style (the contract)
| Part | Where | Same for every style |
|---|---|---|
| Intake, topic, research, real evidence | `video-director`, `video-research` | yes |
| Script: promise, hooks, beats, open loops, word anchors | `script-writing`, `viral-script`, `tools/script_studio.mjs` | yes |
| Gates: `direction`, `script_review`, `storyboard_review`, `sound_review`, `final` | `tools/state.mjs`, `RUNBOOK.md` | yes |
| Voice, emotion, music, sound effects tied to visual events, loudness | `skills/audio-production`, `tools/audio/` | yes |
| Captions (presets, word timing) | `skills/captions` | yes (a pack may set the colour and position) |
| Camera grammar: every move has a reason, a word anchor, a profile | `skills/camera-grammar`, `check_cinematography.mjs` | yes (a pack names its `cadence`) |
| Critics, layout probe, QA, YouTube package | `tools/critics/`, `package_youtube.mjs` | yes |

What a style may change: colours, fonts, window chrome (`clean`, `sticker`, `glass`), effects (grain, vignette, paper, dots, bokeh), the host (`presenter`), the 3D world and characters, safe zones, the cadence profile, the sound palette direction, and its own rules and pitfalls.

## 1. Use an existing style
1. `node tools/gallery.mjs <project> --kind styles` shows the packs with real previews (`style-packs/<id>/preview/`). `--compare a,b` puts two side by side.
2. The user picks; you record it: `node tools/choose.mjs <project> style <id>`.
3. Check it in the frame shape you will deliver. `node tools/other_layout.mjs <project>` draws the project's own shots in the other layout, and `node tools/layout_lab.mjs --style <id> --aspect 16:9` measures every card of that style (see `docs/LONGFORM-LANDSCAPE.md`).
4. Tweak without touching the pack: `<project>/style-overrides.json` (deep-merged over the pack): `{"colors":{"accent":"#FF3B6B"},"effects":{"grain":0.1},"fonts":{"sans":"Poppins"}}`.

## 2. Ask for a new style: the Style Studio flow
The user says "make it a hand-drawn chalkboard look" or "dark neon tech". You do NOT start the film. You show pictures first.

1. **Read what they want.** Write the brief in one sentence. A reference image or video? Read `skills/reference-style/SKILL.md` first (measured look, honest fidelity table).
2. **Pick the base.** The closest 2D or Stage3D pack (`gallery.mjs`). A look is a variation on a base; the base provides every card, overlay and layout rule, already measured in both frame shapes.
3. **Write 4 looks** as `variants.json` (or let the tool use its four recipes: faithful, dark/light, warm, bold):
```json
[{"id":"v1","label":"Chalk on slate","why":"hand-made, calm, teacher feel",
  "overrides":{"colors":{"bg":"#23302B","ink":"#F2F0E6","card":"#2E3B35","accent":"#F2C94C"},
               "fonts":{"sans":"Poppins","serif":"InstrumentSerif"},"effects":{"grain":0.12,"vignette":0.25},"chrome":"sticker"}}]
```
`overrides` has the shape of `style-overrides.json`. Make the four looks DIFFERENT on purpose (not four shades of one idea).
4. **Render the choices:** `node tools/style_studio.mjs propose <name> --brief "..." --base editorial-sticker --aspect 16:9 --variants variants.json`. It renders the same four shots (title, stat, real-page card, checklist) in each look and writes `style-studio/<name>/choices.jpg`, one row per look.
5. **LOOK at the image yourself first** (text readable? contrast? one accent?). Fix what you see, then show the user and ask ONE question: which look, or what to change.
6. **Refine:** `node tools/style_studio.mjs refine <name> --from v2 --set colors.accent=#ff5a3c --set effects.grain=0.12 --label "v2, hotter accent"`. A new row is added. Repeat until the user says yes.
7. **Approve (the user's own words):** `node tools/style_studio.mjs approve <name> --pick v5 --id chalk-slate --quote "<their words>"`. It writes `style-packs/chalk-slate/{style.json,STYLE.md,preview/look.jpg}`, validated against `schemas/style-pack.schema.json`. An existing pack is never overwritten, and nobody can approve for the user (`--quote` is required).
8. `node tools/choose.mjs <project> style chalk-slate`. From here the film goes through the normal gates. The style gate in the project is the user's second approval of the same look, now on their own script.

Honest limits of the Studio: it varies what the pack JSON can express (colours, type, chrome, effects, host, Stage3D world and cast presets). A change in SHAPE (a new kind of card, a new character model) is code: add the component to `remotion-template/src/components/` (registry + manifest, both layouts, run the layout lab) or a new world in `remotion-template/src/three/worlds.js`.

## 3. Anatomy of a pack (`style-packs/<id>/`)
| File / field | What it does |
|---|---|
| `style.json` `id name family description` | identity; `family` is `2d`, `3d` or `mixed` |
| `tokens.colors` | `bg ink ink2 muted card accent accentSoft good bad`. One accent only |
| `tokens.bgs` | named page colours a shot can use (`bg: "dark"`). **`bgs.paper` is the default page**: an override of `colors.bg` also moves it (`syncProject` does this) |
| `tokens.fonts` | `sans serif mono` (Google Fonts names the template can load) |
| `tokens.safe_zone` | portrait px on 1080x1920: `top bottom caption_y right_margin content_top content_bottom` |
| `tokens.safe_zone_landscape` | optional px on 1920x1080 to override the derived landscape zones |
| `tokens.chrome` | window look: `clean`, `sticker`, `glass` |
| `tokens.presenter` | an illustrated host (skin, hair, beard, hat, glasses, jacket, x, y, scale). In landscape the host takes the left 40 percent |
| `tokens.caption` | caption fill and stroke colours |
| `overlay_skin` | optional: the visual language of overlays for this look (`skills/overlay-design/skins.json`: the words for STEP/PASSED/FAILED/FREE and the preferred devices). `tools/overlay_director.mjs` reads it |
| `effects` | `dots paper grain vignette bokeh rain halftone` |
| `defaults.backdrop` | a Stage3D world the 2D cards sit on (soft focus) |
| `engine` | omitted = `remotion` (2D + Stage3D); `inkbeat` = the 3D toon engine in `renderers/inkbeat` |
| `formats` | `["16:9","9:16"]` the frame shapes the pack was checked in |
| `cadence` | camera-grammar profile (`skills/camera-grammar`) |
| `rules`, `pitfalls`, `camera_language`, `audio_direction`, `transitions` | the art direction in sentences, with do and do-not. Write what you learned the hard way |
| `STYLE.md` | the same art direction in prose, for the next agent |
| `preview/` | `look.jpg` (Studio), `motion.mp4`, `sample.mp4` |

Rules of a good pack: one light logic, one accent, a fixed type system, a camera grammar, a sound palette, original characters and designs (learn technique from references, never copy their characters or words).

## 4. A new 3D look (inkbeat engine): it is data, and it goes through the Studio
Realistic-toon, clay, anime, claymation, storybook and so on are looks of the inkbeat engine. A look is the `ink_look` data in the pack (moods = light, sky, grade; a hero; a set built from primitives; schema in `docs/INKBEAT.md`). No code is written.
1. Write 3 to 4 DIFFERENT `ink_look` variants (different set palette, key light colour and shading ramp, not only the sky) in `variants.json`. Start from `skills/style-studio/ink-variants.example.json`.
2. `node tools/style_studio.mjs propose <name> --engine inkbeat --brief "..." --variants variants.json --aspect 9:16|16:9` renders wide, medium and close of each look with the real 3D engine into `choices.jpg` (one row per look).
3. Open `choices.jpg` yourself and fix what you see (washed colours, props out of frame, a set that is an empty room) BEFORE the user sees it. Show it; ask ONE question.
4. `refine <name> --from v2 --set moods.main.patch.post.grade.saturation=1.3 --set set.props.3.c=#ff0000` (or `--patch file.json`) edits the data and renders again.
5. `approve <name> --pick v3 --id <pack-id> --quote "<the user's words>"` writes `style-packs/<id>/style.json` with `ink_look`. Then the normal pipeline: `choose.mjs`, script, gates, voice, `scaffold_plan.mjs`, storyboard stills (`tools/ink/stills.mjs`), render.
6. Look at the storyboard stills BEFORE the render. Author the shot that shows the story's key object (`cam.aim`), keep the hero in frame, fix hard foreground blocks.
Still code (rare): a new character BODY type or a new material/shader. A new hero look (hair, outfit, colours, proportions) and any set are data.
Cost: about 1 to 2 minutes per still and about 15 to 25 minutes per 10 s of film at preview size without a GPU.

## 5. Definition of done for a style
- `node tools/validate.mjs style-pack style-packs/<id>/style.json` is ok.
- `node tools/layout_lab.mjs --style <id> --aspect both` prints `pass` for both layouts (2D and Stage3D packs).
- `choices.jpg` or `looks-*.jpg` was LOOKED at: text readable, one accent, nothing milky or cut off.
- `STYLE.md` says what to do and what never to do; `formats` lists what was really checked.
- One test film (or a 10-shot storyboard) went through `build_video.mjs` and `critique.mjs all` in the frame shape it will be used in.
