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
Scene3D, BigStat, BarChart, Timeline

## Pitfalls
- Too many words per caption.
- Static camera.
- Characters tiny in wide shots with nothing to see.

## References (technique only, never copied)
reference video ref8

## 3D starting point (Scene3D props)
```json
{"set": "block-world", "light": "bright-sky", "characters": [{"variant": "blocky", "pose": "idle", "mood": "happy", "skin": "#F4C98C", "shirt": "#2f7f4a", "hair": "#3a2a1a"}]}
```
