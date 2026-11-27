# The inkbeat 3D engine inside the normal pipeline

The inkbeat engine (`renderers/inkbeat`, React Three Fiber toon shading, painted textures, ink outlines, a camera that is never still) is now one engine of the SAME build. A film in an inkbeat pack (`inkbeat`, `kidsong-3d`, `zackd-cutaway`, `anime-cinematic`, `pixar-soft`) uses the same intake, style, script, viral editor, storyboard, assets, voice, word timing, captions timing, sound cues, mix, per-shot cache, assemble, loudness, QA, critics, YouTube package and gates as every other film. Only the pictures are drawn by this engine.

## How it plugs in
1. The storyboard shots use `component: "InkShot"` (a marker; `approach` `character-3d` or `physical-3d`). Everything else in the storyboard is unchanged: line ids, anchors, sfx, transitions.
2. `tools/build_video.mjs` reads `style-packs/<pack>/style.json` `engine`. For `inkbeat` it runs `tools/ink/scaffold_plan.mjs` once (an `ink-plan.json` skeleton from the storyboard and the real word times), `tools/ink/plan.mjs` (resolves the beats to words and prints the pacing report) and `tools/ink/render_segments_ink.mjs` instead of `render_segments.mjs`. Same cache (`renders/segments/<shot>-<hash>.mp4`), same `index.json`, so `assemble.mjs` runs unchanged.
3. `tools/preview_shots.mjs` draws the review stills with the ink engine (15, 50 and 90 percent of every shot; the 50 percent one is the frame the user approves): the storyboard gate shows images, as for every engine.
4. The look is `plan.look`: `den` (the original den and adult hero), `kidsong`, `zackd`, `anime`, `pixar` (each has its own set, hero, outline strength and sky; the scaffold picks it from the pack). The camera grammar is the common one (`docs/CAMERA-GRAMMAR.md`; cadence profile from the pack).

## Commands
```
bash install.sh --with-inkbeat                              # npm install in renderers/inkbeat (about 300 MB)
node tools/ink/scaffold_plan.mjs <P>                        # skeleton ink-plan.json (after the voice: build_video --estimate gives estimated words)
node tools/preview_shots.mjs <P>                            # stills to approve (storyboard gate)
node tools/build_video.mjs <P> --scale 0.25                 # a cheap preview; the master once the plan is approved
```
Improve the plan by hand (`skills/inkbeat`, `skills/inkbeat/references/camera-and-editing.md`): sets, hero position and acting (`acts`), lens (`preset` or `aim`), moves on words (`beats`), tags on objects (`show.tags`).

## Cost and limits (measured, honest)
- Software GL: about 15 s per 1080x1920 still, so a 30 s film is hours on a CPU. A GPU makes it minutes. Iterate with `--scale 0.25` and stills; render the master once; interrupted renders resume from the cache.
- Sets are code (`src/story/Den.tsx`, `src/looks/Sets.tsx`): a new location is new code. The four looks are moods plus a set each; a brand-new 3D look is still a code change (see `docs/STYLE-GUIDE.md`, "A new 3D look").
- The Style Studio proposes 2D and Stage3D looks as stills; it does not propose a new inkbeat look.


