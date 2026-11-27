# Camera language per reference style

`shot_len` median comes from the measured cut or content-beat rate of the reference videos (see docs/styles/STYLES.md): A1 1.9 s, A2 2.4 s, B 3.7 s, C 2.3 s, D 2.5 s, E 2.3 s, F 2.7 s, G 3.0 s, H 2.0 s. `min` and `max` are working limits, not measurements.
`move_mix` and `transitions` are ESTIMATES from watching 15 frames per video, not counted: refine them with `tools/ref.mjs` once the analyser exists. Every mix sums to 1.
Move names follow `three/cinema.js` (3D) and the 2D set: push_in, punch_zoom, parallax, whip, truck, macro, pov, dutch, tilt-up, crane-drop, handheld, rack_focus, orbit, push, pull, static.
