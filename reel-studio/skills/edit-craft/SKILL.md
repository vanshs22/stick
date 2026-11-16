---
name: edit-craft
description: Editing, pacing, sound design, caption timing and packaging rules, the way a top short-form editor works. Use in the storyboard, audio, captions, build and deliver stages.
---

# Edit craft

## 1. Rhythm
- A cut happens because the information or the emotion changes, never on a timer. Match the pack's measured pace (see its STYLE.md; the neon-stage references run 2.5 to 3.6 cuts per 10 s, calm editorial packs far fewer).
- Cut on action or on a spoken word; hold a shot while a performance or a reveal carries it; shorten a shot the moment the idea has landed.
- First second: the strongest image with the hook text on it. Last second: a held clean frame with the ask.
- Vary shot size and pace inside the film: tight for emotion, wide for place, a fast run then a held beat. Alternate framing or angle between consecutive cuts (the critic forbids jump cuts).
- Breath: 0.2 to 0.3 s between lines; a dramatic pause (0.5 to 0.8 s) before the payoff word only.

## 2. Transitions
Cut by default. Whip for a fast topic change (with a whoosh), dip for a time jump, zoom or match-cut when a shape continues, flash for an impact. A transition without a reason is a cut. Always pair it with its sound or `none`.

## 3. Sound design (the half of the video people forget)
Layers, from bottom to top: music bed (quiet, ducks under the voice, 14 to 26 dB below it), voice (clear, normalised), effects tied to visual events, and silence (a drop to nothing before a reveal is a sound too).
Event -> sound: element appears = `pop` or `blip`; object slides/whips = `whoosh`; text typing = `type`; number counting = `count` or `tick` and a `ding` when it lands; success/reveal = `sparkle` or `ding`; impact word = `slam`, `thud` or `boom` with a `zap` on a neon burst; build-up to a reveal = `riser` that ENDS on the reveal word; character reaction = `boing`/`gulp`/`inhale`; warning = `alarm`.
Rules: every sound has a visual event (build_cues records which); sound lands 2 to 3 frames before the visual peak; density follows the style (calm packs about 2 to 4 per 10 s, neon-stage and comedy up to 6 to 8); never the same effect twice within 2 s; never two loud hits together; mix to -14 LUFS, true peak under -1.5 dB. The music must never mask a word: raise the voice, not the music.

## 4. Captions that help
1 to 4 words per chunk, break on meaning (not mid-phrase), the key word highlighted in the accent colour, appear 2 to 3 frames before the word is heard, max 2 lines, at the pack's `caption_y`, off faces and off plaques. Captions show the SCRIPT spelling; pronunciation tricks live in the audio plan.

## 5. Pacing audit (after the first build)
Open `review/final.jpg`. Count how many seconds each picture is on screen; find any stretch with no change in picture, text or sound for over 4 seconds that the narration does not carry, and any shot shorter than it takes to read its text (about 0.3 s per word on screen). Fix with `fix_plan.mjs` and a targeted rebuild.

## 6. Packaging (deliver stage)
`node $TK/tools/package_post.mjs $P` writes the cover frame, the post caption (hook line, 3 to 5 bullets from the script, one CTA, up to 5 hashtags to review), alt text and a production report. Read it and edit: the first line of the post caption is the hook, not the title. Say plainly if the voice is AI-generated (platform AI label).

## 7. Final taste test
Watch the contact sheet as if you were a stranger: would you stop on the first frame, understand the idea by the middle, and remember the last frame? If not, change the hook, cut a beat, or enlarge the payoff before you deliver.
