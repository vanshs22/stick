# Noir 3D (3d)

Dark rooms with ONE light, faceless figures, typewriter dates and evidence cards. Quiet and uneasy.

Best for: mysteries, true stories, history of unsolved events (facts sourced, victims respected).

## Rules
- One light source per scene; everything else falls into darkness.
- Red means the subject. Nothing else is red except evidence marks (stamp, circle, string).
- No faces, no gore, no weapons shown; facts checked against primary sources and listed.
- Slow: 3 to 5 s shots, push-ins and drifts only; longer pauses between sentences.
- Captions typewriter, sentence case, cream with one red word.

## Defaults
Captions `typewriter`, shots 3-5 s, music `tension`.
Camera: Slow push-in or drift; wide lens (fov 55+) in dark rooms; never inside the light cone.
Type: Mono typewriter, cream, dates top-left.
Transitions: fade, dip, cut
Sound: tension drone, one hard hit at the turn, quiet room tone, no cheerful sounds

## Components
Stage3D, EvidenceCard, Typewriter, Stamp, ProofCard, Timeline, TitleCard

## Pitfalls
- Camera inside the light cone gives a flat brown frame.
- Seats or walls between camera and subject.
- Too tight on a dark doorway reads as an empty frame.

## References (technique only, never copied)
faceless-shorts night-file

## 3D starting point (Stage3D)
The pack supplies the costume, world and look (`defaults.stage3d` in style.json), so `look` can stay empty. Copy `examples/experiment-*` for a full shot.
```json
{
 "component": "Stage3D",
 "props": {
  "world": "noir-room",
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
