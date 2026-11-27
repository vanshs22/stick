# Examples

Create a ready test project: `node tools/run_example.mjs <example> <name>` (test projects say TEST in every receipt).

| example | engine | status |
|---|---|---|
| `experiment-presenter`, `experiment-stick`, `experiment-roblox`, `experiment-voxel`, `experiment-critter`, `experiment-noir` | Stage3D (directed cinematography) | **current**: the same short script in six styles, see `docs/EXPERIMENT.md` |
| `software-explainer`, `motion-graphics` | 2D cards, GSAP/HyperFrames blocks | current |
| `voxel-howto`, `character-story`, `claude-minions`, `roblox-story`, `stickman-survival` | `Scene3D` (old react-three-fiber primitives) | **legacy**: they still render and are kept as regression tests; use the Stage3D styles for new work |
| `analytics/SAMPLE-not-real-*.csv` | | invented numbers for testing `tools/analytics/analyze.mjs`, never real data |

## Examples that show the finished workflow
- `showcase-reference-remake`: made FROM a reference video. Carries `reference/` (analysis, blueprint, twist), `viral-plan.json`, two cast voices, a real captured source, a CC0 background photo fetched by `captures.json`, and `style-overrides.json`. Run: `node tools/acceptance.mjs showcase-reference-remake --id my-test --work ./work --stage all` (about 17 minutes without a GPU).
- `showcase-dialogue`: two characters, seven emotions, a real captured source, mockups tied to words (2D style, builds in about a minute).
- Every example now has a `viral-plan.json`.
- `showcase-bughunter`: a 36 s narrated explainer of a real GitHub repo. Real GitHub captures with highlights, a CC0 photo and a vetted CC0 music bed fetched by `captures.json`, emotion-directed voice (`am_fenrir`), 9 shots, `editorial-sticker` style. Run: `node tools/acceptance.mjs showcase-bughunter --id my-test --work ./work --stage all`.
- `showcase-bughunter-ink`: the same script told in the **inkbeat** look (toon-shaded 3D, ink outlines, a beat-driven camera). `ink-plan.json` is the storyboard (9 shots, 28 camera beats + 8 push-through cuts = 62 events a minute, anchored to the words in `words.json`); `storyboard.jpg` shows three stills per shot. Run: `node tools/ink/plan.mjs examples/showcase-bughunter-ink/ink-plan.json examples/showcase-bughunter-ink/words.json && node tools/ink/stills.mjs ./review` (needs `npm install` in `renderers/inkbeat`).
- `styles-lookdev`: wide, medium and close of the four new 3D styles in BOTH layouts (looks-landscape.jpg, looks-portrait.jpg). Remake: `node tools/ink/looks.mjs ./review`. `layouts`: the same 2D film and four other style families in 16:9 (made with `node tools/other_layout.mjs <project>`).

## Added in the photoreal / inkbeat / layout pass
- `photoreal-demo`: four shots, three path-traced Blender plates (CC0 chair, wood, HDRI; scenes `scene-a/b/c.json`) with depth-parallax moves, a stat card, emoji captions, a generated cinematic music bed. Plates ship as JPEG + 16-bit depth PNG; `node tools/photoreal.mjs render examples/photoreal-demo/scene-a.json --project <P> --name plate-a` re-makes them. Run: `node tools/acceptance.mjs photoreal-demo --scale 0.5`.
- `inkbeat-kidsong`: four shots drawn by the inkbeat 3D engine in the kidsong look, built through the SAME pipeline (gates, voice, captions, mix, QA, critics). 16:9. Slow without a GPU: use `--scale 0.25`.
- `layout-gallery`: 28 shots, every card with overlays of every role, authored in portrait px; the fixture of `tools/layout_lab.mjs`.
