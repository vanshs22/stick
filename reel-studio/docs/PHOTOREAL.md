# Photoreal engine (Blender Cycles) and what it costs

A photoreal picture here is a PATH-TRACED plate: real light from an HDRI, physically based materials, a real lens with depth of field, filmic grade, rendered by Blender's Cycles from a JSON scene spec, then moved by a depth-parallax camera in Remotion. It is code end to end. It is not a generative model: it makes objects, rooms, products, glass, abstract light and landscapes. It does NOT make people (no realistic faces, hair or skin); use the 3D characters (`docs/CHARACTER-BIBLE.md`) or real footage for people.

## Install and check
`bash install.sh --with-photoreal` creates `.venv-blender` (the `bpy` module, about 400 MB; a separate venv because Blender pins its own numpy) and, on Linux without root, fetches the few system libraries into `.syslibs` (`scripts/fetch_syslibs.py`). Then `node tools/photoreal.mjs doctor` renders a test frame and prints the speed of THIS machine.

## The loop (per shot)
1. Pick assets (CC0, with provenance): `node tools/assets/polyhaven.mjs sheet hdris --q studio --dir <P>` (look at `review/polyhaven-hdris.jpg`), then `get hdri|texture|model <id> --res 1k|2k --dir <P>`. List them in the scene's `assets` array and they are fetched on render.
2. Write a scene spec (starter: `photoreal.mjs scene product-table --out scenes/chair.json`). Keys: `resolution`, `samples`, `overscan` (0.12 for parallax plates), `hdri` + `hdri_strength` + `hdri_rotation`, `ground {texture,size,uv_scale}`, `objects [{model|prim, pos, rot, scale|fit_height, material{color,rough,metal,texture,transmission,ior,emission}}]`, `lights [{type,pos,energy,size,color,look_at}]`, `camera {pos,look_at,fov,fstop,focus | keys[{t,pos,look_at,fov,focus}], handheld{amount}}`, `film {look:"AgX",exposure,bloom,grain,vignette,chroma}`.
3. Render: `photoreal.mjs render scenes/chair.json --project <P> --name chair-a [--samples 64] [--scale 0.5] [--t 0]` -> `assets/plates/chair-a.png` + `.depth.png` + `.json`. LOOK at the plate (vision critic `photoreal`), change light or camera, render again at `--scale 0.5 --samples 24` for fast iteration.
4. Use it: `{"component":"PlateShot","approach":"physical-3d","props":{"plate":"assets/plates/chair-a.png","depth":"assets/plates/chair-a.depth.png","overscan":0.12,"move":{"kind":"push","amount":0.5}}}`. Moves: push, pull, truck-left/right, crane-up/down, orbit-left/right, still; `handheld` 0..1; live grain.
5. For a move larger than a parallax plate allows (more than about 8 degrees of orbit or 12 percent push): `photoreal.mjs sequence scene.json --project <P> --name hero --fps 12 --seconds 3 --scale 0.5` renders real 3D frames, interpolated to 30 fps, and `Footage` plays the mp4.

## What it costs (measured here: 8 CPU cores, no GPU, software WebGL)
| step | time | note |
|---|---|---|
| one 1920x1080 plate, 48 samples | 55 s | 2150x1209 with 12 percent overscan and 40 samples: 57 to 78 s (glass and many lights are slower) |
| the depth map | included (about 2 s) | one sample, material override |
| a half-size iteration plate (960x540, 24 samples) | about 8 s | use while designing |
| Remotion render of a PlateShot film | about 2.3 s per second of film at 960x540 | 12.4 s film, 3 plates + 1 stat card: 28 s; about 4x at 1920x1080 |
| a whole 12 s photoreal film with 3 plates | about 3.5 min plates + 1 min build | vs about 30 s for a 2D card film |
| a Blender SEQUENCE (true 3D camera move) | about 1 min per frame at 1080p, 12 fps source | 3 s = 36 frames = about 36 min on CPU; 1 to 3 s per frame on a GPU |
So photoreal adds roughly 1 minute per shot (CPU) to a film, 5 to 10 seconds on a GPU. Parallax plates make the extra cost per SHOT, not per second. A GPU (`CUDA`, `OPTIX`, `HIP`, `METAL` are picked automatically) makes it about 10 to 30x faster. Cycles runs headless on any machine with Python.

## Honest limits
- No people. No realistic hair, skin, cloth motion or lip sync. A 3D character beside a photoreal set is a style clash: use one world.
- Parallax from a single plate shows stretching at depth jumps if pushed too far. The limits above keep it clean; the vision critic `photoreal` checks for tearing.
- Poly Haven has hundreds of CC0 objects, not every object. A missing object is a modelling job (Blender primitives with PBR materials do glass, metal, plastic, wood, light, abstract forms well) or a licensed model.
- Software-GL Remotion renders the parallax in a WebGL shader; a machine with no WebGL at all cannot render PlateShot (the tools pick `swangle` automatically on a headless Linux box).

## Why this beats the old 3D look for realism
Soft shadows, depth of field and bloom in a real-time rasteriser read as "3D render". A path tracer gets light bouncing, true reflections and refraction (the glass sphere shows the room), contact shadows, and a physically based lens from the same inputs. The HDRI gives the light and the reflections of a real place; the AgX view transform gives film-like highlights.
