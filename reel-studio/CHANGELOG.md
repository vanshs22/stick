# Changelog

## Drawn camp look, patterned panels, faster inkbeat renders
- `panel` prop with 7 image patterns, `cast` flag, drawn stick hero recipe, `style-packs/drawn-camp-3d`, `examples/inkbeat-camp`, `docs/INKBEAT.md` (reference comparison and speed sections).
- `--quality master|fast|draft` and `--fps-div N` on `build_video.mjs` and `tools/ink/render_segments_ink.mjs`; `tools/ink/bench.mjs`; scale snapped to whole pixels; the look is part of the shot cache key; no stand-in crates in data-made sets; default concurrency 3.

## 3D looks as data, story brain, unusual-idea overlays
- **3D looks are data.** `ink_look` in a style pack (moods, hero, set from primitives) is built by `renderers/inkbeat/src/looks/custom.tsx`; `tools/style_studio.mjs propose --engine inkbeat --variants f.json` renders wide/medium/close with the real engine into `choices.jpg`; `refine --set path=value | --patch file`; `approve` writes the pack. `tools/ink/look_check.mjs` validates. Example: `skills/style-studio/ink-variants.example.json`; a test look: `style-packs/lantern-market-3d`, film `examples/inkbeat-market`.
- **Story brain.** `docs/STORY-BRAIN.md` (decide viewer/promise/gap/turn/payoff, line jobs, hook bank, structures, line craft, napkin protocol, self-edit pass); `skills/script-writing` and `skills/viral-script` point to it; the script critic gained a craft lint (filler and vague words, repeated openings, monotone rhythm, no turn, no address, no echo of the hook) and the hook check accepts spelled numbers. `tools/selftest_story.mjs`.
- **Unusual ideas.** `prop` overlay (Noto emoji picture with pop/drop/spin/shake/float/stack), `tools/lib/concepts.mjs` (about 700 words: things and idea-metaphors), director emits one prop per line, `emoji.mjs ensure` scans overlays, `docs/OVERLAY-BRAIN.md` section 8 (napkin protocol). The layout gallery now contains a prop.

## Style matrix
- `tools/style_matrix.mjs` (a film per pack through the whole pipeline); fixes it found: dark-style black-frame and empty-shot detection, first title frame, photoreal-cine tested with plates. 12 of 12 non-inkbeat styles pass; the five inkbeat styles are not yet verified (slow on CPU).

## Overlay brain
- `docs/OVERLAY-BRAIN.md`, `tools/overlay_director.mjs`, `tools/lib/overlay_brain.mjs`, `skills/overlay-design/skins.json`, overlays `focus-ring verdict price-tag rain`, cards `RadialMenu Devices`, `reference/beat_sync.py`, storyboard-critic coverage and gaps, `examples/overlay-brain-demo`; overlay roles also in portrait for director overlays; TitleCard and Devices show from the cut; the video critic accepts authored events; reels 8 and 9 scans in `reference-library/overlay-scan/`.

## Photoreal, characters, audio, reference brain, inkbeat in the pipeline, three approvals
- New engines and tools: `renderers/blender` + `tools/photoreal.mjs` (+ `PlateShot`, `Footage`), `tools/assets/polyhaven.mjs`, `tools/capture/record_broll.mjs`, `tools/audio/{music_lab.py,library.mjs,analyze_music.py,voice_chatterbox.py}`, `tools/emoji.mjs`, `tools/character_sheet.mjs`, `tools/present.mjs`, `tools/reference/overlay_scan.py`, `tools/ink/{scaffold_plan,render_segments_ink}.mjs`.
- Rig: hair styles, glasses, beard, eye scale; readable smile/frown arcs; stronger moods. Inkbeat `Story` selects its look (`plan.look`).
- Pipeline: `defaultGL()` (swangle on a headless Linux box, found by a WebGL failure), `useEnter` shows a card within 0.4 s (no dead frame), music genres in `audio-plan`, `file:` sound cues, emoji in captions, engine dispatch in `build_video`, `state.mjs bundle`, storyboard overlay budget, layout critic text size, vision critics `photoreal overlays faces thumbnail`, `youtube` critic ordering in acceptance.
- Docs: `STYLE-GUIDE`, `LONGFORM-LANDSCAPE`, `CHARACTER-BIBLE`, `CAMERA-GRAMMAR`, `OVERLAY-GRAMMAR`, `AUDIO-MUSIC`, `CAPTIONS-TYPOGRAPHY`, `PHOTOREAL`, `INKBEAT`, `TECH-STACK`, `REQUIREMENTS`; skills `character-design photoreal overlay-design music-sfx style-studio`.
- Examples: `photoreal-demo`, `inkbeat-kidsong`, `layout-gallery`.
- Mistake fixed along the way: installing `bpy` into the shared venv pinned numpy 1.26 and broke Kokoro and OpenCV; Blender now lives in its own `.venv-blender`.