## A 3D look is data: `ink_look` in a style pack
A new 3D look needs no code. The Style Studio writes `ink_look` into the pack; `tools/ink/scaffold_plan.mjs` copies it into `ink-plan.json` as `lookSpec`; the renderer builds it (`renderers/inkbeat/src/looks/custom.tsx`). Check one with `node tools/ink/look_check.mjs <style.json>`.
```
"ink_look": {
  "ink": 0..1,               // outline strength on characters (0 = none: clay, kids, storybook)
  "sky": true,               // draw the sky dome (false for a studio or interior)
  "blur": 1.4,               // depth-of-field strength
  "moods": { "main": { "base": "lamp|day|dusk|night|cold|golden|kids-day|zd-studio|anime-day|pixar-warm|...", "patch": { /* deep merge into the mood: lights, fog, sky, toon{ramp: cel|smooth|clay}, post{outline, bloom, grade, vignette, dof}, camFill */ } } },
  "hero": { "base": "kidsong|zackd|anime|pixar", "height": 1.7, "look": { "hair": "...", "hairColor": "#..", "colors": { "top": "#..", "bottom": "#..", "shoes": "#..", "accent": "#.." } } },
  "set": { "preset": "playroom|studio|street|kitchen" }
       // OR a set from primitives:
       { "floor": {"c":"#..","tex":"stone","size":[18,14]}, "walls": {"c":"#..","sides":["back"],"h":4}, "ceiling": "#..",
         "props": [ {"k":"box|round|cyl|sph|cone|tor|glow|label", "s":[..], "p":[x,y,z], "r":[..], "c":"#..", "tex":"wood|stone|fabric|...", "e":"#.. (emissive)", "ei":0.4, "anim":"bob|spin|sway", "repeat":{"n":6,"step":[dx,dy,dz],"colors":["#..",".."]}} ],
         "lights": [ {"p":[x,y,z],"color":"#..","intensity":3,"distance":8} ] }
}
```
Facts learned from the first Studio-made look (`lantern-market-3d`), so the next one is faster:
- Compose the set for the frame shape: in 9:16 the wide shot sees only about +-2.5 m across at the hero's depth. A prop at x = 3.3 is off screen. Put the story's key object on the camera axis.
- The key fact of the story must be an object in the set (a queue for "the queue is the ad"). Put it in the set before the film, then author a shot that looks at it (`cam.aim`).
- Bright saturated colours on lit surfaces wash to cream under a clay highlight. A glowing thing (lantern, sign, window) is a `glow` prop at k2 0.7-0.8 (unlit, below the bloom threshold), not a lit sphere with emissive. k2 above 1 blooms to white.
- A point light closer than about 1 m to a surface blows it out. Keep practicals 1.5 m or more from what they light.
- Four looks that share one set and differ only in the sky are one look. Change the set palette, the key colour and the shading ramp (the Studio warns when two variants differ by under 9 percent).
- Background people are bodies and blank heads: fine for a queue, not for a close-up. A shot that needs a face needs a hero.


## What a top 3D explainer look is made of (measured on `videoplayback.mp4`, a 59 s samurai-camp short)
The reference is not 3D characters. It is **drawn 2D stick characters (white egg head, thick black outline, dot eyes, sweat drop, flat-colour robe, thin black limbs) standing in a dense, PBR-lit 3D set** (canvas tent with bamboo ribs, patterned rug, lacquer chests, brazier with bloom, armour stand, scroll, painted screen, volumetric moon and cloud sky), shot with a real camera (wide lens, low angle, depth of field), a new set or angle about every 2.5 s, 24 shots in 59 s, VFX for the payoff (sparks, explosion). What made ours look low quality, in order of effect:
1. **Character language did not match the world.** A soft shaded doll (cream skin, glossy eyes) reads as a toy. Fix: the "drawn stick hero" recipe below.
2. **Sparse set.** Three flat walls and a floor. The reference has 20 to 40 recognisable objects in three depth layers and surfaces with pattern. Fix: `panel` props with pattern images (rug, stripes, canvas, waves, checker, planks, scales) and a denser set (`skills/style-studio/ink-variants.camp.json`: 30 props).
3. **One set, one angle.** The reference changes place every few seconds. A film needs 3 to 4 sets (author several looks, or one pack with several `ink_look`s, one per location: not yet automatic).
4. **Preview size.** Our test film was 324x576 (0.3 scale). Judge a look at 720x1280 or more: `style_studio.mjs ... --scale 0.667`.
5. Still missing against the reference: volumetric light and god rays, soft shadows from an area light, a distance haze, real expression acting (sweat drops, teeth, wide eyes), hats and hair silhouettes, VFX (sparks, explosion), a different set per scene.

