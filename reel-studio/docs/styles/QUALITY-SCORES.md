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

## Style 2 world, R4 (three side-by-sides: r21 tree on road, r21 roadside close-up, our oak wide, our oak close-up; file COMPARE-style2-world-v3.jpg)
| criterion | reference | R3 | R4 |
|---|---|---|---|
| foliage and trees (leaf cards, bark relief) | 9 | 4 | 7.5 |
| sky and clouds | 8.5 | 5 | 6.5 |
| ground, grass, road continuity | 8.5 | 6 | 7 |
| props and story set dressing (car, signs, chair) | 9 | 4 | 4.5 |
| depth and haze | 8.5 | 5 | 7 |
Done in R4: 3200-card painted-leaf oak canopy and leaf-card trees on the treeline and hills, bark bump relief, less neon grass, soft layered clouds, longer road, larger wheat field, atmospheric fog. Still BELOW the reference on props (no cars, signs, chairs) and sky realism. Next: car and roadside prop kit, volumetric-looking clouds, dusty road shoulder.

## Style 2 world, R5 (depth, grade, light, character in the 3D light; COMPARE-style2-world-v4.jpg)
| criterion | reference | R4 | R5 |
|---|---|---|---|
| depth and aerial perspective | 8.5 | 7 | 7.5 |
| colour grade (split-tone, S-curve, haze) | 8.5 | 5.5 | 7.5 |
| shadows (reach, softness, contact) | 8.5 | 4 | 6 |
| character integration (sun/sky shading, soft shadow, haze) | 8 | 5 | 7.5 |
Done in R5: exponential distance fog tinted by the sky; split-tone grade with S-curve (cool shadows, warm highlights); sky-lit image-based light; wide 4096 sun shadow (64 m); backlit sun angle; sprite normals bulged from its alpha so the real sun and sky shade it; stacked soft shadow plus contact shadow; tree shadows fall on it. Gaps: cast shadows are hard to see in tall grass, no AO pass yet, no props.
