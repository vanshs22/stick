# Overlay grammar: props, cards, labels, screenshots, counters, badges

**Start with `docs/OVERLAY-BRAIN.md`: it is the thinking (what does the viewer SEE when this word is said?) and the tool that applies it (`tools/overlay_director.mjs`). This file is the rules and the measurements behind it.**

The brain behind every graphic that sits on a picture. Read this before the storyboard (`skills/storyboard`) and before you write `overlays`. It was built by MEASURING seven short reference reels (a stylised 3D office skit, a voxel trading explainer, a talking head with designed UI inserts, a voxel "clone the app" explainer, and our own notebook-style film) with `tools/reference/overlay_scan.py`, then looking at them frame by frame. We learn the system behind them and then beat it; we copy no wording, character, layout or brand.

## 1. What the references measure (so our targets are numbers)
`python tools/reference/overlay_scan.py <video.mp4> ... --out review/reference-scan` (plate detector, histogram cuts, optical flow, onset tempo; no OCR).

| ref | length | plates on screen (avg) | frame covered | top/mid/bottom events | cuts per min | median shot | camera still/drift/move % | bpm | cuts on a beat |
|---|---|---|---|---|---|---|---|---|---|
| r1 | 57 s | 2.73 | 2.6 % | 41/11/42 | 13.6 | 3.6 s | 1/92/7 | 126.3 | 46 % |
| r2 | 53 s | 7.4 | 13.8 % | 164/67/21 | 4.5 | 6.0 s | 0/53/47 | 134.8 | 25 % |
| r3 | 53 s | 3.37 | 5.5 % | 21/67/36 | 19.1 | 2.3 s | 6/22/72 | 139.5 | 47 % |
| r4 | 48 s | 5.34 | 9.7 % | 27/71/48 | 12.6 | 4.0 s | 5/55/40 | 103.4 | 20 % |
| r5 | 38 s | 3.92 | 7.3 % | 38/58/28 | 9.4 | 2.6 s | 1/30/69 | 85.7 | 17 % |
| r6 | 48 s | 3.49 | 6.7 % | 56/63/32 | 9.9 | 4.6 s | 0/34/66 | 85.7 | 25 % |
| r7 | 43 s | 4.0 | 5.5 % | 7/42/61 | 1.4 | 21.47 s | 3/69/28 | 93.8 | 100 % |
| r8 | 43 s | 5.18 | 8.7 % | 30/62/107 | 12.5 | 3.13 s | 1/30/69 | 87.0 | 11 % |
| r9 | 57 s | 5.18 | 7.3 % | 16/99/160 | 4.2 | 7.4 s | 2/35/63 | 100.0 | 50 % |

How to read it. Event counts and stay times are not listed: the tracker splits one plate into several, so they overstate. The credible numbers are the ones above. Findings:
- **Plates, not floating words.** 3 to 7 flat text plates on screen at a time cover 5 to 14 percent of the frame. Only the HUD-heavy trading explainer (r2) goes to 7.4 plates and 14 percent, and it earns it with a constant header and counters. Our budget: at most **4 overlays at once**, and **under 15 percent of the frame** unless the card itself is the shot.
- **Vertical bands.** Headers and section tags sit in the top band (r2: 65 percent of events at the top), captions in the lower band, cards and object labels in the middle. The middle band belongs to the subject: a label sits next to what it names, never over a face.
- **Cut rhythm 1.4 to 19 per minute.** Fast dialogue and talking heads cut every 2.3 to 4 s. A slow designed film holds a shot 20 s but fills it with changing graphics. Match rhythm to content, not a timer.
- **Camera is rarely still.** Still frames are 0 to 6 percent in every reel except one; 22 to 92 percent drift (a slow move or sway), 7 to 72 percent clear moves, and pushes outnumber pulls roughly 3:2. The camera lives, even on a held shot.
- **Cuts and music.** Only 17 to 47 percent of cuts land on a beat in the voice-led reels; the music-led one lands 100 percent. Cutting on the voice's emphasis beats cutting on the music for explainers; use the beat for montage.

