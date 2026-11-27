# Anime cinematic (cel-shaded 3D with a film grade) (3d)

Cel-shaded 3D that behaves like animation: a two-band cel ramp, a thin coloured line, hard backlight, a painted sky with lit cloud edges, strong halation. A better variant than an anime filter: characters animate on twos (12 drawings a second) while the camera stays smooth, the line colour follows the light (indigo by day, wine at dusk), held frames and slow parallax replace constant motion, and impact frames are designed (two inverted frames), not random flashes.

Cadence: `film-cinematic` (skills/camera-grammar). Formats: 16:9, 9:16. Looks (renderers/inkbeat/src/looks/looks.ts): anime-day, anime-dusk.

Rules:
- Two-band cel shading with a narrow soft edge; one hard shadow shape per form, no gradients inside a band.
- A thin coloured line (about 1.6 px at 1080 wide), colour follows the light: indigo by day, wine at dusk, never pure black.
- Light is backlight: a low sun behind the subject, a bright rim, halation on highlights (bloom threshold 0.8-0.85).
- Skies are painted and graded (deep blue to warm horizon, lit cloud edges); at least a third of the wide shots are sky-heavy (subject low in the frame, face at 0.7+).
- Characters: small head, long limbs, very large eyes (eyeScale 1.5), a few lashes, saturated hair colour; animate on twos, camera smooth.
- Acting by holds: a 3-8 s held frame, a slow lateral parallax slide, a long pause shot (a still street, a swaying wire) before an emotional line.
- Impact frame: 2 frames of inverted colour with a speed-line burst, only on the hit of a line; at most once every 10 seconds.
- Mono no aware shots: petals, wires, clouds as cutaways; ambient sound under them.

Pitfalls:
- A power wire thicker than 0.01 reads as a beam; keep wires hairline.
- Petals as ink-outlined spheres turn into black dots: leave out or make unlit.
- Hair and face outlines at 3 px look like a comic, not cel animation: keep the line 1.5 px.
- Do not copy a specific studio's characters or compositions; use the techniques.

Look-dev: `node tools/ink/looks.mjs <outDir> --only anime` (wide, medium, close in this look).
