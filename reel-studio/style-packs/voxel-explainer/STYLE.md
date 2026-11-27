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
Stage3D, Terminal, BrowserWindow, CommentBox, Checklist, BigStat, KineticList

## Pitfalls
- Dark shirt on dark background.
- Creature cropped by the frame edge.
- Cards covering the head.

## References (technique only, never copied)
reference videos ref7, ref2

## 3D starting point (Stage3D)
The pack supplies the costume, world and look (`defaults.stage3d` in style.json), so `look` can stay empty. Copy `examples/experiment-*` for a full shot.
```json
{
 "component": "Stage3D",
 "props": {
  "world": "voxel-valley",
  "worldOpts": {},
  "cast": [
   {
    "id": "hero",
    "kind": "voxel",
    "look": {},
    "at": [
     -0.1,
     0.2
    ],
    "rotY": 0.25,
    "pose": [
     [
      0,
      "idle"
     ],
     [
      0.6,
      "explain-wide"
     ]
    ],
    "mood": "happy",
    "speaks": true
   }
  ],
  "camera": {
   "framing": "medium",
   "angle": "three-quarter",
   "az": -14,
   "subject": "hero",
   "focus": {
    "target": "hero",
    "aperture": 0.004
   },
   "movement": {
    "type": "static"
   }
  }
 }
}
```
