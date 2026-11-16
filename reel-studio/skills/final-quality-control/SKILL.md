---
name: final-quality-control
description: Final checks and delivery of the finished video - full render, automated QA, editorial review, cover frame, caption text, sources and a production report. Use for the final and deliver stages.
---

# Final quality control and delivery

## Render and measure
1. Final render (see remotion-production) to `$P/renders/<name>.raw.mp4`.
2. `node $TK/tools/qa/final_qa.mjs <raw.mp4> $P/renders/<name>.mp4` normalises loudness (-14 LUFS, true peak -1.5), then checks black frames, frozen picture, clipping, length and size; it writes `<name>.qa.json`. Read it.
3. `node $TK/tools/qa/audio_check.mjs $P/renders/<name>.mp4` and `node $TK/tools/qa/contact_sheet.mjs $P/renders/<name>.mp4 $P/review/final.jpg --every 1`. LOOK at the sheet.

## Editorial critic (`review/critics/final.json`, critic `editorial`)
Watch it as the viewer: stills in order and the script together.
- First second: would you stop scrolling? Is the hook visible AND audible immediately?
- Flow: each shot earns its time; no dead air; the proof lands; the ending loops or invites a comment.
- Promise kept: the video delivers what the hook promised, with real evidence.
- Consistency: one style from start to end; the sound design supports, never distracts.
- Claims: every statement on screen matches `research.json`; unverified claims are absent.
- Platform: safe zones respected, length right, captions readable.
Verdict `pass` needs score >= 80 and no blocker. Fix the named stage and re-render only what changed.

## Final gate (user approval)
Give the user: the video path, the contact sheet, three lines on what is strongest, anything you could not check (say plainly if you cannot hear audio or view video), and ask: "Approve, or what should change?" Offer one round of precise changes.

## Deliver (after approval)
Write into `$P/renders/`: `cover.jpg` (best opening frame: `ffmpeg -ss <t> -i video -frames:v 1 cover.jpg`, chosen from the sheet), `post.txt` (title, caption, 5-8 hashtags, the CTA line), `sources.md` (every source and asset with licence), `production-report.md` (brief, style, tools versions, QA numbers, critic rounds, what changed after feedback). If the file is > 35 MB also make a share copy: `ffmpeg -i in.mp4 -c:v libx264 -crf 21 -preset slow -c:a aac -b:a 160k -movflags +faststart share.mp4`.
Then ask for one line of feedback and write it to `$TK/memory/learnings.md`. Publish or upload ONLY if the user asks, and confirm title and visibility first.

Rendering options and codecs: `node $TK/tools/rs.mjs render rendering`. Licence note for the user: `rs.mjs license`.

## Final pass (v2)
0. A half-size build is a preview. Deliver only a scale-1 build: `node $TK/tools/build_video.mjs $P` (the final critic reports a preview as minor so you cannot forget).
1. `node $TK/tools/critique.mjs $P stage:render` (frames, whole-video and final delivery critics, reference similarity) and open `review/final.jpg`.
2. Findings name shots: `node $TK/tools/fix_plan.mjs $P`, fix, then re-render ONLY those shots: `node $TK/tools/render_segments.mjs $P --shots S03` (cached by content hash) and `node $TK/tools/assemble.mjs $P`.
3. The user can reject, replace a shot, change music, captions, a transition or the pacing: `node $TK/tools/state.mjs change $P <kind> --shot S03 --note "..."`.
4. Deliver: `state.mjs seal $P renders/<name>.mp4` writes the receipt (who approved what, which gates were delegated). If the voice is AI-generated, remind the user to switch on the platform's AI label. Never claim a vision critic ran if you could not open the images.
