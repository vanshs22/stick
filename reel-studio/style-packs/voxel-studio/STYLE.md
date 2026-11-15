# Voxel studio (3d)

Light-grey studio with a wall of live charts, blocky characters and floating label chips. Data and finance explainers.

Best for: finance, markets, data and 'how it works' explainers with a calm voice.

## Rules
- Light stage with a chart wall; characters in hats or uniforms (original designs).
- Label chips with green outlines float over objects (tags overlay).
- Title bar at the top (step-label), caption box at the bottom with a green accent.
- Slow camera: long 2-5 s shots; props explain the idea (rings, bars, glass columns).
- Keep green for good, red for bad, amber for in-between.

## Defaults
Captions `boxed`, shots 2-5 s, music `upbeat`.
Camera: Medium, slow push or orbit.
Type: Heavy sans, dark on white boxes.
Transitions: cut, slide, fade
Sound: light upbeat bed, pop on chips, tick on counters

## Components
Scene3D, BigStat, BarChart, LineChart, Versus, Checklist, Timeline

## Pitfalls
- Copying the original characters.
- Chart wall too busy behind captions.

## References (technique only, never copied)
reference video ref2

## 3D starting point (Scene3D props)
```json
{"set": "studio", "light": "studio", "wall": true, "characters": [{"variant": "voxel", "pose": "open", "mood": "calm", "skin": "#B8643A", "shirt": "#1d2a52", "hair": "#22160f", "badge": "#F2C12E"}]}
```
