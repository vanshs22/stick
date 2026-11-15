---
name: threejs-production
description: Builds 3D shots with three.js inside Remotion - characters, rooms, lighting, camera journeys, depth of field and post effects - deterministic and fast enough to render. Use when a storyboard shot needs real depth, a character or a place.
---

# three.js production

Use 3D when depth, lighting, a place or acting carries the idea. Otherwise use 2D (cheaper, sharper).

## Setup inside Remotion
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
