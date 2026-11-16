# Original creatures (3d)

Small round-and-boxy original creatures with big vertical eyes and comic reactions on a clean studio set.

Best for: comedy and personality-driven explainers where a character reacts to facts.

## Rules
- Original designs (shape, colour, eyes) so they are never mistaken for a protected character.
- Big simple eyes; the blink and the hop carry the emotion.
- Two to four creatures at most; each has its own colour and role (sceptic, fan, expert).
- Reaction shots: cut to the creature on the punchline word.
- Studio background stays plain.

## Defaults
Captions `word-pop`, shots 1.5-3 s, music `upbeat`.
Camera: Medium two-shots; close on a reaction.
Type: Friendly heavy sans.
Transitions: cut, zoom, whip
Sound: upbeat bed, boing on hops, pop on text

## Components
Stage3D, ChatBubbles, BigStat, Versus, Highlight, CommentBox

## Pitfalls
- Copying a famous mascot.
- More than 4 creatures.
- No reaction to the key word.

## References (technique only, never copied)
reference videos ref1, ref4, ref7 (creature idea only)

## 3D starting point (Stage3D)
The pack supplies the costume, world and look (`defaults.stage3d` in style.json), so `look` can stay empty. Copy `examples/experiment-*` for a full shot.
```json
{
 "component": "Stage3D",
 "props": {
  "world": "workshop",
  "worldOpts": {},
  "cast": [
   {
    "id": "hero",
    "kind": "critter",
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
