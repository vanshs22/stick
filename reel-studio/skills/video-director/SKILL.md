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
Run once the project exists (the Remotion packages are shared, no per-project install): `node $TK/tools/gallery.mjs $P --kind styles` (one card per style pack), `--kind typography` (5 text looks), `--kind captions` (6 caption presets). Show the sheets (`review/gallery-*.jpg`, tile order is printed) and let the user choose by looking.

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

## Do not change the toolkit to get a look
A production run uses the toolkit as it is: pack defaults, storyboard fields, tools. Do not edit `remotion-template/`, `tools/` or `style-packs/` in PRODUCTION mode (a video job). When the user asks you to improve the toolkit itself you are in TOOLKIT DEVELOPMENT mode and may (see RUNBOOK.md, two operating modes). If something is broken or missing, stop, tell the user what and why, and (only if they agree) make ONE toolkit change with a line in `memory/learnings.md` and a run of `node tools/selftest.mjs`. A look problem (face covered, text cut off, caption on the host) is first a storyboard choice: another pose, framing, anchor or capture size.

## Order of the first steps (so approvals do not go stale)
1. `node $TK/tools/new_project.mjs <name> --dir <parent folder> --style <pack-id>` creates the folders and `state.json`. `--style` does NOT write `brief.json` or the style selection.
2. Write `brief.json` yourself (required: title, topic, platform, duration_sec, language, style_pack; useful: audience, goal, voice, music, captions, cta, research), put the chosen `style_pack` in it, then `node $TK/tools/choose.mjs $P style <pack-id>`. Do this BEFORE you request the intake gate: approvals are tied to the files, and `choose.mjs` rewrites `brief.json`.
3. Request and approve intake, then style. If the user said "run through to X", record the early gates with `state.mjs approve --delegated --quote "<their words>"`; the line "STOP: ask the user to approve" that `request` prints is expected and does not apply to those delegated gates (storyboard, audio, typography, captions, production and final always need the user).

## TEST mode order (no human to approve)
`REEL_TEST_MODE=1 new_project.mjs <name> --dir <parent> --style <pack> --test`, write the brief (put `style_pack` in it), `choose.mjs <P> style <pack>`, then loop `next.mjs`. Gates are not enforced and receipts say TEST: never use a TEST project for a delivery.
