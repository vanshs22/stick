# Captions and typography: presets, fonts, sizes, emoji

## 1. Presets (`typography/captions.json` `preset`; look with `gallery.mjs --kind captions`)
| preset | look | use for | size (1080 wide) |
|---|---|---|---|
| `word-pop` | 2 to 3 words, heavy, stroke, accent on the key word | short vertical films, fast | 76 px, weight 900 |
| `one-word` | one huge word at a time | hype, very fast | 118 px |
| `boxed` | white plate behind the line | busy backgrounds | 62 px |
| `phrase` | serif, 5 words, accent in italic | calm, documentary, long-form | 58 px |
| `typewriter` | mono, types in | code, terminal topics | 54 px |
| `karaoke` | the line lights up word by word | songs, lyrics | 64 px |
| `headline` | big lines on the top (portrait) or a left column (16:9) | explainers with cards | 80 px (58 to 64 in landscape) |
| `dialogue` | speaker tag + plate at the top | two or more speakers | 52 px |
| `caps-plate` | small caps on a dark plate (the reference trading reels) | HUD-style, 3D worlds | 40 px |
Placement: bottom band at 70 percent height (portrait) or 80 percent (landscape); `position.anchor` bottom, middle or top, or an exact `y`. Never over a face or a card's words (the layout critic measures it).

## 2. Fonts (`typography/typography.json`; 19 families ship, all open licences)
Pairing rule: one heavy sans for captions and headlines (Inter, Montserrat, Poppins, ArchivoBlack, BebasNeue, Oswald, Fredoka), one serif for the emphasis word (InstrumentSerif, Fraunces, PlayfairDisplay, DMSerifDisplay, italic), one mono for UI labels (JetBrainsMono, SpaceMono). Handwriting (Caveat) for notes only. Accent word: italic serif in the accent colour, one per caption. Minimum on-screen text: 28 px at 1080 on the short side; a caption's stroke is size/6.5.
Highlight modes (`typography.highlight.mode`): `color` (default), `box` (the word on a filled plate), `underline`, `none`.

## 3. Emoji in captions
- In `script.json` a line may carry `"emoji": {"chair": "🪑", "light": "💡"}` (spoken word -> emoji). The caption shows the picture right after that word and pops it in on the word's time (scale 0 to 1.18 to 1 over 0.22 s, a 9 degree wobble). The pictures are Noto Emoji (Google, Apache-2.0), downloaded by `node tools/emoji.mjs ensure <P>` (build_video does it): no font is needed on the render machine, and a missing glyph can never draw an empty box.
- `node tools/emoji.mjs suggest <P>` proposes a few. Rules: at most one per caption chunk and per 6 spoken words; only on a noun, verb or feeling the picture is not already showing; never on a sad or serious line; never two in a row; never on the CTA keyword. An emoji replaces nothing: the word stays.
- Style guidance: tech, finance and how-to channels use fewer (a 15 to 30 second film: 2 to 4); lifestyle, comedy and kids use more (but still one per chunk).

## 4. Timing and reading speed
A caption chunk is on screen at least 0.2 s per word, at most 3.5 s; chunks of 2 to 5 words (1 for `one-word`); a chunk that is shorter than 0.2 s folds into the next. Words appear 0.02 s before they are spoken. Reading speed target: 3 to 4 words per second. The `captions` critic measures it.

## 5. Long-form
For YouTube a burned-in caption is optional: ship `renders/youtube/captions.en.srt` (`package_youtube.mjs`) so viewers can turn captions on, translate them and search them. Landscape `headline` is a left column (`docs/LONGFORM-LANDSCAPE.md`).
