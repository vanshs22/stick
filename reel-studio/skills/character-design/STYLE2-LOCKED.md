# Style 2 character (2D character in a 3D world): LOCKED look

User-approved against the reference (r21, r26). Use it for every style 2 story. Do not redesign; change only costume colours, hats, hair and faces. Code: `remotion-template/src/three/stickdraw.js` (renderer), `cast_designs.js` (the four designs, `canvas` looks). Compare tool: render designs next to reference crops and LOOK before and after any edit.

Head
- Rounded squarish blob (superellipse n about 2.3), broad jaw, a little wider than tall: `headW` 1.18, base radius 186. Per-character tilt via `asym` +1/-1. No bumps, no oval.
- Near-white warm skin `#fffcf6`. Soft shading only: faint cool shade lower right, faint shade under hat or hair on the forehead and under the chin.
- Yellow shadow: amber glow (34 px, alpha 0.35) plus thin deeper rim (9 px) along the lit left edge.
- Outline: base 15, swells to about 5x on the shadow side (lower right, light angle -2.3), thin on the lit side. No dashed inner line, no face hatching, no cheek lines.
- Face features scaled 1.2x: bold squint eyes, big open grin, thick brows.

Body
- Wide pear or jelly bean, rounder and fuller at the bottom: half width 140 x `torsoW` (1.1), lower bulge 0.08, outline base 17, same light angle.
- Clothes flat saturated colour, soft light-to-shade gradient across, white gloss streak down the lit side, two faint fold shadows near the shadow edge, one or two bold shapes (bib, vest trim and buttons, patch, hi-vis bands). No hatching, no streak noise.

Limbs
- Thick: legs taper 30 to 24, arms 24 to 18, shoes short thick strokes. Hands are solid black balls (radius 23).

Check before shipping any change: render the sheet, put it over the reference crops, compare head shape, skin white, outline weight and side, feature size, body width and bottom fullness, clothes flatness. Fix and re-render until each matches.

## UPDATE: style 2 characters now use the toon-pen renderer (kit design)
The user asked for the same character design as the supplied cartoon-short kit (inked ball head, shaded fills, thick-thin ink ring, costume parts). Renderer: `remotion-template/src/three/toon_actor.js` (wraps `toon_cast.js`: the mromidev toon.ts Pen library, MIT, plus the kit's romanFront). Our cast is registered as OUTFITS there (barnaby: cap + overalls, hank: vest + hair + moustache, rex: trucker cap, gus: hard hat + hi-vis bands); `cast_designs.js` points each design at it with `canvas.toon`. Moods map to the kit FACE set (`BYNAME` in toon_actor.js), arm poses to the kit arm set. The older canvas renderer (stickdraw.js, the locked head and body rules above) stays as the fallback for designs without `toon`. Attribution: Pen library (c) 2026 Mr omi, MIT.
