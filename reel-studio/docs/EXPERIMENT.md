# Controlled style experiment (Phase 1)

One test script for every style (5 shots, about 12 s): *"Last night, a mysterious box showed up at my door. I picked it up, and I had no idea who sent it. So I opened it. And inside was a tiny golden key. No way."*
Shots: establishing (slow dolly), speaking (static medium, three-quarter), interacting (hero reaches and opens the box), reveal (tilt up as the key rises, insert), reaction (medium-close-up with a gentle push).
Each style used its own character, world, lighting and caption look; the camera grammar and the script were identical. Renders: 1080x1920, real voice, word-synced captions, software GL.
Re-run: `python3 exp.py <style>` equivalents live in `examples/experiment-*`; `node tools/check_cinematography.mjs <project>` must print `pass`.

## Baseline (what the five previous videos looked like)
Tube-and-sphere characters with flat shading and a canvas face, gradient-plane sets, no shadows, no depth of field, an automatic camera cut every 1.7 s.

## Results

| criterion | stylized presenter | true 3D stickman | roblox-inspired |
|---|---|---|---|
| character quality | sculpted clay human, eyes with irises, lids, brows, mouth, hands. Hair reads as a helmet in extreme close-up | glossy articulated ink body, real joints, white gloves/shoes, scarf, full animated face. Strongest identity of the three | soft-plastic blocks, painted face that acts (eyes, brows, mouth), cap, chest emblem |
| consistency | identical in every shot | identical | identical |
| environment | full home studio (shelves with books, window city, desk, monitor, lamps, plants, rug) | same room as a bright loft (daylight, sofa) | block yard: house, fence, brick path, trees, hills, drifting block clouds |
| composition | good; OTS needs 1.9 m back | good; OTS crops the head (acceptable) | OTS failed (wide torso hides the box): replaced by medium-wide three-quarter |
| camera | 3 moves, each with a stated reason; critic: pass | same | same |
| animation | gestures blend, breathing, blinks, lip-sync, IK hand lands on the box ribbon | same system; scarf tail swings | rigid toy limbs by design; face does the acting |
| lighting | warm lamp + cool window rim, soft shadows, bloom | high-key daylight; exposure had to drop to 0.88 | sun from the front-left, soft shadow |
| depth | shallow focus on the speaker | same | same |
| storytelling | reveal (key rises, glow) lands on "golden" | same | same |
| style fidelity | yes | yes | yes |

### Strongest improvements (kept)
1. The film-look engine (soft shadows, ACES tone, environment light, depth of field, bloom) is worth more than any modelling change.
2. One skeleton and one gesture/mood/reach/lip-sync library for every character type: new characters only supply meshes and a face.
3. Real environments built from rounded props instead of gradient planes.
4. A camera spec the critic can check, with a reason per move.

### Weakest remaining areas
* Presenter hair/clothing detail (a flat-colour shirt), hands are mittens.
* Stickman hip joints stack in wide poses; over-the-shoulder crops the head.
* Blocky world is sparse beyond the yard; no interior set yet.
* Glow on the key blows the frame when the camera is within 0.6 m (reduced, still strong).
* Left wall of the home studio falls into shadow at extreme-wide.

### What changed in the toolkit because of the experiment
* `Stage3D` + `three/` (engine, sculpting, rig, gestures, cast, worlds, cinema) are the new 3D path; `Scene3D` is legacy.
* Pack defaults carry the costume, world and look (`defaults.stage3d`), the static card backdrop (`defaults.backdrop`), the camera grammar and the rules.
* Fixes found by looking: brow tilt sign, hollow bookshelf, longer shirt hem, key glow, taller walls, eyelid default, OTS parameters (`back`, `shoulderOffset`, `lift`, `fov`), fractional dolly (`distScale`), relative speed limit.
* The critic found real mistakes in the first storyboards (missing target, axis crossing, a move that was too fast); all fixed in the examples.

## Rebuilt styles (same script, same critic)

| criterion | voxel explainer | original characters ("Pips") |
|---|---|---|
| character | 18-voxel person: chunky body, elbows and knees that bend, a face made of voxels that swaps eye/brow/mouth states, hair styles, optional beard/glasses | smooth sculpted bean body, glass visor with a glowing acting face (eyes squint/widen/droop/look, brows, lip-sync mouth), reactive antenna bulb, mitten hands, boots, optional headset |
| world | one-grid valley: rolling terrain with grass/dirt/stone, pond with sand, trees, cabin with warm windows, lanterns, path, flowers, far hills; clouds, chimney smoke, falling leaves and fireflies move on their own | cosy maker workshop: pegboard with tools, bench, shelves, crates, hanging warm bulbs, rug |
| what worked | consistent grid, golden-hour light and long shadows read as one world; the voxel face is bold and readable | the visor face carries the whole performance; orange on teal is instantly readable; the cast looks designed, not assembled |
| weak | big voxel head and huge square pupils look comic in close-ups (stay at medium-close-up or wider); key glow muddy in the reveal (reduced) | the first frames show a very small character in a big room; arms are short so the object has to sit at 0.55 m |
| critic | pass 100/100 (after changing S3 to a medium-wide three-quarter) | the critic caught the gift box cut by the frame edge in S3; fixed with an offset, now pass 100/100 |

Rendered videos, contact sheets and critic reports for all five styles are in `output/experiments/`.
