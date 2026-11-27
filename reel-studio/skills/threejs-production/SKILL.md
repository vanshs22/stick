---
name: threejs-production
description: Builds 3D shots with three.js inside Remotion - characters, rooms, lighting, camera journeys, depth of field and post effects - deterministic and fast enough to render. Use when a storyboard shot needs real depth, a character or a place.
---

# three.js production

Use 3D when depth, lighting, a place or acting carries the idea. Otherwise use 2D (cheaper, sharper).

## Use `Stage3D`, do not hand-write three.js
For characters, rooms and camera work the toolkit already has a directed 3D shot: component `Stage3D` (vanilla three.js, film look: soft shadows, depth of field, bloom, ACES). You describe the shot in `storyboard.json`; you do not write scene code and you do not edit `remotion-template/src/three/`. Copy a working shot from `examples/experiment-*/storyboard.json` and change it.
```
{"component":"Stage3D","props":{
  "world":"workshop","worldOpts":{},                       // workshop | home-studio | block-yard | voxel-valley | noir-room
  "cast":[{"id":"hero","kind":"critter","look":{},"at":[-0.1,0.2],"rotY":0.25,
           "pose":[[0,"idle"],[0.6,"explain-wide"]],       // a name, or [[seconds,name],...]
           "mood":[[0,"curious"],[1.8,"happy"]],"speaks":true}],
  "props3d":[{"id":"table","kind":"sidetable","at":[0.45,0,0.35]}],   // sidetable | giftbox (add "voxel":true or "blocky":true to match the style)
  "camera":{"framing":"medium","angle":"three-quarter","az":-14,"subject":"hero","focus":{"target":"hero","aperture":0.004},"movement":{"type":"static"}}}}
```
- `kind` follows the style pack: human (presenter, noir), critter (Pips), blocky (Roblox-inspired), stick (3D stickman), voxel. Leave `look` empty to use the pack's costume (`defaults.stage3d` in `style.json`), or copy the pack's values.
- poses: idle relax explain explain-wide point think shrug wave cheer hold hold-up reach lean-in step-back slump hands-on-head cower. moods: calm happy curious surprised worried sad angry smirk scared relieved determined (faces exist on human and critter; other kinds act with the body).
- `speaks: true` moves the mouth on the real word times. `reach` makes a hand go to a prop, `open` opens the giftbox. `lookAt` turns the head to a prop id.
- Camera: framing, angle, `az`, `offset`, `distScale`, `focus`, `movement` (a move needs why/from/to/target/duration/profile/curve). The critic (`tools/check_cinematography.mjs`) tells you what to change. Rules and vocabulary: `skills/storyboard` and `docs/CINEMATOGRAPHY.md`.
- Check the result the only way that counts: `tools/storyboard_review.mjs` and open the images (face clear? hands off the face? subject inside the frame? captions off the face?).
Raw three.js (below) is only for something Stage3D cannot do; say so to the user first.

## Setup inside Remotion
Read the official rule first: `node $TK/tools/rs.mjs 3d` (ThreeCanvas needs width and height, proper lighting, and every animation driven by `useCurrentFrame()`).
`import {ThreeCanvas} from '@remotion/three'`. Wrap the scene in `<ThreeCanvas width height camera={{position:[0,1.5,5], fov:35}}>`. All motion is a pure function of `frame` (`useCurrentFrame()`): positions, rotations, camera, light intensity, blinks. Never use `useFrame()`, clocks, random or physics engines.

## Look rules (learned the hard way)
- Output colour: use `MeshLambertMaterial`/`MeshStandardMaterial` and a `<ambientLight>` + one key + one rim light. A dark scene must still show the subject: check the still's brightness with `tools/qa/frame_stats.mjs` (median luma >= 48 unless the style is noir).
- Flat low-poly and voxel looks: `flatShading`, no outlines, simple gradients. Toon looks: a 3-step gradient map plus an inverted-hull outline.
- One light = one story: noir uses a single practical light and falls into darkness; bright explainers use soft studio light.
- Camera: move slowly (push-in, drift, orbit). Camera inside a light cone or behind a wall = a dead frame. Use a wide lens (fov 55+) for dark rooms.
- Depth of field: blur the background with a post pass or blur a rendered layer in CSS; never animate real DOF per frame on slow machines.
- Characters: rig by named joints, drive poses and faces from data (`pose`, `mood`) and the spoken words (mouth open from word timings), so the same character acts any line. Keep one character design for the whole video.
- Original designs only (no copies of protected characters).

## Performance
Few lights (3-4), no shadows unless they carry the story, geometry reuse (`useMemo`), small textures, `antialias` via 2x render scale only when needed. A 3D frame costs 0.3-0.8 s on software GL: budget shots accordingly and render drafts at `--scale=0.5`.

## Process
1. Write the scene as a component with props `{shot, pose, mood, set}`; register it.
2. Render 3 stills (start, middle, end of the shot), look at them, fix composition and light.
3. Only then render the full video.
Milestone 2 adds ready character and set modules (stick, voxel, low-poly, blocky, noir rooms) to reuse.

## The `Scene3D` component (Milestone 2)
One component draws a whole 3D shot. Props: `set` (starfield, desk-night, block-world, noir-room, studio), `light` (studio, night, noir, golden, bright-sky), `characters` (variant voxel | blocky | lowpoly | stick | noir; `pose` and `mood` as a name or keyframes `[[0,"idle"],[1.2,"cheer"]]`; the first character's mouth follows the real word times), `creatures` (box, screen, cloud; `kickAnchor` = hop on that spoken word), `camera` (`shot` wide|medium|close|desk, `move` push|pull|drift|orbit|static, `fov`).
Poses: idle relax slump point open cheer think shrug wave panic brace cower phone reach halt walk. Moods: calm happy scared worried angry sad surprised relieved smirk.
Pack starting points are in each 3D style pack's `defaults.scene3d`. Add a new set, character look or pose in `src/components/three/` (Sets.tsx, Humanoid.tsx, rig.ts) and keep it a pure function of time.
After the first still, ALWAYS run `node $TK/tools/qa/frame_stats.mjs` on it: dark 3D scenes were the biggest quality failure in earlier work.

## Performance and determinism (headless, GPU, many shots)
Written for three r170 as pinned in `remotion-template`; test any newer API before using it.
- Every frame is a pure function of time. No `Math.random`, `Date.now`, `performance.now` or state kept between frames: segment caches and `--shard` merges need identical frames from different processes. Use a seeded generator (see `sets_deepdive.js`). `node tools/selftest_integration.mjs` fails on any such call in `three/*.js`.
- Share geometry and materials, use `InstancedMesh` for repeats. Merge static dressing with `mergeGeometries`; fewer draw calls matter more on a GPU than on software GL.
- Shadows: a static set needs one shadow render, not one per frame (`light.shadow.autoUpdate = false`, then `needsUpdate = true` only when a caster moves). Use smaller shadow maps for preview and proof tiers.
- Depth of field renders the scene a second time: turn it off when the aperture is 0 and prefer a cheaper blur on preview tiers.
- Do not allocate in per-frame code (`new THREE.Vector3`, `Color`, `Matrix4`): hoist them out and reuse.
- Compile shaders once before the first frame (`renderer.compile(scene, camera)`) so the first still does not absorb build time.
- `Stage3D` disposes its renderer and loses the GL context on unmount; dispose any extra render targets you create yourself.
Backlog items for these rules are listed in `docs/EXTERNAL.md`.
