---
name: design-craft
description: Visual design rules for vertical video frames, the way a top motion designer works - hierarchy, type, colour, layout, motion, overlays, 3D staging, evidence. Use in the storyboard, typography, captions and build stages whenever you decide how a frame looks.
---

# Design craft

A frame is read in under a second on a phone at arm's length. If it needs explaining, redesign it.

## 1. Hierarchy: ONE thing is read first
Each frame has one focal element (the character reacting, the number, the screenshot, the headline). Everything else is quieter in size, contrast or motion. Test: squint at the still; if two things compete, shrink or dim one.

## 2. Type that works on a phone (1080x1920)
- Headline/plaque: 64 to 96 px for 2 to 5 words, heavy weight, max 2 lines. Supporting text 44 px or more. Captions 40 to 76 px depending on the preset. Nothing readable is under 36 px. Evidence screenshots: capture at 480x486 scale 2 so the page text lands at 30 px or more in the card, and highlight the ONE sentence.
- Contrast: light text on dark plate or dark on light; put a plate or shadow under text on busy backgrounds. Never light text straight on a bright sky or a photo.
- One font family for headlines, one for small mono labels; sentence case for calm styles, UPPERCASE only where the pack uses it and never for long lines.
- Keep text off faces and off platform buttons (right 120 px, bottom 300 px, top 180 px).

## 3. Colour
One accent colour per pack, used for the key word, the number, the burst. Characters are the brightest or most saturated thing in the frame. Backgrounds recede (darker, softer, blurred by depth of field). Do not add colours the pack does not have.

## 4. Layout and staging
- Rule of thirds for the focal point; characters in the lower third when a set piece sits above (neon-stage); headroom for faces; look-room in the direction a character looks.
- Safe zone: content y 180 to 1380 (packs may override). Captions at the pack's `caption_y`; nothing important in that band.
- Fill the frame with ONE idea: no empty stages, no tiny objects in huge space; scale a set piece until it reads at thumbnail size.
- Depth: foreground / action plane / background with different blur and light; 3D shots use the camera, not flat sliding.

## 5. Motion (what makes it feel produced)
- Ease everything (out for entrances, in-out for moves); entrances overshoot a little (springs); exits are faster than entrances.
- Anticipation and follow-through: a character leans before it moves; a card settles after it lands.
- Stagger: elements of a group enter 3 to 6 frames apart, never all on one frame. One focal action per beat.
- Land the action on the spoken word (anchors); the sound lands 2 to 3 frames BEFORE the visual peak.
- Camera moves only with a reason; a hold is a decision. Do not loop a motion that has finished.

## 6. Overlays: which to use for what
`plaque` names the beat (2 to 5 words, top). `counter` is for any number that matters (counts up on its word). `bubble` is a character's reaction (emoji + 1 to 3 words). `burst` punctuates ONE impact word. `sticker`/`label` tag an object. `callout`/`scribble` point at a part of a real screenshot. `step-chip` numbers a sequence. `progress`/`waveform` show time passing. Maximum two overlays on screen at once; each has a reason.

## 7. Evidence honesty (never traded for looks)
Real pages are captured, shown whole enough to be believed, and highlighted; recreated or simulated UI is an illustration and is labelled when it could pass for real. Numbers on screen match the script and the research.

## 8. Style fit
Open the pack's `STYLE.md` and obey its rules before your taste. Compare against the pack's `preview/` stills: your frames should look like they belong to that family. If a better-looking component exists in remocn and fits the pack, use it (see `skills/remocn`).

## 9. Self-check on every still (do it, with the image open)
Focal point obvious? Text readable at thumbnail size and not on a face? Caption band free? Colours only from the pack? Anything cut off at an edge? Anything out of focus that should be sharp? Fix what fails; do not ship a frame you would scroll past.