**Drawn stick hero recipe** (data, no code): `"ink": 1`, hero `{"base":"zackd","height":1.65,"build":{"headScale":1.5,"torso":"barrel","torsoWidth":1.12,"limb":0.17,"neck":0.3,"armLength":1.15,"hand":0.5},"look":{"skin":"#fbf6ec","outfit":"jacket","colors":{"top":"#2f8a7a","bottom":"#15151b","shoes":"#15151b"},"hair":"crop","hairColor":"#15151b","face":{"eyeScale":0.55,"blush":0,"brow":1.3,"eyeColor":"#111111"}}}` and the world without outline (`post.outline.enabled=false`). Limits: the arms take the jacket colour (thin teal lines, not black); sleeves, hats and hand props are not drawn-style yet.

`panel` prop: `{"k":"panel","pat":"rug|stripes|canvas|waves|checker|planks|scales","c":"#base","c2":"#second","c3":"#accent","n":8,"s":[w,h,d],"p":[x,y,z],"r":[rx,ry,rz]}`. Set `"cast": false` on thin things (ribs, strings) or they throw hard diagonal shadows.


## Speed (measured, `examples/inkbeat-camp`, 11.6 s, 702x1248, 8 CPU cores, no GPU)
| Setting | Seconds per frame | 11.6 s film (349 frames) |
|---|---|---|
| master quality, every frame (the old default) | 2.3 | about 13.5 min of rendering |
| `--quality fast --fps-div 2` | about 0.7 | about 4 to 5 min of rendering, 4 to 6 min for the whole build (voice, mix, assemble, QA) |
Where the time goes (found by experiments, not guessed): NOT the pixel count (a 4.7x smaller frame changed nothing) and NOT the shadow map. About 0.85 s per frame is depth of field plus bloom, about 0.5 s is the hero's 120k triangles, and about 1 s is a fixed floor of the software GL process: Remotion's 6 browser tabs share ONE GPU process, so more tabs do not help (default concurrency is now 3). `node tools/ink/bench.mjs` measures it on your machine.
- `--quality fast` drops depth of field and uses 2x MSAA and a 1024 shadow map; `draft` also drops bloom (looks, storyboards); `master` is everything.
- `--fps-div 2` renders every second frame and repeats it (animation on twos: the drawn reference does this; the camera then moves at 15 steps a second).
- Use `master` and `--fps-div 1` for the final render. A real GPU removes the floor: this is the largest remaining speed-up and cannot be done in software.
- Fixed on the way: `--scale 0.667` failed after the render started (a non-whole-pixel frame size; the scale is now snapped), cached shots were reused after the look data changed (the look is now part of the cache key), the preset's stand-in crates were drawn in front of data-made sets.
- Lesson: foreground clutter near the camera (a stool, a barrel, spears at z above -1) put a brown block and a dark slab in front of the low-angle shot. Keep props out of the camera's corridor (z above -1 in this set) until a camera-clearance check exists (not built).

### Faster iteration, same final quality (measured)
- **Stills in one browser** (`tools/ink/lib/stills.mjs`, used by `tools/ink/stills.mjs` and the Style Studio): the first still pays about 30 s of browser start and shader compile, the next ones about 6 s each. 12 storyboard stills: 99 s (was about 12 min). A Studio `propose` with one variant (3 stills): 26 s (was about 3 min).
- **`--shard i/n`** on `render_segments_ink.mjs`: render every n-th shot on this machine and the others on another one (shots are independent and cached by content hash; copy `renders/segments` together, then `build_video.mjs` assembles). This is the only way to go beyond one machine's CPU; it needs no GPU.
- **What did NOT help (measured, so nobody retries it):** more browser tabs (one shared GPU process), more browser processes (that one process already uses all 8 cores, 750 percent CPU), a smaller shadow map, a smaller frame, other GL back ends (only `swangle` exists without a GPU), a faster bundle (1.5 s warm).
- **Final quality stays `master` and `--fps-div 1`.** The real speed-ups for it are a GPU (`angle`), or several machines with `--shard`.
