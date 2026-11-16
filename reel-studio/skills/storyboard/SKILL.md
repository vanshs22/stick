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
- Shot length is a decision, not a quota: it follows the narration, the amount of information the viewer must take in, the action and the emotion. A shot may hold still for several seconds when the picture or the performance carries it. The hook shot must be strong in its first second. Never cut or move the camera just to look busy; a camera move needs a `why` (see docs/CINEMATOGRAPHY.md).
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

## Design layers (from the reference videos)
A strong shot = one main component + a few graphics on top + the right host or camera. Set these on the shot:
- `overlays`: graphics timed to spoken words (`anchor`): label (mono HUD row), step-chip, step-label, sticker, tags, callout, cursor, scribble (circle/underline), hearts, calendar, waveform, warning, progress, backword. Full props in `manifest.json` -> `overlays`. Use 1 to 3 per shot, never more than the eye can follow; every overlay must point at or explain something spoken.
- `bg`: change the background colour per section (editorial packs): `paper`, `dark`, `red`, `green`, `slate` or a hex. Change it at section changes (hook, proof, call to action), not every shot.
- `presenter`: the host's `pose` (idle, point, open, wave, think, shrug) and `mood` per shot, for packs that have a host. Point at the card on "this", open hands on a list, wave on greetings and the call to action.
- `speaker`: a name tag above dialogue captions (3D story packs).
- Real proof first: RepoCard / ProofCard / ProfileCard for a named repo, page or creator; scribble circle on the number that matters (star count, price, views).
- Look at `$TK/reference-library/_frames/ref*.jpg` (4 frames per reference) before designing a shot to see how the references layer these graphics.

Official rules for structure: `node $TK/tools/rs.mjs multi-scene-video sequencing transitions video-editing video-matting connected-compositions`. Real maps (not our simple RouteMap): `rs.mjs maps` and its technique files.

## Scene rules that keep it easy to follow (from the reel-maker recipe)
1. The topic is always on screen: every shot has something that says what is happening (a prop, a label, a card), not only captions.
2. No empty frames: a shot arrives with its main visual already showing; spoken words change things inside it (a reveal, a highlight) rather than starting from nothing.
3. Show literally what is said: "three keys" means three keys, appearing as each is spoken.
4. One idea per shot. A second idea is a second shot.
5. Something always moves, calmly: no shake, glitch or flashing. A held shot is fine when the performance carries it.

## Review and change tools (frame by frame)
- `node $TK/tools/preview_shots.mjs $P` renders one still per shot; `node $TK/tools/storyboard_review.mjs $P` builds the contact sheet and one image per shot with the reason for each choice.
- `node $TK/tools/storyboard_alts.mjs $P <shot>` renders alternatives (framing, angle, pose) for the user to pick from; `storyboard_edit.mjs` replaces a shot, swaps in a reference image, or applies the chosen alternative.
- The user approves or rejects EACH frame: `node $TK/tools/state.mjs frame $P S03 approve|reject|replace`. The gate cannot be approved while a frame is open.
- Run `node $TK/tools/check_storyboard.mjs $P` (components + cinematography critic) after every edit.
