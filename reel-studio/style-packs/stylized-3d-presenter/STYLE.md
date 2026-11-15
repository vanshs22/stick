# Stylized 3D presenter (3d)

Faceted low-poly person at a desk at night, city bokeh, little helper creatures. Dialogue and tech-story comedy.

Best for: dialogue and story comedy about tech and work, character-led explainers.

## Rules
- Warm key light on the face, cool rim; the face is always readable (check luma).
- Close-ups for emotion, medium with the desk for context, wide only to set the place.
- Helpers (box, screen, cloud) react on key words; speech is the presenter's mouth.
- Captions small and calm at the bottom; speaker changes shown in the caption colour.
- Original characters only.

## Defaults
Captions `phrase`, shots 2-4 s, music `bed`.
Camera: Slow push-ins; close-up on reactions; desk shot for 2-character beats.
Type: Phrase captions, serif accent.
Transitions: cut, fade, dip
Sound: calm bed, keyboard type sounds, soft pop on helper reactions

## Components
Scene3D, Terminal, ChatBubbles, Typewriter, CommentBox, Highlight

## Pitfalls
- Orange face from a warm light that is too strong.
- Lower face lost in shadow.
- Helpers hidden behind the desk.

## References (technique only, never copied)
reference videos ref1, ref4

## 3D starting point (Scene3D props)
```json
{"set": "desk-night", "light": "night", "characters": [{"variant": "lowpoly", "pose": "idle", "mood": "calm", "skin": "#F1CBA8", "shirt": "#F4CB3A", "hair": "#3a2418", "glasses": true}], "creatures": [{"kind": "cloud", "x": -0.5, "y": 0.83, "z": 0.9, "scale": 0.8, "color": "#4a46c9"}, {"kind": "screen", "x": -1.0, "y": 0.83, "z": 0.9, "scale": 0.8, "color": "#232329"}]}
```
