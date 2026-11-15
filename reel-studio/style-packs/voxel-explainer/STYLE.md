# Voxel explainer (3d)

Blocky voxel presenter and a little box creature on a deep-blue starfield, step chips and cards. Friendly tech explainer.

Best for: how-to and tool explainers for a young or casual audience, 'step 1, step 2' formats.

## Rules
- A 3D voxel presenter in the lower half, cards in the upper half, captions at the bottom.
- A companion creature reacts (hops) on the key word of the shot.
- Step chips (STEP 1 .. n) appear top centre with the card.
- Hero shirt must be lighter than the background (readability): check luma.
- Yellow is the accent: one yellow word in captions.

## Defaults
Captions `word-pop`, shots 1.5-3 s, music `upbeat`.
Camera: Medium shot mostly, slow push; close only for reactions.
Type: Heavy sans, white with yellow accent.
Transitions: cut, zoom, whip
Sound: upbeat groove, pop on card, tick on step chip, hop = boing

## Components
Scene3D, Terminal, BrowserWindow, CommentBox, Checklist, BigStat, KineticList

## Pitfalls
- Dark shirt on dark background.
- Creature cropped by the frame edge.
- Cards covering the head.

## References (technique only, never copied)
reference videos ref7, ref2

## 3D starting point (Scene3D props)
```json
{"set": "starfield", "light": "studio", "camera": {"shot": "presenter", "move": "push"}, "characters": [{"variant": "voxel", "x": -0.1, "pose": "open", "mood": "happy", "skin": "#A8704A", "shirt": "#5a5a72", "hair": "#14100c", "beard": true, "badge": "#F2C12E"}], "creatures": [{"kind": "box", "x": 0.8, "z": 0.4, "scale": 1.1, "color": "#F0683C"}]}
```
