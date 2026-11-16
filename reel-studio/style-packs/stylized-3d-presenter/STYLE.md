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
Captions `dialogue`, shots 2-4 s, music `bed`.
Camera: Slow push-ins; close-up on reactions; desk shot for 2-character beats.
Type: Phrase captions, serif accent.
Transitions: cut, fade, dip
Sound: calm bed, keyboard type sounds, soft pop on helper reactions

## Components
Stage3D, Terminal, ChatBubbles, Typewriter, CommentBox, Highlight

## Pitfalls
- Orange face from a warm light that is too strong.
- Lower face lost in shadow.
- Helpers hidden behind the desk.

## References (technique only, never copied)
reference videos ref1, ref4

## 3D starting point (Stage3D)
The pack supplies the costume, world and look (`defaults.stage3d` in style.json), so `look` can stay empty. Copy `examples/experiment-*` for a full shot.
```json
{
 "component": "Stage3D",
 "props": {
  "world": "home-studio",
  "worldOpts": {},
  "cast": [
   {
    "id": "hero",
    "kind": "human",
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
