---
name: playwright-capture
description: Captures real websites, GitHub repositories and dashboards as screenshots and screen recordings with recorded sources, to use as proof inside a video. Use when the script names a real product, page, repo or number.
---

# Real evidence capture

Real proof beats drawn proof. If the video says "this repo", "this page" or "this number", show the real thing.

## Steps
1. List what to capture in `research/research.json` -> `evidence_to_capture` (url, what, actions).
2. Install once: `npm i -D playwright && npx playwright install chromium` (in the toolkit or the project).
3. Write `assets/<id>-actions.json` (goto, click, type, scroll, wait, screenshot) for each page. Keep it short and deterministic; scroll slowly; hide cookie banners by clicking them.
4. Run: `node $TK/tools/capture/capture_web.mjs <url> --out $P/assets/<id> --actions <file> --viewport 1080x1920 --manifest $P/assets/manifest.json --id <SRCn> [--record]`.
5. Look at every PNG. Check: the right page, readable text, no login wall, no personal data, no cookie popup, no error. Crop or re-capture if not.
6. In the storyboard shot set `evidence: {required: true, source_id, asset_id}` and use a component that frames the capture (browser window, zoom to a highlighted region) with a source label.

## If a capture fails
Say what failed (login, geo block, 404, bot protection) and ask the user: use another source, use a screenshot they provide, or a clearly labelled recreation. Never present a drawing as the real page.

## Rules
- Only public pages or pages the user owns/has access to. No scraping behind logins; no personal data on screen; blur anything private.
- Every asset gets a manifest entry (source url, capture date, licence note). The final report lists them.
- Third-party content is shown briefly as quoted evidence with the source named. Photos and logos only when licence allows or they are the subject of the point.
- Screenshots go through the same safe-zone rule: the important part inside y 180-1380.
