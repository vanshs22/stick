# Kidsong 3D (toddler song, long-form) (3d)

A bright, round, soft 3D nursery-song world for toddlers: a playroom of primary colours, a big-headed toddler hero, no outlines, a camera at toddler eye height, a cut on every musical beat. A better variant of the genre: shadows keep a little colour and form (the genre is flat), a soft rim separates characters from the set, and nothing flashes, shakes or pulses.

Cadence: `kids-song` (skills/camera-grammar). Formats: 16:9, 9:16. Looks (renderers/inkbeat/src/looks/looks.ts): kids-day, kids-night.

Rules:
- Every shape is rounded (rounded boxes, spheres, cylinders); no sharp corner on any prop. Props are original designs.
- Primary and pastel colours at high saturation, one colour per object, a clean bright room; no outline (post outline off, character ink scale 0).
- The hero is a toddler: head 1.5x, barrel body, big soft eyes (eyeScale 1.35), rosy cheeks, a joyful open mouth, one outfit for the whole film.
- Camera at the toddler's eye height (about 0.8 m), cuts land on the music beat (every 2-4 s), gentle slides and slow pushes only.
- Teach one thing per song (a letter, a number, a colour, an action) and show it as an object: the A B C blocks, a counting train. Painted letters and numbers are unlit and large.
- Loop the chorus visually (the same three framings come back), so the song can repeat for the length of a long-form film.
- Long-form 16:9: no burned-in captions (ship an SRT or lyric cards between verses), 2-3 min songs, a calm last 10 seconds.
- Calm by design: no flashing light, no strobing, no whip pans, no screen shake, no rapid zoom pulses, no sudden loud sounds.

Pitfalls:
- Pastel washes: keep exposure at 0.8 and saturation at 1.6 or the room goes milky.
- Sharp props (a corner box) break the rule: use rounded boxes only.
- A fast zoom pulse on every beat is the over-stimulating pattern; keep zooms under 8 percent and slow.

Look-dev: `node tools/ink/looks.mjs <outDir> --only kidsong` (wide, medium, close in this look).
