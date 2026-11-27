# External repos: what was taken, what was left

Read on 2026-11-27 (shallow clones, nothing executed). We take techniques and measured numbers and write our own text and code. No characters, art, reference frames or third-party prose are vendored.

| Repo | Licence | Taken (done) | Backlog | Left out |
|---|---|---|---|---|
| mromidev/claude-animated-shorts | MIT | camera glide numbers (hold creep, glide, kick, roll, max still frames) in `foundation/camera/f-stickman-3d-world.json` | per-section loudness table and -1.2 dBTP limiter in `mix.py`; script-formula beats for `viral` critic; readability-trap lint; frozen/pop/flash QA with planned-range masking | its reference frames (third-party study), bridge story and source, "no captions" |
| lemomo-ai/lemo-opuscar | docs CC BY-NC 4.0, code MIT | on-screen reading time (chars / 15 + 1.5 s) as a minor check in the `overlays` critic; six-axis originality gate (`tools/upgrade_check.mjs`, `upgrade.schema.json`); `variation_space` and `native_moves` in the style-pack schema and template | `TEXTS(t)` visible-text list for unreadable-text findings; sound rules (three layers, two silences, J/L cuts) in the sound-designer role; ASR number matching | the ~100 styles and demos, sampler and sample libraries. It is NOT a clipper: no highlight scoring or reframing exists there. Do not copy its markdown prose (NC) |
| iart-ai/motion-skills | MIT | `stagger(i, each = 0.04)` in `engine/anim.ts` | 0.4-0.55 s default enter/exit; GSAP to `E` easing map; seek-deterministic HTML frame grab | it is only an index of 19 other repos, the paid iart.ai service |
| cloudai-x/threejs-skills | MIT | seeded the only `Math.random()` use in the 3D layer (`sets_deepdive.js`) and a lint that keeps the layer deterministic | static shadows (`shadow.autoUpdate = false`), shadow size per render tier, `mergeGeometries`, hoist per-frame allocations, `renderer.compile` before the first frame | WebGPU/TSL, R3F, interaction, asset pipeline. Skills assume three r186; we pin r170, so test every API before copying |
| JohnHeibel/ClaudeAnimationBase | MIT | `reads` (what the viewer must understand, held at least 0.9 s, no overlap) in the storyboard schema and `overlays` critic | 31 emotions with squint, take and overshoot; painted emotes as a text-free overlay; strip and crop-follow review; model sheets before storyboarding; transition list with a no-repeat rule; GPU probe flags | Clawd (Anthropic's mascot), p5.brush engine |
| artemnovitckii/claude-animation-skills | MIT | shared lesson: time-only `update(t)` (lint above) | new original styles from technique notes: low-res PS1-style 3D, hairline minimal, flat space explainer, block build; voice-retime warp; safe-area contact sheet; 10 s quick render path | other creators' marks (use technique only), ElevenLabs, HyperFrames as the renderer |

## Candidate new styles (original characters and worlds, not copies)
- Low-resolution 3D (render at 1/3 size, nearest-neighbour upscale, vertex snap, dither).
- Hairline minimal (black, one-pixel strokes, one lowercase line, dot-to-tree growth).
- Painted ink storybook (boiling ink at 12 fps via `feTurbulence` seeded by `floor(t * 12)`, paper grain, additive glow, own mascot).
- Flat space explainer (one light direction, dark crescent, pill labels, drawn to scale and fact-checked).

## Checked and not needed
`Stage3D` already disposes its renderer and forces context loss on unmount, so a separate disposal helper is not added.
