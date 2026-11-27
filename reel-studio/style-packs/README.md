# Style packs

A style pack is the complete look and feel of one kind of video, not just colours. Folder `style-packs/<id>/`:
`style.json` (schema `style-pack`: tokens, rules, components, camera, typography, transitions, audio, pitfalls), `STYLE.md` (art direction in prose with do/do-not),
`preview.jpg` (made by the gallery tool), `components/` (pack-specific components), `example/` (a storyboard that renders as-is).

Rules for writing a pack: one light logic, one accent colour, a fixed type system, a camera grammar (what moves, how fast), a sound palette, and the pitfalls you hit.
A pack never mixes in the look of another pack. Packs use ORIGINAL characters and designs; they learn techniques from references, they do not copy them.
`_template/` is a starting point. Milestone 2 ships the first eight packs.

New look? Do not hand-write a pack: `node tools/style_studio.mjs propose ...` renders four choices, refines on the user's words and writes a validated pack (`docs/STYLE-GUIDE.md`).

Pack tokens also carry: `chrome` (clean | sticker | glass window look), `presenter` (the illustrated host: skin, hair, beard, hat, curly, glasses, jacket, x, y, scale), `bgs` (named section colours), `caption` (fill colour), `safe_zone.content_top/content_bottom` (where cards live; cards shrink to fit), and the pack `effects` (dots, paper, grain, vignette, bokeh, rain, halftone).
Sixteen packs (the sixteenth, `photoreal-cine`, is the Blender plate look): editorial-notebook, editorial-sticker, noir-3d, voxel-explainer, voxel-studio, stickman-3d, roblox-inspired, stylized-3d-presenter, original-creatures, paper-atlas, claude-minions, and the inkbeat-engine styles **inkbeat**, **kidsong-3d** (16:9 toddler song), **zackd-cutaway**, **anime-cinematic**, **pixar-soft** (renderer `renderers/inkbeat`, see `skills/inkbeat`). Every pack names a `cadence` profile (`skills/camera-grammar`).
