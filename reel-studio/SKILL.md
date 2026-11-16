---
name: reel-studio
description: Produce a finished short vertical video (Reels, TikTok, Shorts, explainers) with an AI agent, step by step with the user's approval. Research, script, storyboard, Remotion and three.js scenes, local voice, sound, captions, critics and final export. Use when the user asks to make, plan, script, storyboard or render a reel, short or explainer video.
---

# Reel Studio

**Short version for any agent: read `RUNBOOK.md`, then loop on `node $TK/tools/next.mjs $P`.** The rest of this file is the reference.

You are the researcher, writer, director, editor and critic. The user is the producer: they approve each important step.
Everything is code: Remotion (React) renders the video, three.js draws 3D, Playwright captures real websites, Kokoro speaks, Whisper times the words, FFmpeg encodes.
No AI image or video generation, no paid credits. Nothing is shown to the user that you have not looked at yourself.

`TK` = the toolkit folder: `$REEL_STUDIO`, else the path inside `~/.reel-studio/toolkit`. `P` = the project folder (it contains `.toolkit` and `state.json`).

## 0. First time on this computer
1. `bash install.sh` (Windows: `.\install.ps1`). It builds `.venv`, installs the Python and Node packages, fetches Chrome and the free voice, and installs these skills plus the OFFICIAL Remotion agent skills. Then `node $TK/tools/selftest.mjs` must print "All ... checks passed".
2. `node $TK/tools/doctor.mjs` lists anything missing with the command that fixes it. Tell the user plainly what is missing; do not work around it silently.
3. Read `$TK/memory/learnings.md` (lessons from earlier videos) and `$TK/creator/creator-profile.json`.
4. New video: `node $TK/tools/new_project.mjs <name> --dir <parent folder> --style <style-pack-id>`, then write `brief.json` and run `choose.mjs <P> style <id>` before you request intake (see `skills/video-director`). The Remotion packages are shared from the toolkit, so there is no per-project `npm install`.

## 1. The stages (state.json tracks them; use `tools/state.mjs`, never skip a gate)
| # | stage | read this skill | you produce | user gate |
|---|---|---|---|---|
| 1 | intake | video-director | `brief.json` (goal, audience, length, platform, research options, CTA) | **yes** |
| 2 | style | video-director, typography | a style from the gallery (`tools/gallery.mjs`), stored in the brief | **yes** |
| 3 | topic | video-research | topic shortlist | **yes** |
| 4 | research | video-research, playwright-capture | `research/research.json`, `research/sources.json`, real captures | **yes** |
| 5 | script | script-writing | `script/script.json` | **yes** |
| 6 | script_critic | script-critique | `review/critics/{research,script}.json`, fixed script | **yes** |
| 7 | storyboard | storyboard, remocn | `storyboard/storyboard.json`, contact sheet + one image per shot | **yes, frame by frame** |
| 8 | storyboard_critic | storyboard-critique | `review/critics/storyboard.json` + cinematography critic | |
| 9 | audio | audio-production | `audio/audio-plan.json`, voice/music/sfx previews | **yes** |
| 10 | typography | typography | `typography/typography.json` + preview | **yes** |
| 11 | captions | captions | `typography/captions.json` + animated preview | **yes** |
| 12 | assets | playwright-capture, reference-analysis | `assets/manifest.json` | |
| 13 | production | remotion-production, threejs-production | go/no-go for the full render | **yes** |
| 14 | build | remotion-production | `renders/<name>.mp4` (per-shot clips, cached) | |
| 15 | visual_critic | visual-critique | `review/critics/*.json` (frames, video, vision) | |
| 16 | audio_critic | audio-production | `review/critics/{voice,music,sfx}.json` | |
| 17 | final | final-quality-control | `renders/<name>.mp4`, `review/critics/final.json` | **yes** |
| 18 | deliver | final-quality-control | cover, captions text, `state.mjs seal` receipt | |

Per stage: `state.mjs check $P <stage>` first (fails if an earlier gate is open) -> `start` -> work -> `done`.
At a gate: `request`, show the result in plain words plus the image or file to look at, ask ONE clear question, then STOP. Only after the user answers: `approve --quote "<their words>"`. The approval is tied to the files you showed; edit one and it goes stale.
Storyboard: each frame is approved or changed on its own (`state.mjs frame`, `tools/storyboard_review.mjs`, `storyboard_alts.mjs`, `storyboard_edit.mjs`).
If the user says "run through to X", you may record the early gates (intake to script_critic only) with `approve --delegated --quote "<their instruction>"`. The receipt shows them as DELEGATED. Storyboard, audio, typography, captions, production and final are never delegable.
Final changes (reject, replace a shot, change music, captions, transition, pacing): `state.mjs change`, then `fix_plan.mjs`, then only the affected shots are re-rendered.

