---
name: captions
description: Designs, previews and verifies captions - presets, word emphasis, placement, timing and platform safe zones. Use at the style/voice gate and whenever captions look wrong or are out of sync.
---

# Captions

Captions come from real word times: `data/timeline.json` -> `captions.chunks` (built by `build_timeline.mjs --preset <name>`). Rendered by `remotion/src/engine/Captions.tsx`.

## Presets
| preset | feel | words per chunk | use for |
|---|---|---|---|
| word-pop | words spring in, one accent word | 3 | fast explainers, default |
| one-word | one huge word at a time | 1 | punchy stories, game-style |
| boxed | text on a plate | 4 | busy backgrounds, UI explainers |
| phrase | calm phrase at a time | 5 | documentary |
| typewriter | letters type on | 4 | terminal, noir |
| karaoke | whole phrase, current word lit | 4 | music-like pacing |
(Milestone 2 adds the last three as components; until then use word-pop, one-word or boxed.)

## Choose with the user
Render one still per preset using the same real line and show them side by side (typography skill). Save the choice: `brief.json` `captions.preset`, then rebuild the timeline with `--preset`.

## Rules
- At y 1440, inside the platform safe area, 56-70 px, max 2 lines, never over a face or the key visual (move the shot, not the captions).
- Exactly one accent word per chunk, the surprising word or number. `emphasis` in the script decides; otherwise number > longest word.
- Spelling is the script's spelling (including brand names), even when the voice uses a respelling.
- A chunk appears 0.04 s before its first word and ends at the next chunk or 1.6 s after its last word.
- Captions are always on top of everything else, always readable: check against the busiest shot.

## Checks
1. `build_timeline.mjs` printed the chunk count and no errors.
2. Still at a busy shot and at the start/end of a chunk: nothing clipped, accent visible, no overlap with headlines.
3. Out of sync? The words.json times are wrong (rerun `words.py`); never shift captions by hand.
