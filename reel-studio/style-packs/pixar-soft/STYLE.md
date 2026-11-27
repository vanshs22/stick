# Pixar-soft storybook 3D (3d)

Soft, filmic storybook 3D: continuous wrap shading, no outlines, a warm key against cool shade, shallow focus, big expressive eyes and brows that carry the acting. A better variant than a generic 3D cartoon: a colour script is planned per act (warm home, cool doubt, golden resolve), a complementary wall colour (teal behind a warm key) keeps rooms from going orange, and shade keeps a warm bleed on skin.

Cadence: `film-cinematic` (skills/camera-grammar). Formats: 16:9, 9:16. Looks (renderers/inkbeat/src/looks/looks.ts): pixar-warm, pixar-cool, pixar-golden.

Rules:
- Colour script per act: warm tungsten interior for belonging, cool blue for doubt, low golden sun for resolve.
- Complementary set colours: teal or blue walls against the warm key; no monochrome room.
- Continuous wrap shading (ramp smooth), no outline, soft shadows, a cool rim, warm bounce; exposure 0.75-0.8.
- Characters: head 1.16x, pear or barrel body, big eyes (1.28), heavy expressive brows (1.35), lashes; acting through brows and mouth shape first, hands second.
- Shallow focus on the face (DOF 2.4-2.8 px); backgrounds soft but readable; a practical light in every framing.
- Camera: wide lenses and low angles for hero beats, long lenses for intimate close-ups, slow motivated dollies; hold the silent beat.
- Every set has three depth layers and hand-made props (jars, bread, cups); nothing empty.

Pitfalls:
- Warm key on warm walls turns everything orange: put a complementary wall behind.
- Outlines flatten the look: leave post outline and character ink off.
- Too heavy depth of field hides props: keep 2.8 px at most.

Look-dev: `node tools/ink/looks.mjs <outDir> --only pixar` (wide, medium, close in this look).
