# Scene planning for style 2 (2D toon character in a real 3D world): the director's full procedure

Used by the director for every film in the `stickman-world` style. Code: `tools/lib/scene_planner.mjs` (rules as code), `tools/plan_scenes.mjs` (CLI), `remotion-template/src/three/cinema.js` (camera `take`), critic `tools/check_cinematography.mjs`. Numbers come from the measured camera grammar (docs/references/drive-kits/03_CAMERA_GRAMMAR.md) and the playbooks (`camera`, `acting`, `hook-cta`, `audio`). Learned from the supplied kits (Stick3D pack, animated-shorts kit, cartoon-short kit) and the 27 references.

## 0. Run order
1. `node tools/plan_scenes.mjs <script.json> <dir> --ink 0.8` writes `storyboard.json` and `ledger.md`. It exits 1 when the ledger check fails.
2. Read `ledger.md`. Fix by editing the script (place words, emphasis) or the planner rules, never by hand-editing one shot and forgetting why.
3. Make the project (`run_example` or the normal pipeline), then `node tools/check_cinematography.mjs <project>`: no blocker and no major.
4. Render stills (`tools/preview_shots.mjs` or `storyboard_test.mjs`), LOOK at every one against the checklist in section 7, fix, repeat. Only then render video.

## 1. One shot = one line = one continuous take
- Average shot 4.2 s (3.4-5.0). Between two edits one camera runs; it moves about 75 percent of the time and drifts almost always (a 1.2 percent creep-in is built into every take).
- A take is a list of keys `{t, framing, angle, subject, az, roll, distScale}` in `props.camera.movement` with `type: "take"`. `t` is the fraction of the shot. Between keys the camera eases with its velocity peak at 40 percent of the leg (measured), never linear.
- The key word of the line decides where the main move lands: `t` = position of the emphasised word (else the last long word) in the line, clamped 0.25-0.8. The move lands ON the noun or verb.
- Move mix over a film: push-in 53 percent, pull-back 22 percent, tilt or crane 13 percent, arc or pan 12 percent.
- Edits: one hard cut per film at most. A place or time change gets a 3-6 frame dissolve on the shot BEFORE the change (`transition_out: {type: dissolve, why}`). A reveal arrives on a whip (`type: whip`, sound whoosh) or as a pull-back inside the take. White flash for a time jump or shock.

