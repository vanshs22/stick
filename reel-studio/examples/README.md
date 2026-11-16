# Examples

Create a ready test project: `node tools/run_example.mjs <example> <name>` (test projects say TEST in every receipt).

| example | engine | status |
|---|---|---|
| `experiment-presenter`, `experiment-stick`, `experiment-roblox`, `experiment-voxel`, `experiment-critter`, `experiment-noir` | Stage3D (directed cinematography) | **current**: the same short script in six styles, see `docs/EXPERIMENT.md` |
| `software-explainer`, `motion-graphics` | 2D cards, GSAP/HyperFrames blocks | current |
| `voxel-howto`, `character-story`, `claude-minions`, `roblox-story`, `stickman-survival` | `Scene3D` (old react-three-fiber primitives) | **legacy**: they still render and are kept as regression tests; use the Stage3D styles for new work |
| `analytics/SAMPLE-not-real-*.csv` | | invented numbers for testing `tools/analytics/analyze.mjs`, never real data |