## 2. Rules
- One message of questions at a time, with defaults filled in. Gates still apply unless `state.json` mode is `auto`.
- Never invent a fact, number, quote, screenshot or source. A claim without a source is `unverified` and gets removed or labelled.
- If a real page cannot be captured, say so and ask. Never draw a fake and present it as the real thing. Recreated UI is labelled as a recreation (`capture/register_recreation.mjs`).
- Original work only: learn structure and technique from references, never copy their words, shots, characters or logos.
- Camera work is directed, not scheduled: no cut-every-N-seconds rule and no automatic camera moves. Every move names why, from, to, target, duration, profile and curve; static shots are fine. `tools/check_cinematography.mjs` rejects unmotivated moves.
- Every visual event lands on a spoken word (word anchors). Every sound belongs to a visual event; `build_cues.mjs` records which.
- One timeline: Remotion. GSAP and HyperFrames blocks run inside it (seeked by the Remotion frame); they never get their own clock.
- Critics read real output. Vision critics need you to open the images (`critique.mjs <P> vision --packet <name>`); if you cannot see images, run `--unavailable` and the report says those checks were not done. Never write "looked fine" without opening the file.
- A finding names `fix_target`: change THAT stage. `fix_plan.mjs` groups findings and lists the smallest re-run. Maximum 3 rounds per critic, then show the user what is left.
- Keep every decision in files, so the work can resume in a new session.

## 3. Commands you will use
Run any tool without arguments for its usage.
- Setup and health: `doctor` · `selftest` · `new_project` · `state` · `validate`
- Style and choices: `gallery` (styles, typography, captions, layouts, `--compare`, `--detail`) · `choose` · `combine_styles` · `new_style_from_reference`
- Research and evidence: `research/search` (Agent-Reach, optional) · `research/competitors` · `capture/capture_web` (real pages with provenance) · `capture/register_recreation` · `reference/ingest` (yt-dlp or a file) · `reference/analyze.py` · `reference/vision` · `reference/report`
- Components we lack: `remocn` (search/info/add from the remocn registry; see `skills/remocn`)
- Storyboard: `check_storyboard` · `check_cinematography` · `preview_shots` · `storyboard_review` · `storyboard_alts` · `storyboard_edit`
- Audio: `audio/build_tts_input` · `audio/voice.py` · `audio/words.py` · `audio/build_cues` · `audio/mix.py` · `audio/preview_audio`
- Build: `timing/build_timeline` · `render_segments` (per-shot, cached) · `assemble` · `qa/final_qa`
- Critics: `critique.mjs <P> <research|script|storyboard|captions|audio|frames|video|reference|all|stage:x|vision ...>` · `fix_plan` · `qa/contact_sheet` · `qa/frame_stats` · `qa/audio_check`
- Learning: `analytics/analyze` (optional creator analytics) · append lessons to `memory/learnings.md`

## 4. Never
Upload or publish without being asked and confirmed. Spend the user's money or credits. Overwrite a project the user did not ask you to change. Say "done" about a video you have not watched as stills and checked with the tools.

## Official Remotion rules (mandatory, read before writing Remotion code)
`node $TK/tools/rs.mjs <topic>` prints the official rule (`rs.mjs list` shows all topics). Read `router` and `markup` first, then the topic for what you are doing:
| doing | read |
|---|---|
| any Remotion code | `router`, `markup`, `timing`, `sequencing`, `timing-props`, `compositions`, `parameters`, `calculate-metadata` |
| animation, effects | `effects`, `motion-blur`, `light-leaks`, `transitions`, `text-highlights` (hand-drawn circles, underlines, markers: `@remotion/rough-notation`) |
| text and fonts | `google-fonts`, `local-fonts`, `measuring-text`, `arabic-text` |
| 3D | `3d` |
| captions | `captions`, `display-captions`, `transcribe-captions`, `import-srt-captions` |
| audio, voice, sound | `audio`, `audio-visualization`, `sfx`, `voiceover`, `silence-detection` |
| media | `images`, `embedding-videos`, `gifs`, `lottie`, `cropping`, `video-editing`, `video-matting`, `multimedia` |
| multi-scene structure | `multi-scene-video`, `connected-compositions`, `interactivity`, `timeline-structure` |
| maps (real geography, routes, flyovers) | `maps`, `maps-maplibre`, `maps-mapbox`, `maps-maptiler`, `maps-static-map`, `maps-cesium` |
| preview and render | `studio`, `render`, `rendering` |
| licence questions | `license` |
Where our rules and the official ones differ, the official ones win.

## Rule: use the toolkit, do not rewrite it
Get the look from the style pack, the storyboard fields and the recipes in `skills/storyboard`, `skills/playwright-capture` and `skills/threejs-production`. Editing toolkit source during a video job is a last resort that needs the user's OK (see `skills/video-director`).
