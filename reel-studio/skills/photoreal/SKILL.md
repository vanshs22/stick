---
name: photoreal
description: Make photoreal pictures in code: path-traced Blender plates with HDRI light, PBR materials, real lens and depth of field, moved by depth parallax camera moves or a Blender sequence. Use when the user wants realistic, cinematic, product or interior pictures. No people.
---
# Photoreal
Read `docs/PHOTOREAL.md` (the loop, the scene spec, the measured costs and the limits) and `docs/CAMERA-GRAMMAR.md` section 6 (lens, light, moves).
`node tools/photoreal.mjs doctor` first. Assets: `tools/assets/polyhaven.mjs sheet|get` (CC0, provenance). Scene -> `photoreal.mjs render` (iterate at `--scale 0.5 --samples 24`) -> LOOK at the plate -> `PlateShot` with a motivated move. Budget about 1 minute per plate on CPU. A move past 8 degrees or 12 percent push: `photoreal.mjs sequence` + `Footage`.
Tell the user plainly: realistic OBJECTS, rooms, products and light yes; realistic PEOPLE no. Run the vision critic `photoreal` before the gate.
