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
Scene3D, ChatBubbles, BigStat, Versus, Highlight, CommentBox

## Pitfalls
- Copying a famous mascot.
- More than 4 creatures.
- No reaction to the key word.

## References (technique only, never copied)
reference videos ref1, ref4, ref7 (creature idea only)

## 3D starting point (Scene3D props)
```json
{"set": "studio", "light": "studio", "characters": [{"variant": "stick", "pose": "think", "mood": "worried", "x": -0.7}], "creatures": [{"kind": "box", "x": 0.4, "z": 0.5, "scale": 1.6, "color": "#2FA3A0"}, {"kind": "cloud", "x": 1.0, "z": 0.3, "scale": 1.4, "color": "#E8643C"}]}
```
