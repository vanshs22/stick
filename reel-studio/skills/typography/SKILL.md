---
name: typography
description: Chooses and builds the text look of a video - fonts, hierarchy, sizes, placement, emphasis and animation - and previews options before the user decides. Use for the style gate and whenever text looks weak, small, crowded or unreadable.
---

# Typography

## Choose with the user (style gate)
Offer 3-4 text directions as live previews (render a still of the same sample line in each):
cinematic bold (heavy sans, tight), editorial serif (sans line + italic serif accent word), modern UI (rounded sans + mono labels), terminal/tech (mono), documentary typewriter. Save the choice in the style pack `tokens.fonts` and the brief.

## Rules
- Hierarchy: one headline size, one label size, one caption size per video. Headline 90-130 px, labels 24-34 px mono caps, captions 56-70 px bold on 1080 wide.
- Contrast: text over images or 3D gets a shadow or a plate; check readability at phone size (view the still at 25 percent).
- Emphasis: ONE accent word per line (colour or italic serif). The accent is the surprising word or the number, not decoration.
- Placement: inside y 180-1380; captions at y 1440; nothing in the right 120 px; no text over a face or the subject.
- Animation: words rise from a mask or pop with a spring on their spoken anchor; typewriter only for terminal or noir styles; never animate more than one text element at the same time.
- Length: headlines max 8 words; labels 1-3 words; numbers big and alone.
- Fonts: load only through `@remotion/google-fonts` in `src/engine/tokens.ts` (add the font there, one line). Check licence (OFL/Apache fonts only).

## Verify
Render stills with the longest real text, not the sample. Look for clipping, overlaps, orphan words, and a caption that covers the headline.

Official rules: `node $TK/tools/rs.mjs google-fonts local-fonts measuring-text text-highlights arabic-text`. Fit text with `measuring-text` instead of guessing sizes; right-to-left and Arabic text needs `arabic-text`.

## Choices and tools (v2)
Typography and captions are separate decisions, each previewed before approval. `node $TK/tools/gallery.mjs $P --kind typography` shows animated type sets over the project's picture; `--kind captions` shows every caption preset (`word-pop`, `one-word`, `boxed`, `phrase`, `typewriter`, `karaoke`, `headline`, `dialogue`) animated with the real narration timing; `--kind layout` shows card layouts. `node $TK/tools/choose.mjs $P typography <number>`, `choose.mjs $P captions --preset word-pop`, `choose.mjs $P layout <n>` store the choice in `typography/typography.json` and `captions.json`, and the Remotion engine reads them (`engine/tokens.ts`, `engine/Captions.tsx`). 19 Google fonts are bundled (`engine/fonts.ts`).
Safe area (1080x1920): content between y 180 and 1380, captions at y 1440, nothing in the right 120 px (like/comment buttons) or the bottom 300. Render with `safeZones: true` to see the lines.
