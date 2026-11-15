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
Scene3D, EvidenceCard, Typewriter, Stamp, ProofCard, Timeline, TitleCard

## Pitfalls
- Camera inside the light cone gives a flat brown frame.
- Seats or walls between camera and subject.
- Too tight on a dark doorway reads as an empty frame.

## References (technique only, never copied)
faceless-shorts night-file

## 3D starting point (Scene3D props)
```json
{"set": "noir-room", "light": "noir", "characters": [{"variant": "noir", "pose": "idle", "mood": "calm"}]}
```
