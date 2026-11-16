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
`id` S01.. · `line_ids` (every script line belongs to exactly one shot, in order; a shot may cover 1-3 lines) · `visual_intent` (one sentence) · `shot_type` · `component` (a name that exists in `remotion/src/components/registry.ts`, or one you will build) · `props` · `evidence` (source/asset and capture actions when real proof is used) · `props.camera` for Stage3D shots (framing, angle, az, subject, focus, movement; see the recipes below and `docs/CINEMATOGRAPHY.md`) · `anchors` (names for spoken words: `{name:"price", line:"L04", word:"credits"}`) · `transition_out` (type + sound) · `sfx` (each with `anchor` or `at`, `offset`, `type`, `gain`) · `notes`.

## Rules
- Every entrance, reveal, highlight, count-up and sound lands on an ANCHOR word (`anchor` in props or sfx). Never on a made-up number of seconds.
- Shot length is a decision, not a quota: it follows the narration, the amount of information the viewer must take in, the action and the emotion. A shot may hold still for several seconds when the picture or the performance carries it. The hook shot must be strong in its first second. Never cut or move the camera just to look busy; a camera move needs a `why` (see docs/CINEMATOGRAPHY.md).
- Continuity: same character, same colours, same screen geography across shots; a prop must not appear before its cause.
- Safe zone: content y 180-1380 on a 1080x1920 canvas, captions at y 1440 (the pack's `safe_zone` overrides this: packs with a host put captions at 1280), nothing important in the right 120 px. Captions sit at about 75 percent of the frame height: keep hands, boxes, stickers and card text out of that band, and read your stills for a caption lying on a body or a card.
- Sound: one sound per visual event from this list only: whoosh, swish, pop, tick, type, stamp, ding, count, thud, slam, boing, zip, sparkle, tock, plop, gulp, bubbles, sizzle, inhale, heartbeat, alarm, slide. Never more than 4 in a second.
- Transitions: pick one that fits the motion (whip for fast movement, dip for time jumps, match-cut when a shape continues, cut by default). Pair it with a sound or `none`.
- Components that do not exist yet: list them in `storyboard/new-components.md` with props and the look; build them in the build stage.

## Show the storyboard as frames (not only JSON)
1. `node $TK/tools/storyboard_review.mjs $P` does the whole step: it builds timing without a voice (a DRAFT `audio/audio-plan.json` is written if you have none; the audio gate is still open), renders one still per shot and builds the numbered contact sheets `review/storyboard-sheets/storyboard-N.jpg` plus `review/storyboard-index.md`. It takes 1 to 3 minutes: run it in the foreground. Use `--only S03,S04` after fixing a shot.
2. OPEN every sheet and the single frames (`review/storyboard/S0N.jpg`). Fix what you see in the storyboard: pose, framing, anchors, capture size, caption band. Repeat. The image viewer caches by path: after a re-capture use a new file name.
3. At the gate show the sheets and ask per frame. The user approves each frame with `state.mjs frame $P S03 approve|reject|replace`; the storyboard gate cannot be approved while a frame is open. `storyboard_critic` in `state.mjs` is the automatic check: `node $TK/tools/critique.mjs $P storyboard` (it includes the cinematography critic); run it before you request the gate.
4. Stills show one moment. Cards that build up are shown finished automatically; overlays (stickers, tags) need `preview_at` (0 to 1 of the shot) on the overlay or the shot or they are missing in the still.

## Need a component we do not have?
Search the remocn registry before hand-building an animation: `node $TK/tools/remocn.mjs search "<what the shot must do>"`, then follow `skills/remocn`. It becomes a `RemocnBlock` shot. Simulated app screens are illustrations, never evidence.

## Components, manifest and checks (Milestone 2)
- Pick components ONLY from `$P/remotion/src/components/manifest.json` (props, required props, anchors, what each is for). 29 components (`Stage3D` is the 3D shot; `Scene3D` is legacy): text (TitleCard, BigStat, Typewriter, Stamp, Highlight, KineticList), ui (BrowserWindow, Terminal, PhoneFrame, ChatBubbles, NotebookPage, CommentBox), data (BarChart, LineChart, Timeline, Checklist, Versus, RouteMap), evidence (ProofCard, EvidenceCard), 3d (Scene3D).
- Transitions: cut, fade, dip, slide, whip, wipe, mask, swing, zoom. Sounds: only those in the manifest.
- Check before building: `node $TK/tools/check_storyboard.mjs $P` (unknown components, missing props, unknown sounds, missing screenshots, shot-type runs).
- Use the style pack's `defaults` (captions, music, and for 3D packs `stage3d`: character kind, costume, world, look) and its `components` list first. 3D props that exist: `giftbox` and `sidetable` only; there is no laptop or screen prop, so show a command or a page with a Terminal or BrowserWindow card.
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

## Recipes that get a good result first time (use them; do not edit toolkit code)
**Camera vocabulary** (a wrong name is a blocker, the critic prints the list).
- framing: extreme-wide, wide, medium-wide, medium, medium-close-up, close-up, extreme-close-up, establishing, insert, top-down, over-the-shoulder, pov. Angle: eye-level, low-angle, high-angle, dutch, three-quarter, profile, front-facing, overhead. `distScale` 0.8 = 20 percent closer.
- Between two consecutive 3D shots of one subject: change the framing by a step OR the angle by 30 degrees or more, and keep `az` on the same side (do not flip from -14 to +30). A move must say why (40+ characters, about the story), name from/to/target/duration/profile/curve/focus, stay under 22 percent of the subject distance per second, and fit inside the shot. Static is fine. Full rules: `docs/CINEMATOGRAPHY.md`.
- Critters (the Pips) and thick-limbed kinds (voxel, blocky): use `medium` or wider; `medium-close-up` crops the face or the arm covers the mouth. Presenter and stickman take `medium-close-up`.

**Poses**: from a three-quarter camera `explain` lifts the hands to face height and can cover the visor or mouth. Use `explain-wide` (open arms) while the character speaks, `point` for emphasis, `shrug`/`cheer` for reactions. Always open the still and check the face is clear.

**Evidence shots** (real pages): use `BrowserWindow` (`image`, optional `zoom`) or `ProofCard` (`image`, `source`, `caption`, `highlight {x,y,w,h}` as fractions of the image). Capture for the card, not the desktop: see playwright-capture (small viewport, scale 2). Keep the highlight under 90 percent of the width, or the card will not zoom. A card with a caption line needs `content_bottom` room: do not stack extra text under it.

**Cards that build up** (FlowDiagram, KineticList, Checklist, Timeline, Typewriter, Terminal): give each step an anchor on its spoken word. The review still shows the finished state automatically; set `preview_at` (0 to 1 of the shot) on a shot only if you need a different moment.

**Packs with an illustrated host** (editorial-notebook, editorial-sticker): the host owns the bottom; the pack already moves captions above its head (`safe_zone.caption_y`). Keep content above y 1250 and never turn the host off to fit text.

**Same script in another style**: do not rewrite the storyboard by hand. `node $TK/tools/style_sheets.mjs $P --styles <ids>` maps your 3D shots to the pack's character, costume and world (`defaults.stage3d`) and your cards to cards the pack prefers, and renders `output/<style>/overview.jpg`. Open every overview before you say a style works.

**Faceless or dark packs** (noir-3d): a face-less figure cannot show who speaks or which way it faces. Keep gestures large, give the key light a clear edge, and tell the user this is a mood style.
