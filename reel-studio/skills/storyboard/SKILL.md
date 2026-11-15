---
name: storyboard
description: Turns an approved script into a shot-by-shot storyboard with visual intent, components, word anchors, camera, transitions and sound events, and shows it as real frames. Use for the storyboard stage.
---

# Storyboard

Output: `storyboard/storyboard.json` (schema `storyboard`). Validate: `node $TK/tools/validate.mjs storyboard $P/storyboard/storyboard.json`.

## Think before each shot
For every script line ask: what does this sentence COMMUNICATE, and what is the most effective way to show it? Options, in order of preference when they fit:
1. Real evidence: a captured page, repo, dashboard, document (`shot_type` screen-demo / evidence; see playwright-capture).
2. Designed interface or typography (ui, typography).
3. Data or diagram (data, diagram): chart, timeline, comparison, map, flow.
4. 3D physical or character scene (3d-scene, character): when depth, acting or a place carries the idea.
5. A metaphor object (metaphor), or a mix. Choose the most effective, not the easiest. Do not repeat the same shot type more than twice in a row.

## Shot fields
`id` S01.. · `line_ids` (every script line belongs to exactly one shot, in order; a shot may cover 1-3 lines) · `visual_intent` (one sentence) · `shot_type` · `component` (a name that exists in `remotion/src/components/registry.ts`, or one you will build) · `props` · `evidence` (source/asset and capture actions when real proof is used) · `camera` (framing, movement, focus) · `anchors` (names for spoken words: `{name:"price", line:"L04", word:"credits"}`) · `transition_out` (type + sound) · `sfx` (each with `anchor` or `at`, `offset`, `type`, `gain`) · `notes`.

## Rules
- Every entrance, reveal, highlight, count-up and sound lands on an ANCHOR word (`anchor` in props or sfx). Never on a made-up number of seconds.
- Shot length 1.5-4 s for fast styles (the style pack says). A new picture at least every 3 s. The hook shot must be strong in its first second.
- Continuity: same character, same colours, same screen geography across shots; a prop must not appear before its cause.
- Safe zone: content y 180-1380 on a 1080x1920 canvas, captions at y 1440, nothing important in the right 120 px or the bottom 300 px.
- Sound: one sound per visual event from this list only: whoosh, swish, pop, tick, type, stamp, ding, count, thud, slam, boing, zip, sparkle, tock, plop, gulp, bubbles, sizzle, inhale, heartbeat, alarm, slide. Never more than 4 in a second.
- Transitions: pick one that fits the motion (whip for fast movement, dip for time jumps, match-cut when a shape continues, cut by default). Pair it with a sound or `none`.
- Components that do not exist yet: list them in `storyboard/new-components.md` with props and the look; build them in the build stage.

## Show the storyboard as frames (not only JSON)
1. Timing without a voice: `node $TK/tools/audio/build_tts_input.mjs $P` then `TTS_SCRIPT=data/tts.json python3 $TK/tools/audio/estimate.py $P`, then `node $TK/tools/timing/build_timeline.mjs $P`.
2. `node $TK/tools/preview_shots.mjs $P` renders one still per shot and a contact sheet at `review/storyboard.jpg`. Look at it yourself first.
3. At the gate show the sheet plus a table: shot, narration, visual intent, component, anchor words. Ask for approval or per-shot changes ("replace S04 with a real screenshot").

## Components, manifest and checks (Milestone 2)
- Pick components ONLY from `$P/remotion/src/components/manifest.json` (props, required props, anchors, what each is for). 21 components: text (TitleCard, BigStat, Typewriter, Stamp, Highlight, KineticList), ui (BrowserWindow, Terminal, PhoneFrame, ChatBubbles, NotebookPage, CommentBox), data (BarChart, LineChart, Timeline, Checklist, Versus, RouteMap), evidence (ProofCard, EvidenceCard), 3d (Scene3D).
- Transitions: cut, fade, dip, slide, whip, wipe, mask, swing, zoom. Sounds: only those in the manifest.
- Check before building: `node $TK/tools/check_storyboard.mjs $P` (unknown components, missing props, unknown sounds, missing screenshots, shot-type runs).
- Use the style pack's `defaults` (captions, shot seconds, and for 3D packs a `scene3d` starting point) and its `components` list first.
- Examples to copy from: `$TK/examples/*/storyboard.json` (software explainer, character story, motion graphics, voxel how-to).
