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

All six presets now exist (word-pop, one-word, boxed, phrase, typewriter, karaoke). Preview them with `node $TK/tools/gallery.mjs $P --kind captions`.

Two more presets: `headline` (editorial packs: big top-left text, grey until spoken, red italic accent word; it IS the caption: do not also show a TitleCard or text card with the same words, and keep the top 400 px of the frame free for it; on a dark `bg` it switches to light ink by itself) and `dialogue` (3D story packs: top pill with the speaker tag from `shot.speaker`).

Official rules: `node $TK/tools/rs.mjs captions display-captions transcribe-captions import-srt-captions text-highlights`. If the user brings an SRT, follow `import-srt-captions`; our `build_timeline.mjs` already builds chunks from real word times, so only use the official display patterns for ideas (karaoke, token highlight), not a second caption pipeline.

## Tools (v2)
Pick the preset with the user from `node $TK/tools/gallery.mjs $P --kind captions` (every preset animated with the real narration timing), then `node $TK/tools/choose.mjs $P captions --preset <name> [--position bottom|middle|top] [--scale 1] [--highlight color|underline|box|none]`. Pronunciation never changes what the caption says: captions show the script spelling, the voice gets the phonetic one. `node $TK/tools/critique.mjs $P captions` checks caption text against the narration, chunk timing, reading speed, one highlighted word per chunk, placement and coverage.

The caption gallery uses the real narration timing but sample words. If the user has no preference use the pack default preset (`defaults.captions` in style.json) and move on.

`caps-plate` is the neon-stage default (small UPPERCASE words on a dark plate). Chunk length is fixed by the preset, so a reading-speed minor from the critic cannot be fixed in the storyboard: shorten the line or accept it.
