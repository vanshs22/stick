---
name: overlay-design
description: Decide what appears on screen for every word of the script: props, cards, counters, price tags, calendars, verdict banners, wheels, phones, real B-roll, in one themed visual language, a new visual every few seconds. Use when writing the storyboard's overlays, and whenever a film feels flat, cluttered or text-only.
---
# Overlay design (the overlay brain)
Read `docs/OVERLAY-BRAIN.md` first (the method, learned from two reference reels), then `docs/OVERLAY-GRAMMAR.md` (rules, measured numbers) and `docs/LONGFORM-LANDSCAPE.md` (roles).
1. Choose a SKIN for the topic (`skills/overlay-design/skins.json`: game-hud, dev-terminal, finance-ticker, news-desk, creator-studio, explainer-notebook; add your own). It sets the words for STEP, PASSED, FAILED, FREE and the preferred devices.
2. Run the mechanical pass: `node tools/overlay_director.mjs <P>` (prints what each sentence should show, on which word), then `--apply` to merge the overlays into the storyboard. Cards it suggests (RadialMenu for a list, Devices for platforms, CommentBox for the keyword) you choose as the shot's main picture.
3. THEN THINK, because the tool only knows word lists: for every sentence, underline each concrete word and ask "what would I draw on a napkin to make this obvious?" Add the prop, counter, tag or card the rules cannot know. Keep objects on screen across the sentence; new things arrive around them. One hero per word.
4. Check: `node tools/critique.mjs <P> storyboard` (coverage and gaps), stills in both frame shapes (`node tools/layout_lab.mjs --aspect both` for cards), vision critic `overlays`.
Budget: at most 4 graphics at once, text at least 28 px, a new visual at least every 6 s (reference reels: every 1.4 s), each on its word. Measure a reference: `python tools/reference/overlay_scan.py <video>`, `beat_sync.py`. Never copy a reference's layout, brand, character or wording: copy the method.
