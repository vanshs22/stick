# Character bible: design, faces, bodies, emotions, voice, consistency

Any AI that reads this file can design a cast that is readable at phone size, different from each other, consistent over a whole film, and able to act. The rules are checked by a tool (`tools/character_sheet.mjs`), not just described.

## 1. Where characters live
- **Library:** `characters/<id>.json` (schema `schemas/character.schema.json`). Six originals ship: `maya` (host), `leo` (sceptic), `dr-ito` (expert), `sam` (newcomer), `rex` (rival), `nova` (guide). Copy one, change it, give it a new id. Never copy a character from a reference film: learn the technique, make an original.
- **Use in a storyboard** (Stage3D): `cast: [{"id":"maya","kind":"human","look":<the file's look>,"at":[x,z],"rotY":rad,"pose":"idle","mood":"calm"}]`. The `look` is copied from the library file so the character is identical in every shot and every film of a series (`locked: true`).
- **Voice:** each file names `voice.gender`, `tone` and a `voice_id`. A female role gets a female voice, a male role a male voice, never the same voice twice in one film (`script.cast`, per-line `speaker` and `emotion`).

## 2. Design in five steps (write the answers in the file, `silhouette` and `personality`)
1. **Role** (host, sceptic, expert, newcomer, rival, mascot) decides everything else: a sceptic has level brows and a dry mouth, a newcomer has big eyes and quick reactions.
2. **Silhouette first.** Fill the frame with a flat black version: a stranger must be able to tell two characters apart. Vary at least TWO of: height, head width, hair shape (`quiff short long bob curly bun bald`), a prop-like feature (`glasses round|square`, `beard full|stubble`), build.
3. **Face anatomy** (human rig, units are metres on a 1.7 m body; the head is about 0.25 m tall):
   - eyes: `eyeScale` 0.85 (small, dry, older) to 1.3 (big, young, naive). Eye spacing is fixed (0.082 apart): a wider look comes from `eyeScale`.
   - brows: thickness follows the hair colour; they carry 60 percent of the emotion (see the table).
   - mouth: a lip line at rest; a U arc for a smile, an n arc for a frown, an open mouth for speech and shock. Teeth only when the mouth is open.
   - extras: `glasses` (round reads friendly or clever, square reads serious), `beard` (`full` older, `stubble` tired or edgy), `hairStyle`, `hair`, `skin`, `iris`.
4. **Palette:** one dominant clothing colour per character, never the pack's accent colour on a body; skin tones from a real range (`#F0C6A0` to `#8D5A3C`); hair, shirt and background must differ in value by at least 20 percent so the head separates from the set.
5. **Proportions (stylised human, Stage3D):** 1.7 m tall, head about 1/6.5 of the height; for a more child-like character raise `eyeScale` rather than shrinking the body; for an older or stern one lower it.

## 3. Emotion table (this is the acting; the rig takes these as `mood`)
The numbers are the real drivers in `remotion-template/src/three/gestures.js` (`MOODS`): `smile` -1..1 (arc), `brow` -1..1 (down to up), `tilt` degrees (negative = inner brow up and worried, positive = inner brow down and angry), `lid` -0.4 (wide) .. 1 (closed), `open` 0..1 (mouth), `look` [yaw, pitch].
| mood | what the face does | when to use | voice emotion | camera |
|---|---|---|---|---|
| calm | gentle smile 0.18, level brows | default, explaining | neutral / calm | medium |
| happy | big smile 1.0, brows up, cheeks lifted (lid 0.18) | good news, a win | happy | medium close |
| curious | small smile, brows up, tilt -6, eyes wide, looks aside | a question, noticing | curious | close-up |
| surprised | brows high 1.0, eyes wide -0.4, mouth open 0.55 | a reveal | shock | punch-in |
| worried | frown, brows up and slanted -24, eyes down | risk, doubt | fear / sad | slow push |
| sad | deep frown -0.95, brows -28, lids heavy | loss, regret | sad | long hold, no cut |
| angry | frown, brows low -0.8, tilt +26 | conflict | anger | low angle |
| smirk | one-sided smile 0.55, tilt +6, lids half | a clever line, a rival | sarcastic | close, slight dutch |
| scared | brows up, eyes wide, mouth open 0.35 | danger | fear | handheld |
| relieved | smile 0.7, heavy lids | the problem is over | calm / happy | pull-back |
| determined | firm mouth, brows low -0.35, tilt 12 | a decision | determined | push |
Rules: use at least **three** moods in a story; change mood on a word, with a 0.3 s blend, never on a cut frame; the mood changes the BROWS and EYES first, the mouth second; a held mood longer than 4 s needs a blink or a small head move (`life` layer does it).

## 4. Body language (poses, `pose` field)
`idle relax open point hands-on-head slump cower` and more in `gestures.js`. Pair them: open (explaining), point (look at this), hands-on-head (shock), slump (defeat), cower (fear). Gestures start 0.2 s before the word they illustrate. One gesture per sentence at most.

## 5. Consistency checklist (before the storyboard gate)
- The same `look` object in every shot of that character; the same scale; the same `world`.
- Two characters in a shot differ in silhouette (hair AND one feature) and in clothing colour.
- Eyelines: the character looks at what they talk about (`lookAt`), and shot-reverse-shot keeps the 180 degree line.
- The face is on screen at least 30 percent of the frame height in a dialogue close-up, in the upper 45 percent of a vertical frame (captions sit lower).

## 6. The check: `tools/character_sheet.mjs`
`node tools/character_sheet.mjs characters/maya.json [--emotions calm,happy,...]` renders the character in every emotion with the same camera and light, writes `review/characters/<id>-emotions.jpg`, and MEASURES the face region against `calm`: an emotion that differs by less than 1.2 (mean pixel difference) or two emotions that are near-identical fail. Then LOOK at the sheet with the vision critic `faces` (`critique.mjs <P> vision --packet faces`): the number says "different", your eyes say "right".

## 7. Voice, animation, limits (honest)
- Voice emotion is shaped prosody (speed, pitch, level, pauses, tremor) on Kokoro, and real emotion control on Chatterbox (`audio-plan.voice.engine: "chatterbox"`, see `docs/AUDIO-MUSIC.md`). Lip sync is amplitude and word driven (`talkAt`), not phoneme exact.
- The human rig is a stylised procedural character: no realistic skin, hair strands or cloth. For photoreal OBJECTS use the Blender engine; it has no people. A realistic person would need a licensed scan or a generative model, which this toolkit does not ship.
- Other kinds (`critter`, `blocky`, `stick`) share the same moods but have simpler faces: judge them with the same sheet.
