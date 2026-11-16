# Roblox-inspired world (3d)

A bright blocky town in the sky with simple block characters; one huge yellow word at a time. Story and 'did you know' videos.

Best for: fast narrated stories and facts about places, money, scale ('the richer you are, the higher you live').

## Rules
- Original block characters and worlds; never recreate Roblox characters or logos.
- One word on screen at a time, big, yellow, black outline-like shadow.
- Camera moves every shot: tilt up, drift, orbit; shots 1 to 2.5 s.
- The world itself tells the story: scale, height, contrast between places.
- Bright sky colours; always readable.

## Defaults
Captions `one-word`, shots 1-2.5 s, music `bed`.
Camera: Dynamic: low-angle tilt-ups, orbit, drift; fov 36-60.
Type: One-word captions, 118 px.
Transitions: whip, cut, zoom
Sound: light bed, whoosh on every camera move, pop on reveals

## Components
Stage3D, BigStat, BarChart, Timeline

## Pitfalls
- Too many words per caption.
- Static camera.
- Characters tiny in wide shots with nothing to see.

## References (technique only, never copied)
reference video ref8

## 3D starting point (Stage3D)
The pack supplies the costume, world and look (`defaults.stage3d` in style.json), so `look` can stay empty. Copy `examples/experiment-*` for a full shot.
```json
{
 "component": "Stage3D",
 "props": {
  "world": "block-yard",
  "worldOpts": {},
  "cast": [
   {
    "id": "hero",
    "kind": "blocky",
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