## Landscape pass 3, Style Studio, YouTube package
- Layout: overlays placed by role (`place`: dock, strip, card, free), dock lane, size-aware badges, cursor from/to mapped, BigStat/Highlight/BarChart/Timeline fixes, `headline` caption as a left column in landscape, `useEnter` shows a card within 0.4 s (no dead frame), minimum text size, probe clips to overflow frames, window title and source text sizes.
- Fix: `colors.bg` override now moves `bgs.paper` (it was ignored by editorial packs).
- New: `tools/layout_lab.mjs`, `examples/layout-gallery`, `tools/style_studio.mjs`, `tools/package_youtube.mjs`, `tools/critics/youtube.mjs`, `tools/selftest_youtube.mjs`, `docs/STYLE-GUIDE.md`, `docs/LONGFORM-LANDSCAPE.md`, `skills/style-studio`. `critique.mjs all` and `stage:render` include `youtube`.

## Reference style (image or video)
- `skills/reference-style`, `tools/reference/style_brief.mjs` + `style_measure.py`, `style_map.mjs`, `style_check.mjs`, `tools/critics/style.mjs`, style levers in the twist, `style` in the toolchain and `next.mjs`, a worked example brief, `selftest_style.mjs`. `preview_shots` rebuilds a stale timeline; opencv pinned `<5`.

## Final pass: viral script editor, reference remake, assets
- `START-HERE.md` (the flow and ten quality rules), `skills/viral-script`, `tools/script_studio.mjs` + `critics/viral.mjs`, `viral-plan` schema; `next.mjs` leads with the plan.
- `tools/reference/blueprint.mjs`; `next.mjs` now covers the reference flow (ingest, blueprint, twist).
- `tools/assets/fetch.mjs` (CC0 photos and music with provenance, measured size, contact sheet), `shot.bgImage`, `style-overrides.json`.
- Renderer: speaker-driven mouths in 3D dialogue, `presenter.look.longHair`, SVG ticks, `CommentBox.typeAnchor`, one-line headline captions, light/dark scrim.
- Tools: `finalVideo()` (never a stale preview), signed approvals, faster Lanczos export, `selftest` parses every tool script.

## Production toolkit pass
- **Voice casting and emotion:** `script.cast`, per-line `speaker`, `emotion` (13) and `tts_text`; gender-matched, unique voices; refusals tested (`selftest_voice.mjs`).
- **4K export:** `tools/upscale.mjs` and `build_video.mjs --upscale` (Lanczos, instant, made from the file that passed QA).
- **Reference style with a twist:** `tools/reference/twist.mjs` + `tools/lib/twist.mjs`; the `reference` critic checks each lever (`selftest_twist.mjs`).
- **Toolchain critic:** proves from evidence files that each stage's tool ran (research, critics, cues, mix report, casting, ears, contact sheet, 4K, twist).
- **Craft playbook:** `skills/reel-craft/SKILL.md` (hooks, pacing, overlay and mockup placement table, sound by event, voice, twist, speed).
- **Presenter:** per-shot `presenter.look` (two characters on one rig, `longHair`), speaker tag on headline captions, headline captions limited to one line.
- **Approvals:** signed chain (hand-edited `state.json` is detected), accurate "already approved" message, `request intake` validates `brief.json`, `seal` prints usage.
- **Fixes found by rendering and by CI:** caption safe-zone check used the content limit (1380) instead of the caption limit (1500); captions under 0.2 s are merged; critics ignore `*.4k.mp4`; capture retries on HTTP 429/5xx; installer repairs a venv without pip, honours `REEL_HOME` everywhere, prefers Python 3.10 to 3.13; Windows `import()` needs file URLs; `doctor --allow-missing-models` for the clean-room test.
- **Content:** research files for all acceptance films, visual concepts for the story films, `examples/showcase-dialogue`, style previews and samples for every pack, `scripts/pack.mjs` to build the zip.

