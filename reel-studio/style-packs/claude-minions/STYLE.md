# Claude minions (neon stage)

Original glossy cube mascots ("cubies") on a dark neon stage with big glowing set pieces, a headline plaque, spinning counters and emoji reactions. Learned from two reference videos (pace, layout, sound density); the characters, words and set pieces are original.

## What the references show (measured)
- 44 to 55 s, 2.5 to 3.6 cuts per 10 s, the camera is almost never static (slow orbit, push-ins).
- Loudness about -14 LUFS, about 20 audio onsets per 10 s (voice plus dense sound design).
- Headline plaque at 5 to 15 percent of the frame height, captions at 80 to 90 percent, caption text about 50 px at 1080x1920.
- Palette: near-black violet, violet, ONE orange accent, white; saturation about 0.5.

## Beat grammar (copy this structure, not the content)
1. Hook (0 to 3 s): the big claim as a plaque + a loud set piece (price boxes, a date, a number) and a neon burst on the impact word.
2. Question beat: the pink cubie asks (bubble overlay: WHO BUILT IT?, FROM WHERE?, WHICH ONE?).
3. Proof beat: a real screenshot or number in a plaque; counters spin up.
4. How-it-works beat: a laptop / key wall / flow with each step lighting on its spoken word.
5. Payoff: trophy or #1 podium with the counter.
6. CTA: both cubies face the camera, plaque with the keyword.

## How to build it
- World `neon-stage`, characters `kind: "cube"` (hero orange left, buddy pink with bow right: copy the duo from `examples/experiment-cubes/storyboard.json`).
- Set pieces: props3d kinds `laptop`, `trophy`, `keywall`, `pricestack`, `neonring`, `podium`.
- Overlays: `plaque`, `counter`, `bubble`, `burst` (pixel positions on 1080x1920).
- Captions preset `caps-plate`.

## Pieces added after testing
- Evidence: a floating `screen` prop with the capture and an automatic highlight (not a full-frame card); plaque names the source.
- Overlays: `plaque` (with `texts` to change it inside the beat), `counter`, `bubble`, `burst`, `impact` (a giant slammed word), `remocn` (a remocn block floating over the stage).
- Laptop `lines` type real text on the screen; `pricestack labels` are free text; `trophy number`.
- Energy numbers: median shot 1.7 to 2.5 s, camera moving in 85 percent of shots, a plaque change every 1.5 to 3 s, a pink-cubie reaction shot every 4th shot.
- Start from `scaffold_storyboard.mjs` (it builds duo shots with a set piece, plaque, counters and bubbles), then raise every beat.

## Depth and shadows (how the cubies get volume)
- Each cubie has a gradient-mapped body, a darker back-face rim shell, eye sockets and a soft contact-shadow blob under it. Glow scales with the body lightness so pale colours do not blow out.
- The neon stage has a translucent mirror floor (`reflect: true`: mirrored clones of the actors and props follow every frame), a stage disc, and a shadow-casting spotlight. A pink point light adds the rim colour.
- Keep the duo in the lower third (`wide` / `extreme-wide` framings): the reflection then shows under them.