## 2. Camera recipe by purpose (what the planner emits)
| purpose | keys | why it is there |
|---|---|---|
| hook | medium low-angle -> close-up (at the key word) -> close-up other side | the claim lands on the face |
| establish | extreme-wide high-angle -> wide eye-level (t 0.55+) -> medium-wide | show the place, then travel down to the hero |
| explain | medium -> medium-close-up at the key word -> medium-close-up other angle | push on the noun, drift to a new side |
| explain with an object in the line | wide -> close-up or medium-wide on the object (az 35-45 degrees off the hero's line) | the insert: the thing the sentence is about |
| reveal | medium -> medium-close-up -> pull-back wide on the partner or object, whip out | the new thing arrives by camera move |
| emotion | medium-close-up -> close-up, 2-3 degrees roll, eye-level | the reaction is the picture |
| payoff | medium -> medium-wide -> wide | the result as one readable picture |
| cta | medium-close-up -> close-up, eye-level | last frame on the character |
Rules the planner enforces (ledger): neighbouring shots differ in start framing AND angle; the az sign alternates; place changes dissolve; a film of 6+ shots has at least one hero-object insert.

## 3. 9:16 framing facts (the mistakes we actually made)
- The frame is narrow: at `close-up` a ball head is WIDER than the frame. Every close-up key carries `distScale 1.65`, every medium-close-up `1.3`. Never use `extreme-close-up` on a ball-head toon character (cap-only frames).
- Toon sprites: `height` in the cast entry is the VISUAL height (soles to head top, 2.0 m); the card is 12 percent taller. The subject exposes `cyScale 0.91` so close-ups centre on the face, not the cap.
- Low angle plus a close lens puts the camera under the chin: use low angle on medium and wide keys, eye-level on close keys.
- Keep the camera at least 0.3 m above the ground and 0.5 m from any head (critic gate). Foreground lamp posts and poles blocking a face: move the az or the prop.
- The face stays in the upper 65 percent: captions own the lower third.

## 4. Real scene: layers, props and light
- Every shot has three depth layers: foreground element (post, bin, grass blades, bench) at 1.5-2.5 m from the lens, the subject at 3-5 m, background (buildings, bus, trees, hills) beyond. The world adds buildings, trees, parked cars; the planner adds `fill_*` props (bin, hydrant, bench, car, stump, signs) with STABLE ids so they never move between shots.
- 15-20 purposeful things in view for city shots (shopfronts with signs, awnings, lamps, traffic light, cars, bus, trees, billboard); country shots: fence, sign, stump, oak, treeline, barn, wires, road.
- Light: ONE sun from the front-right, 35-45 degrees up, warm key and a blue sky fill, shadows that read: `look.ink` 0.8 for the inked 3D look, shadow map 4096, fog tinted by the sky, split-tone grade. Time of day follows the story: day for normal, golden for the payoff, night for danger.
- Characters stand ON surfaces (sidewalk height is looked up per world: `groundAt`), shadow follows the sun, soft contact blob under the feet. A character never floats or sinks (critic: feet on a surface).

## 5. Staging and acting
- Cast of 1-3 per shot: hero `otto` (cap + overalls), partner `mabel` or `rex` when the line has "he/she/farmer/driver/looked/said", `gus` for crowd/traffic lines. Positions are fixed per place (the stage anchor) with small jitter; the same character is at the same place in neighbouring shots unless the story walks him.
- Pose by sentence function (hook point, establish idle, explain hip, reveal shock, reaction shrug, emotion slump, payoff cheer). The pose changes at the key word. Moods map to the kit faces (neutral, smile, grin, laugh, shock, nervous, stern, pained, stubborn).
- Anticipation, overshoot, breathing, blink are built into the renderer; do not hold a pose dead still for 4+ frames.

## 6. Story logic
- One arc: looks smart, goes wrong, gets worse, the turn, the cost; one exact small number; the twist is the last line; CTA keyword last (hook-cta playbook).
- Cause and effect must be visible: if the line says the road ended at a gate, a gate (hero object) is in the shot; if it says traffic cleared, the street is empty of cars.
- Geography is continuous: same street, same bench, same bus position unless time passes.

## 7. Stills checklist (look at every frame)
Face in frame and not cropped by the sides; hero or hero object readable in 0.3 s; three depth layers; no pole across the face; no rectangular patches or black frames; shadow on the ground under every actor; ink only on the world (never across a character); caption area free; neighbouring shots clearly different; place changes dissolve; the hero object appears at least once.

## 8. Failure log (so we do not repeat it)
Cap-only frames (extreme close-up + low angle + wrong face height); camera under the ground (black frame); sharp rectangle behind a sprite from the depth-of-field pass (keep aperture <= 0.0015); focus subject outside the frame because the critic used the start framing for the whole take (fixed: it checks the active key); fill props moving between shots (ids now stable); characters jumping between shots (keep the stage anchor).

## 9. World life and logic (added after the "Pull" short)
- The city world is alive and safe: two traffic lanes (x = -1.35 moving -z at 5.0 m/s, x = +1.35 moving +z at 5.6 m/s), five vehicles per lane 21 m apart (no overlap possible), parked cars only at the kerb (x = +-3.45, hatch and pickup), wheels spin with distance; pedestrians walk three sidewalk lanes (one direction per lane, spaced 6 m+) with a 4-frame walk cycle. A shot that uses a lane for the cast turns that walker lane off: `worldOpts.walkers: [1,2]`.
- Props that act: `shopdoor` (opens about a hinge, swing in or out, rattles when stuck, sign), `parcelbox` (follows an actor's hand), `cone`, `crate`, `planter`, `mailbox`, `bench`, `hydrant`, `bin`, `car` (parked or on a path).
- Painted wood (grain, knots, seams, nails) on fences and the door frame; facades with window modules, shopfronts and awnings; ink pass on everything in the world.
- Acting effects drawn with the character: sweat drops (worried/scared), a bang mark (shock), anger marks (angry/annoyed), dust puffs at the feet on steps. Moods map to open-eyed faces (calm, curious, worried, excited, proud) and the kit's lidded faces only for deadpan beats.
- Every film is proven with `plan_scenes.mjs` (ledger + choreography) and `check_cinematography.mjs` BEFORE a still is rendered.

