# Self-scores against the references (0-10, by eye on side-by-side frames)

Method: `docs/styles/COMPARE-style2.jpg` and `COMPARE-style3.jpg` put reference frames (top row) over frames from our engine (bottom row). Five criteria, scored for the reference and for ours after each round. The loop stops only when ours >= reference on every row; that has NOT been reached yet. Scores are my judgement from stills, not a measurement, and no video was watched.

## Style 2: 2D stickman in a 3D world (reference r21, r26)
| criterion | reference | R1 old/PNG sprites | R2 drawn character + world v2 | R3 grass/fence/light | now |
|---|---|---|---|---|---|
| character design (silhouette, face, costume) | 8 | 3 | 5 | 6 | 6 |
| world richness (props, foliage, depth) | 8.5 | 2 | 5 | 6 | 6.5 |
| lighting and atmosphere (sun, contrast, haze) | 8 | 3 | 5 | 5 | 6 |
| composition and camera (world as hero) | 8 | 3 | 5 | 5 | 5.5 |
| animation (continuous motion, expression) | 7 | 2 | 6 | 6 | 6 |
Gaps left: foliage and tree are smooth low-poly (reference has painted leaf textures and bark relief); no vehicles, wires in frame or small story props everywhere; sky and clouds are flat; fence boards still look stacked; sprite outline is cleaner than the reference's sketchy fill.

## Style 3: flat cinematic stickman (reference r13, r14, r10, r06)
| criterion | reference | R1 | R2 ink eyes, cel shade, rim light | now |
|---|---|---|---|---|
| character design | 8 | 5 | 6 | 6 |
| backgrounds and set detail | 8 | 4 | 4 | 4 |
| lighting (cones, glow, colour wash) | 8 | 5 | 5.5 | 5.5 |
| composition and close-ups | 8 | 5 | 5 | 5 |
| animation (blink, gesture, camera) | 7 | 3 | 3 | 3 |
Gaps left: sets are mostly dark voids; no detailed rooms (CCTV wall, car dash, newsroom are drawn but not used in this story); characters do not blink or gesture over time; hands and bodies are simpler than the reference's clothed characters.

## Changes behind the scores
Style 2: character now DRAWN every frame with Canvas2D (`three/stickdraw.js`: joints, 3/4 turn, brows, blinks, continuous mouth, boiling line at 12 fps) instead of baked PNGs; world rebuilt (`three/worlds_country.js`: 30k GPU-swaying grass blades, detailed oak, wheat rows, fence line, power poles, silo, golden low sun, saturation and contrast grade).
Style 3: ink eyes with highlights, head cel shade, rim light colour per scene, torso fold lines (`components/stick/stickman_svg.js`).
