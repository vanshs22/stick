---
name: video-director
description: Runs the production conversation for a reel - intake questions, style gallery, approval gates, revisions and resuming. Use at the start of every video and whenever the user asks for a change or says approve/reject.
---

# Video director

You decide what the video is for, then keep the user in control. `TK` = toolkit folder, `P` = project folder (see reel-studio/SKILL.md).

## Intake (stage 1): ONE message, defaults filled in
Ask only what you do not know. Offer the saved creator profile (`$TK/creator/creator-profile.json`) as the default.
- Topic, or "suggest three ideas for my niche".
- Platform and length (default Instagram Reels, 40 s; Shorts and TikTok the same, vertical 9:16).
- Language and voice (default English, Kokoro `am_michael`; or the user's own recording; or captions only).
- Call to action: keyword to comment, and what they get ("Comment SKILL and I will send the system").
- Reference videos or accounts they like (links or files) - optional.
- Approvals: `ask` (default, stops at each gate) or `auto`.
Write `brief.json`, run `node $TK/tools/validate.mjs production-brief $P/brief.json`, then `state.mjs done $P intake`.

## Style (stage 2, gate)
List `$TK/style-packs/*/style.json` as a short menu: name, one-line look, best for. Show `preview.jpg` of each pack if the folder has one.
Offer the caption look at the same time (see captions skill: word-pop, one-word, boxed, phrase, typewriter, karaoke).
Recommend one pack and say why in one sentence. The user's choice is saved in `brief.json` (`style_pack`, `captions.preset`).
Never mix two style packs in one video unless the user asks.

## Galleries for the style gate (Milestone 2)
Run once the project exists and `npm install` was done in `$P/remotion`: `node $TK/tools/gallery.mjs $P --kind styles` (one card per style pack), `--kind typography` (5 text looks), `--kind captions` (6 caption presets). Show the sheets (`review/gallery-*.jpg`, tile order is printed) and let the user choose by looking.

## Gates: how to stop properly
1. `node $TK/tools/state.mjs request $P <stage>`.
2. Say what you made in 3-6 plain lines. Give the exact file or image to look at.
3. Ask one question: "Approve, or what should change?" Then STOP and wait.
4. On "yes": `state.mjs approve $P <stage>`. On changes: do them, show again. On "start over": move the old files to `$P/_old/` and redo the stage.

## Revisions and critics
Critic reports name a `fix_target`. Redo only that stage and everything after it. Tell the user in one line what changed and why.
After 3 critic rounds on the same finding, stop and show it to the user with two options.

## Resuming
`node $TK/tools/state.mjs show $P` tells you where you are. Read `brief.json`, the latest approved files, and continue. Do not re-ask answered questions.

## After the video
Ask for one line of feedback ("what would you change?"). Append it to `$TK/memory/learnings.md` (what, which style, which stage) and to the creator profile's `feedback_history`.

When the user can open a browser, offer the live Studio preview (`cd $P/remotion && npm run studio`, official rule `rs.mjs studio`) so they can scrub the video themselves at the gates.
