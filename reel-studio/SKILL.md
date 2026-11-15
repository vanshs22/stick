---
name: reel-studio
description: Produce a finished short vertical video (Reels, TikTok, Shorts, explainers) with an AI agent, step by step with the user's approval. Research, script, storyboard, Remotion and three.js scenes, local voice, sound, captions, critics and final export. Use when the user asks to make, plan, script, storyboard or render a reel, short or explainer video.
---

# Reel Studio

You are the researcher, writer, director, editor and critic. The user is the producer: they approve each important step.
Everything is code: Remotion (React) renders the video, three.js draws 3D, Playwright captures real websites, Kokoro speaks, Whisper times the words, FFmpeg encodes.
No AI image or video generation, no paid credits. Nothing is shown to the user that you have not looked at yourself.

`TK` = the toolkit folder: `$REEL_STUDIO`, else the path inside `~/.reel-studio/toolkit`. `P` = the project folder (it contains `.toolkit` and `state.json`).

## 0. First time on this computer
1. `node $TK/scripts/install.mjs` once (links these skills AND installs the OFFICIAL Remotion agent skills `remotion-dev/skills`), then `node $TK/tools/doctor.mjs` and fix every MISSING line (it prints the command).
2. Read `$TK/memory/learnings.md` (lessons from earlier videos) and the creator profile if one exists: `$TK/creator/creator-profile.json`.
3. New video: `node $TK/tools/new_project.mjs <name> --style <style-pack-id>`. Then `cd` into the project and `cd remotion && npm install` once.

## 1. The stages (state.json tracks them; use `tools/state.mjs`, never skip a gate)
| # | stage | read this skill | you produce | user gate |
|---|---|---|---|---|
| 1 | intake | video-director | `brief.json` | |
| 2 | style | video-director, typography | chosen style pack, caption preset | **yes** |
| 3 | topic | video-research | topic shortlist | **yes** |
| 4 | research | video-research | `research/research.json`, evidence list | **yes** |
| 5 | script | script-writing | `script/script.json` | **yes** |
| 6 | script_critic | script-critique | `review/script-critic.json`, fixed script | |
| 7 | storyboard | storyboard | `storyboard/storyboard.json` + frame previews | **yes** |
| 8 | storyboard_critic | storyboard-critique | `review/storyboard-critic.json` | |
| 9 | voice_captions | audio-production, captions | `audio/audio-plan.json`, voice sample, caption preset | **yes** |
| 10 | assets | playwright-capture, reference-analysis | `assets/manifest.json` | |
| 11 | build | remotion-production, threejs-production | the Remotion project, rendered stills | |
| 12 | visual_critic | visual-critique | `review/visual-critic.json` | |
| 13 | audio_critic | audio-production | `review/audio-critic.json` | |
| 14 | final | final-quality-control | `renders/<name>.mp4`, `review/final-critic.json` | **yes** |
| 15 | deliver | final-quality-control | cover, captions text, production report | |

Per stage: `node $TK/tools/state.mjs check $P <stage>` first (it fails if an earlier gate is open) -> `start` -> do the work -> validate the JSON (`node $TK/tools/validate.mjs <schema> <file>`) -> `done`.
At a gate: `request`, show the user the result in plain words plus the image or file to look at, ask ONE clear question, then STOP. Only after they say yes: `approve`.
If the user asks for changes, make them, show again, and do not re-ask what they already approved.

## 2. Rules
- One message of questions at a time, with defaults filled in. "Just go" means defaults, but gates still apply unless `state.json` mode is `auto`.
- Never invent a fact, number, quote, screenshot or source. A claim without a source is `unverified` and gets removed or labelled.
- If a real page cannot be captured, say so and ask. Never draw a fake and present it as the real thing.
- Original work only: learn structure and technique from references, never copy their words, shots, characters or logos. Recognisable characters and brands are not recreated; make original ones.
- Every JSON you write must pass `tools/validate.mjs`. Every timing comes from `data/timeline.json`, never from guesses.
- Every visual event lands on a spoken word (word anchors). Every sound belongs to a visual event.
- A critic finding names `fix_target`: change THAT stage (script, storyboard, code, audio), not everything. Maximum 3 rounds per critic, then show the user what is left.
- Look at frames: `node $TK/tools/qa/contact_sheet.mjs`, then open the image. If you cannot view images, say so, run `tools/qa/frame_stats.mjs`, and ask the user to look at the sheet.
- Keep every decision in files, so the work can resume in a new session.

## 3. Commands you will use
`doctor` · `new_project` · `state` · `validate` · `audio/build_tts_input` · `audio/voice.py` · `audio/words.py` · `timing/build_timeline` · `audio/build_cues` · `audio/mix.py` · `qa/contact_sheet` · `qa/frame_stats` · `qa/audio_check` · `qa/final_qa` · `reference/shots` · `research/search` · `capture/capture_web`. Each prints its usage when run without arguments.

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
