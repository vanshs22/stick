# Long-form 16:9 (YouTube): how the frame is built, and how it is checked

Set `brief.aspect: "16:9"` and `platform: "youtube"`: the frame is 1920x1080 and everything below follows. Portrait (9:16, 1080x1920) is unchanged. `tools/other_layout.mjs <project>` shows your shots in the other shape before you commit.

## The frame (px of 1920x1080, `remotion-template/src/engine/tokens.ts`)
| Zone | Value | Notes |
|---|---|---|
| Content zone | y 0.14H to 0.78H (151 to 842) | cards live here; a card shrinks to fit or grows to 1.3x |
| Left column | `content_left` = 0.4W with a presenter, 0.36W with the `headline` caption, else 0 | the host or the headline text; cards take the rest |
| Caption band | y 0.8H (864) | word-pop, boxed, phrase, karaoke, one-word, typewriter |
| Top band | y 0.07H | frame labels, step labels |
| Dock lane | 110 px at the bottom of the content zone | reserved only when a shot has strip overlays |
A pack may override these with `tokens.safe_zone_landscape`.

## Captions in 16:9
`headline` is a left column of 2-3 lines (portrait: one line at the top). It no longer costs height: cards keep the full content zone beside it. `dialogue` sits at the top; `word-pop`, `phrase`, `boxed`, `karaoke` use the bottom band. Long-form films usually want `phrase` or `word-pop`; a burned-in caption is optional because `package_youtube.mjs` writes an SRT.

## Overlays are placed by their ROLE (`engine/Overlays.tsx`)
Positions in a storyboard are authored on the 1080x1920 portrait canvas. In landscape each overlay goes where its role needs it, so it never sits on the words of a card:
| Role (`place`) | Types (default) | Landscape position |
|---|---|---|
| `dock` | sticker, step-chip, calendar, bubble, callout, impact | on the card's TOP edge, 80 percent outside it, on the side authored; size estimated so it stays inside the frame (impact is scaled to 75 percent) |
| `strip` | tags, progress, warning, waveform, counter | the reserved lane under the card (the card shrinks to leave it) |
| `card` | cursor, scribble, burst, hearts, remocn | the portrait position is mapped proportionally onto the drawn card (cursor `from`/`to` too), so a circle still circles the same part of the picture |
| `free` | any (opt-in) | fractions (-2..2) or px of the frame as written |
Set `"place": "card"` on a tag you really want on the picture. Fractions of the frame always work in both shapes.

## Cards
Every card has a landscape shape (wide rows, side-by-side columns, text beside the picture). Cards that are not Zone cards (BigStat) respect `content_left`. A card is on screen within 0.4 s of the cut even when its word comes late; typing, circles and ticks still wait for their word (a card that waited for the word left an empty frame, and the video critic read it as an unplanned cut).

## Measuring it: the layout lab and the layout critic
```
node tools/layout_lab.mjs --style editorial-notebook --aspect both --at 0.8 --out review-lab
node tools/layout_lab.mjs --style all --aspect 16:9 --shots S01,S04,S08,S11,S13,S15,S19,S25      # every pack, a subset (3D backdrops are slow without a GPU)
node tools/layout_lab.mjs --style editorial-sticker --captions headline --aspect 16:9
```
It renders the fixture `examples/layout-gallery` (28 shots: every card, with overlays of every role, authored in portrait px) in a throwaway project, probes real DOM boxes, runs the critic and writes one labelled sheet per style and shape. Exit code 1 on a major finding. Use it after ANY change to a card, an overlay, a caption preset, a safe zone or a pack. LOOK at the sheet too: the critic measures geometry, not taste.

`tools/critics/layout.mjs` checks (in every project, `critique.mjs <P> layout`): text cut off by the frame; a card outside its content zone; a card filling under half of its zone; a tag covering a card's words; a tag or card text over a caption; caption words over each other; **text too small to read** (under 2.6 percent of the short side, 28 px at 1080).

## The YouTube package
```
node tools/package_youtube.mjs <project> [--title "..."] [--thumb-at 5] [--thumb-text "THREE WORDS"] [--min-chapter 30]
node tools/critique.mjs <project> youtube
```
Writes `renders/youtube/`: `chapters.txt` (first at 0:00; a `chapter` field on a script line starts one, else a change of `beat` does), `captions.en.srt` (two lines of at most 42 characters, 1 to 6 s, no overlaps), `thumbnail.jpg` (1280x720 from a frame, 2 big words never ending on "from" or "a", under 2 MB), `description.md`, `youtube.json`. It is a draft: read it and edit it. The `youtube` critic checks frame size, title length (100 max, 70 reads fully), chapter rules (3+, each 10 s+, from 3 minutes), SRT validity, thumbnail spec, description. Nothing is uploaded.

## Writing for long-form (read `skills/reel-craft` too)
One promise in the first 15 s and a reason to stay; a chapter every 1 to 3 minutes with its own small payoff and a new picture idea; re-hook at each chapter start; B-roll or a card change at least every 8 to 12 s; no card with more than about 25 words; end with one next video, not three asks.
