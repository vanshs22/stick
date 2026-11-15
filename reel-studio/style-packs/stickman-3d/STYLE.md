# 3D stickman (3d)

Simple expressive stick figures acting in bright minimal studio sets. Comedy, 'what if' and survival explainers.

Best for: comedy bits, 'what would you do if', quick lessons with a character.

## Rules
- White round head, black limbs, big readable face; pose and mood carry the joke.
- Bright flat studio; one prop per shot.
- Exaggerate poses (panic, cheer, shrug); hold them for a beat.
- Cut on action; whip transition into a surprise.
- Captions big, low, one accent word.

## Defaults
Captions `word-pop`, shots 1.5-3 s, music `bed`.
Camera: Medium and close; punch-in on the punchline.
Type: Heavy sans, black on light.
Transitions: cut, whip, zoom
Sound: bed, boing/pop on gags, thud on falls

## Components
Scene3D, BigStat, Versus, Highlight, KineticList, Stamp, CommentBox

## Pitfalls
- Faces too small to read.
- Idle poses for more than 2 s.
- Props floating in front of the face.

## References (technique only, never copied)
reference videos (stickman shorts)

## 3D starting point (Scene3D props)
```json
{"set": "studio", "light": "studio", "characters": [{"variant": "stick", "pose": "idle", "mood": "happy"}]}
```