## 2. The ten rules (each one is checkable)
1. **Tied to a word.** Every overlay enters on a spoken word (`anchor`), within 100 ms of it, and leaves with its idea. An overlay with no anchor is decoration: the storyboard critic flags it.
2. **One hero.** One element per shot carries the accent colour and the motion; everything else is neutral and still. Two things moving at once means the viewer reads neither.
3. **A plate has a job and a shape.** Header plate (section name, 2 to 5 words, caps, a small kicker above), label plate (1 to 3 words on or beside an object), counter plate (a number that counts to its word, with a caps caption: `SIMULATIONS 27 -> 10,000`), step badge (`3/6 DOCS` small, top-left, or a big numeral in a rounded square), verdict stamp (VERIFIED, NOT A GUARANTEE, slammed with a 6 degree tilt), impact word (one giant word behind or over the action, outlined, used at most once per film).
4. **Real evidence beats a drawing.** A claim about a page shows the real capture (`ProofCard`, `Footage` with `window: browser`), circled where the claim is, with the source named small. A designed UI card is allowed when it is the explanation, and it says "illustration".
5. **Cards float, they do not sit.** A UI card has a soft shadow, a 1 to 4 degree tilt, a 2 to 3 px dark border or glass chrome, and enters with a short scale from 0.88 plus a 28 px rise over 7 frames (overshoot at most 6 percent). It leaves in 4 frames. Behind it the picture drops in focus or dims 25 percent.
6. **Size by reading time.** A plate stays at least `0.9 s + 0.28 s per word`. Text is at least 28 px at 1080 on the short side (the critic measures it). Labels 1 to 3 words; a card 25 words at most.
7. **Positions are roles, not pixels.** Portrait: header y 70 to 190, cards 180 to 1380, captions about 1440. Landscape: see `docs/LONGFORM-LANDSCAPE.md` (dock, strip, card, free).
8. **Sound belongs to the entry.** Each entry has one sound: a soft tick or pop at gain 0.3 to 0.5 for plates and badges, a swish for slides, a thud for stamps and impact words. Never two plates on the same frame with two sounds.
9. **Keywords get a second voice.** In the caption or in a card, the one keyword of a sentence is set in the accent colour and an italic serif (the reference pattern `BUILDING` in red italic caps). One keyword per sentence.
10. **Nothing covers a face or a hand that acts.** In a character shot, the overlay band is where the character is not (`presenter.look`, `cast.at`): choose the side from the framing.

## 3. Recipes: what to use for what
| The line says... | Use | Where and when |
|---|---|---|
| a number, a score, a price | `BigStat`, or `counter` overlay on the picture | counts up on the word; plate with a 2-word caps caption; sound: tick per 10 percent |
| "look at this page / the docs say" | `ProofCard` or `Footage window:browser` | real capture; circle drawn on the anchor word; source line below |
| a command | `Terminal` | types on the verb; output lines labelled "illustration" |
| a list of 3 to 5 things | `KineticList` or `Checklist` | one item per spoken item, anchors `item0..`; tick sound per item |
| this vs that | `Versus` | VS badge pops on the word "versus" / "instead" |
| steps | `step-label` + `Checklist` | step label at the top band, `n of N` dots |
| a place or route | `RouteMap` or a photoreal `PlateShot` | stops draw on their names |
| a warning or a cost | `warning` strip or `Stamp` | amber plate in the strip lane (landscape) or y 1180 to 1500 (portrait) |
| "comment WORD" | `CommentBox` + `EndCard` | last 3 s; one keyword only |
| a person's claim | `ProfileCard` / `evidence` cards | real numbers only; `badge` for the headline stat |
| an object or product | `PlateShot` (photoreal) or `Stage3D` + `tags` | label plates on the object, not over it |
| a reaction | face close-up + one caption plate | no other graphic on screen |

## 4. How we go beyond the references
- **A budget the critic enforces.** More than 4 overlays at once, an overlay with no anchor, two overlays on the same anchor within 150 ms (a pile-up), or a shot whose graphics cover more than 15 percent of the frame are flagged by the storyboard critic. Text under 28 px is flagged by the layout critic.
- **Roles, not coordinates,** so the same storyboard works in 9:16 and 16:9 (`place`).
- **Measure before copying.** `overlay_scan.py` turns a new reference into the table above; `tools/reference/blueprint.mjs` and `twist.mjs` then carry its rhythm into a new film with a twist (new subject, new characters, new palette).
- **Colour roles from the pack:** accent only on the hero; contrast at least 4.5 to 1 against the plate it sits on.
- **Evidence labels:** a drawing is labelled as an illustration; a capture shows its date and URL (`Footage.source`, `ProofCard.source`).

## 5. Checklist before the storyboard gate
- Every overlay has an `anchor` that is a real word of its line.
- At most 4 at once; the hero is clear; one thing moves at a time.
- No overlay over a face; tags sit beside the object they name.
- Labels are 1 to 3 words, text is at least 28 px, plates stay for their reading time.
- Real evidence for every claim about the world; illustrations are labelled.
- Looked at the contact sheet in the delivery frame shape (`other_layout.mjs` for the other one).
