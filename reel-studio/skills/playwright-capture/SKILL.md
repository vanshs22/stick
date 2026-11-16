---
name: playwright-capture
description: Captures real websites, GitHub repositories and dashboards as screenshots and screen recordings with recorded sources, to use as proof inside a video. Use when the script names a real product, page, repo or number.
---

# Real evidence capture

Real proof beats drawn proof. If the video says "this repo", "this page" or "this number", show the real thing.

## Steps
1. List what to capture in `research/research.json` -> `evidence_to_capture` (url, what, actions).
2. Installed by `install.sh` (playwright-core with Remotion's Chrome). Nothing to do; `node $TK/tools/doctor.mjs` shows it.
3. Write `assets/<id>-actions.json` (goto, click, type, scroll, wait, screenshot) for each page. Keep it short and deterministic; scroll slowly; hide cookie banners by clicking them.
4. Run: `node $TK/tools/capture/capture_web.mjs <url> --out $P/assets/<id> --actions <file> --viewport 480x486 --scale 2 --manifest $P/assets/manifest.json --id <SRCn> [--record]`.
5. Look at every PNG. Check: the right page, readable text, no login wall, no personal data, no cookie popup, no error. Crop or re-capture if not.
6. In the storyboard shot set `evidence: {required: true, source_id, asset_id}` and use a component that frames the capture (browser window, zoom to a highlighted region) with a source label.

## If a capture fails
Say what failed (login, geo block, 404, bot protection) and ask the user: use another source, use a screenshot they provide, or a clearly labelled recreation. Never present a drawing as the real page.

## Rules
- Only public pages or pages the user owns/has access to. No scraping behind logins; no personal data on screen; blur anything private.
- Every asset gets a manifest entry (source url, capture date, licence note). The final report lists them.
- Third-party content is shown briefly as quoted evidence with the source named. Photos and logos only when licence allows or they are the subject of the point.
- Screenshots go through the same safe-zone rule: the important part inside y 180-1380.

To show a captured recording inside the video use `OffthreadVideo` and the official `embedding-videos`, `cropping` rules (`node $TK/tools/rs.mjs embedding-videos cropping`).

## Provenance and honesty (v2)
`node $TK/tools/capture/capture_web.mjs <url> --out $P/assets/<name> --manifest $P/assets/manifest.json --id SRC1 [--expect "text that must be on the page"] [--actions actions.json] [--record]` uses (actions can `wait`, `expect`, `highlight` a selector, `screenshot`; see the script header) Playwright with Chrome. Each capture writes a provenance record (url, time, page title, whether the expected text was found, file hash) into `assets/manifest.json`. If the page blocks the capture, loads wrong or the expected text is missing, the tool says so and records the failure: tell the user and ask for a file or a different source. A redrawn page is never passed off as a screenshot: use `capture/register_recreation.mjs <manifest> --id REC1 --path <file> --label "Recreated interface, not the real site" --quote "<user words>"` so it is labelled "recreation" in the manifest and on screen.

## Capture for the card (so the text is readable on a phone)
The evidence card is 940 px wide in a 1080 px frame. A desktop-width capture shrinks the text to about 14 px. Capture a narrow page instead:
`capture_web.mjs <url> --viewport 480x486 --scale 2 --expect "<text>" ...` gives a 960x972 image whose text lands at 30 px or more in the card. Docs pages and GitHub switch to their mobile layout at this width, which is what you want.
If the fact you need is below the fold (a star count, a price), add an action file with `{"do":"scroll","y":300}`, `{"do":"wait","ms":700}`, `{"do":"expect","text":"stars"}`, `{"do":"screenshot","name":"page"}` and pass `--actions file.json`. `--expect` proves the text is IN the picture: in the page, inside the frame and not behind a sticky header (the capture fails with the reason otherwise). Open the capture before you build the shot: if you cannot read the sentence you will quote, recapture.

## From capture to card
- The tool writes `$P/assets/<id>/page.png`. `storyboard_review.mjs` copies `$P/assets` to `remotion/public/assets`, so a shot uses `image: "assets/<id>/page.png"`.
- The highlight stored in the manifest is the whole paragraph. Set `highlight` {x,y,w,h} (fractions of the image) on the `ProofCard` yourself from the picture, around the sentence you quote.
- Open the PNG after every capture. After a re-capture use a new `--out` name: the image viewer caches by path and will show the old picture.
- Scroll with a sticky header in mind (about 200 px worked on docs.python.org; 330 hid the sentence).
