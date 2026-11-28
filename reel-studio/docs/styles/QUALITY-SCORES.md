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

## Style 2 in a town (new world `city-street`, test STYLE2-CITY-test.jpg: day, golden, night, high-angle)
New: `three/worlds_city.js` (road with lane paint and crosswalk, kerbs, two rows of varied buildings with window facades, shopfronts, awnings, rooftop kit, lamps, traffic light, trees, billboard, parked and driving cars, day/golden/dusk/night), `three/props_city.js` (cars: hatch, pickup, bus; bench, hydrant, bin). Fixed on the way: camera went under the ground on low angles (black frame; now clamped to 0.3 m), rectangular sharp patch behind the sprite from the depth-of-field depth pass (aperture lowered on sprite worlds).
Missing, seen in the stills: cars are boxy (no wheel arches, weak reflections), bus is a plain slab; no pedestrians, wires, signs, road wear or wet reflections; facades repeat and have no relief (balconies, ledges); building shadows do not read on the street; a foreground lamp pole can block the frame; night has little light spill on the road.

## R6 (top row reference r21/r26, bottom row ours: country day, city day with ink, city night, city high-angle; COMPARE-style2-final-r6.jpg)
Added: optional ink pass (`look.ink`, three/engine.js: normal+depth edges, near-side ink, crease ink, distance fade, sprite mask so world ink never crosses a character), camera-clearance gate in check_cinematography (under ground, closer than 0.5 m to a head), mix-ratio gate (tools/qa/mix_ratio.py, selftest ok).
| criterion | reference | ours |
|---|---|---|
| character integration (light, shadow, haze) | 8 | 7.5 |
| world richness and set dressing | 9 | 6 (city ok, country sparse, cars boxy) |
| light, grade, depth | 8.5 | 7.5 |
| story props the character uses (chair, money, crashed car, sign) | 9 | 3 (character only stands) |
| acting and body motion in the frame | 8 | 5 |
Biggest gaps now: characters do not interact with props; cars and bus are toy-like; no pedestrians; ground cast shadows weak in grass; night scenes have little light spill.

## R7 (STORY-VS-KIT-r7.jpg: top = supplied kit stills, look reference only; bottom = our 7-shot fence story with the toon characters)
Done: kit character renderer for the cast (ink ring, shaded fills, overalls, vest, hard hat, cap), moods mapped to kit faces, sun moved to the front-right so shadows read, actor shadow follows the world sun and the sidewalk height, actors stand on the sidewalk, 4096 shadow map, building shadows on the street.
| criterion | kit | ours |
|---|---|---|
| character design (ink ring, shading, costume parts) | 9 | 8 |
| shadow clarity (characters on the floor, cast shadows) | 8.5 | 6.5 (buildings and trees read; the character's own shadow is thin at low camera and lost in tall grass) |
| story logic (hero object insert, reactions, 3 characters, props used) | 9 | 5 (one or two characters, no hero insert, no reaction FX) |
| 3D-ness (painted textures with ink seams, forms, depth) | 8.5 | 6.5 (realistic grass and foliage rather than painted toon textures; ink pass exists but is off by default) |
Next: painted toon textures with ink seams (planks, stone, plaster), ink on by default for this look, a hero-object insert shot, FX (zzz, sweat, dust), a third character, and a clear contact shadow decal under every actor.

## R8 (STORY-STREET-r8.jpg: new 10-shot city + country story planned by tools/plan_scenes.mjs)
Fixed: the blue pen-drawn scribble at the hip (overall lower fill and the tunic skirt and belt of the Roman design are off for our cast: `noSkirt`, `noBelt`, bib stops at the hip). New: camera `take` (keyed multi-move, velocity peak at 40 percent, creep), scene planner with ledger, `cyScale` and visual height for toon sprites, distScale for 9:16 close-ups, critic checks takes key by key and knows city/country world subjects, SCENE-PLANNING.md, camera playbook entry take-spec-keys-for-one-continuous-move.
Honest state: framing and variety are now planned (establish -> medium -> push -> reveal -> reaction -> payoff), characters are centred and sized, critic = 0 major. Still weak: the fence/gate insert is plain beige boxes (no painted wood), the three-layer background is the same few props, expressions are mostly the kit's deadpan lids, no FX (sweat, dust), no pedestrians or moving traffic in frame, character shadow still thin at low camera.