## Gates, voice, quality guards, Claude-BugHunter film
- Approval gates 14 -> 5 (`direction`, `script_review`, `storyboard_review`, `sound_review`, `final`); the old stages are automatic work stages. Production readiness runs inside `build_video.mjs`.
- Voice: emotion for every line (autoDirect), emphasis, pause map, `voice_polish.py` (chain, emphasis), `prosody.py` aliveness meter.
- Guards: `qa/picture_quality.py`, music-audible and sfx-count checks in `final_qa`, blur limits in `check_storyboard`, music vetting in `fetch.mjs`.
- Example `showcase-bughunter` (film of github.com/elementalsouls/Claude-BugHunter). Frames critic exempts page-like cards; headline caption limit 21 characters.

## Inkbeat style and camera grammar
- `style-packs/inkbeat` (3D toon, ink outlines, beat-driven camera), `skills/inkbeat` (grammar + references from the MIT inkbeat-shorts skill), `renderers/inkbeat` (Remotion + R3F engine, MIT notices kept, plus our `src/story` set and Story composition), `tools/ink/plan.mjs` (word-anchored shots and beats -> plan, pacing report), `tools/ink/stills.mjs` (three stills per shot + contact sheet), `tools/qa/ink/` (pacing and flicker analysers), example `showcase-bughunter-ink`. Not yet wired into `build_video` (voice, captions timing and mux are separate steps).

## Common camera grammar + four new 3D styles
- `skills/camera-grammar` (12 decisions common to every style + six cadence profiles in `profiles.json`); every style pack now names a `cadence`; `tools/lib/grammar.mjs` compares real shot lengths with it (`check_storyboard`, `ink/plan.mjs`); self-test checks every pack.
- Styles `kidsong-3d` (16:9 toddler song), `zackd-cutaway`, `anime-cinematic`, `pixar-soft` on `renderers/inkbeat`: looks in `src/looks` (mood patches: ramp cel/smooth/clay, outline off or thin coloured, grade), a hero per style, a set per style, `tools/ink/looks.mjs` look-dev sheet. Engine hooks: parametric toon ramp, `eyeScale`, character ink scale.
- Long-form: `ink-plan.json` `"format": "16:9"` renders 1920x1080, no burned-in captions, writes `captions.srt`.

## Both layouts for every style
- The frame comes from `brief.aspect` / the platform (`deliveryProfile`): timeline size, safe zones (`SAFE`, landscape derived), presenter on the left with cards on the right, overlay px scaled, effects and HTML blocks sized from the frame, final QA and video critic check the project's own size and caption band, `picture_quality` and `fetch` work on any aspect. `tools/other_layout.mjs` previews the other layout. Inkbeat looks render in both (`looks.mjs --layout L,P`), Story re-lenses by layout. Every style pack declares `formats: [9:16, 16:9]`; a self-test guards the packs and the layout code.

## Landscape cards, tags, headline captions and a full 16:9 film
- Wide card shapes for the main cards (`LY`), Zone grows or shrinks a card to its zone, proof cards take the picture's own shape (`imageSize` from the timeline builder), overlay tags map onto the card the shot drew, step labels above the zone, headline captions and kickers laid out for landscape, `capture_web --project` (780x426 for 16:9), `sync_highlights.mjs`, `acceptance --aspect`. A 36 s film built end to end at 1920x1080.

## Landscape pass 2: every card, tags, headline column, layout critic (work in progress, see docs/STATUS.md)
- Landscape shapes for the list cards (KineticList, FileList, Ledger, ChatBubbles, charts), evidence variants, phone frame, profile/repo/end cards, comment box; proof card puts its caption beside the picture; overlay tags map onto the picture and bands (top/caption) with edge clamping; headline caption moves to the left column beside a presenter.
- `tools/layout_probe.mjs` + `tools/critics/layout.mjs` (new `layout` critic in `critique.mjs all` / `stage:render`): measures real frames for text cut off, cards outside the zone, tags covering card text or captions. Passed on the 16:9 film (98/100).
