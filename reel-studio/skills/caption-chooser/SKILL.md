---
name: caption-chooser
description: Chooses and tweaks the caption preset for a video so it fits the style, the emotion and the content, scores the keywords, and refuses a look that repeats a recent project. Use at the style/voice gate and again whenever captions look generic.
---

# Caption chooser

Generic captions are the fastest way to look like everyone else. Read `foundation/playbooks/caption.json` (`node tools/playbook.mjs query caption --style <pack>`) and the presets in `foundation/captions/` (11) plus the signatures in the playbook.

## Procedure
1. Filter presets by the style pack's layout and zone. 2. Rank by content type (tutorial, story, dialogue, numbers) and dominant emotion (calm, tense, funny, shocking). 3. Tweak: accent colour from the project palette; weight by energy (calm 500, loud 800); words per page by speech rate (fast speech = fewer words); y from the layout safe zone; add one signature (ink-drip underline, ticker-tape, torn-paper label or pixel shimmer) to the emphasis word. 4. Score keywords with the playbook's `keyword-scoring` (numbers, negations, names, change verbs, absolutes; one emphasis per phrase; the emphasis word matches the overlay keyword when there is one). 5. Duplicate check: compare preset + accent + font with the last five projects' `captions/captions-choice.json`; if all three match, change the accent or the signature. 6. Write `captions/captions-choice.json` `{ preset, tweaks, signature, keywords: [{word, t, reason}], y_pct, words_per_page, differs_from: [project ids] }`.
7. Look: build a 12-frame caption sheet (`tools/gallery.mjs <P> --kind captions`), check legibility on the busiest background, check nothing sits on the face box.

## Never
Default preset on every project; two accent colours; emphasis on stop words; captions over the mouth; fonts that cannot render the language (Hindi, Hinglish: use a font with Devanagari or Latin as the script is spoken).
