# LOG: reel-studio test run, "What a git branch really is"
See (f) at the end for the count.

## Notes
- [guess/instr] A workspace rule (stick/reel-studio/AGENTS.md) says to read RUNBOOK.md then SKILL.md; the task said RUNBOOK only. I read root SKILL.md (95 lines) once (not a skills/<name> file). Counted separately.
- new_project.mjs succeeded; its output "next: write brief.json (schema: production-brief), then follow the stages" - but RUNBOOK says loop on next.mjs. Slight mismatch.

## (a) Failed commands
1. `capture_web.mjs <url> --viewport 480x486 --scale 2 --expect "<sentence>"` (exactly as next.mjs printed it for the research stage) FAILED: `the text ... is on the page but outside the frame (y 2032 to 2073, frame height 486): scroll less or more, or use --full`. next.mjs's printed command can never work for a sentence below the fold; it does not mention an actions file. Fixed by writing assets/SRC1-actions.json (scroll y=1800, wait, expect, screenshot) -> passed. The failed attempt left assets/SRC1/capture-failed.json behind (harmless clutter).

## (b) Guesses
- intake/style/topic/research stages: next.mjs says "Write brief.json" but never says to run state.mjs start/done/request/approve; stages stay `pending` in `state.mjs show` until I ran them (check,start,done,request,approve). I guessed from SKILL.md section 1. I wrapped it in /projects/sandbox/rp/agent-test2/stage.sh.
- `choose.mjs <P> style <id>` is only mentioned in video-director SKILL.md, not by next.mjs at the intake step (next.mjs jumped from intake straight to topic after brief.json validated, without telling me about choose.mjs; I knew it only because I read SKILL.md/video-director).
- Actions-file format for the capture: I used `{"do":"scroll","y":1800}` etc. from the playwright-capture skill; I had to read that skill (not named by next.mjs) -> counts toward (f). Scroll value 1800 guessed from the failed-capture message (text at y 2032): text lands about y 232 in frame, not under the sticky header. Worked first try.
- Source `type: "official"` guessed from the video-research skill.
- Licence note on Pro Git: I did NOT verify the book's license text; I wrote that it was not re-verified.

## (c) Wrong/outdated instructions
- RUNBOOK.md rule 2 / next.mjs research step: the printed capture command with only --expect (see (a)1).
- next.mjs research step says `read: skills/video-research/SKILL.md` but evidence capture needs skills/playwright-capture/SKILL.md (the actions file); next.mjs does not name it.
- video-research SKILL.md: "Write `review/critics/research.json` (schema critic-report)" by hand, but `critique.mjs <P> stage:research` writes it. Not consistent (next.mjs is right).
- AGENTS.md says to read SKILL.md after RUNBOOK; the RUNBOOK says read skills only when next names them. Contradictory entry points.
- (b) script critic ran with stage:script (next.mjs listed it only as part of "script" step); I then also did state ritual for script_critic. next.mjs went straight from "script" to "storyboard" with no mention of the script_critic stage at all.
- (b) Script: dropped the HEAD line (C4) to hit ~30 s (80 words / 2.4 / 1.1 speed). Claim C4 stays in research unused.

## Storyboard stage notes
(b) guesses:
- Overlay x,y: manifest.json/overlay doc lists `x, y` with no unit; storyboard SKILL says nothing. I guessed fractions (0..1) and the stickers ended up cut off at the top-left corner (S01 "COPY?", S03 "master", S07 tag). Only by reading remotion/src/engine/Overlays.tsx line 11 did I learn "Positions are pixels on the 1080x1920 canvas (x = centre)". Not in any skill.
- `evidence.asset_id`: I guessed "SRC1-1" (the id in assets/manifest.json), while research uses "SRC1".
- Remocn `RemocnBlock` props: `scale`/`dy` only in the component's source comment, not in skills/remocn (it mentions `scale` but not `dy`).
- remocn components default to dark theme/own brand: I set theme light / background transparent by reading `remocn.mjs info`.
- preview_at: remocn smash-count counts up from 1, the review still showed "1"; had to add `preview_at: 0.9` on the shot (skill says so, but for "cards that build up"; remocn blocks are not listed).
(c) wrong/outdated:
- storyboard SKILL.md "29 components ... (Scene3D)" but manifest lists Stage3D, FlowDiagram, HtmlBlock, RemocnBlock, FileList... (count not 29). Minor.
- storyboard SKILL.md: "Critters ... `medium-close-up` crops": scaffold gave the BLOCKY hero `medium` which already cropped head+arms in a 9:16 still (S01, S09). The skill says blocky "medium or wider" but the scaffold's own default (medium) was too tight; I changed it to medium-wide.
- Scaffold put the real-capture BrowserWindow on L03 (a claim for C2) instead of L02 (C1, where the quoted sentence belongs), and left `draft:true`. The BrowserWindow shot (S03) sent the evidence to the wrong line; I rebuilt it as ProofCard on L02 with my own highlight.
(d) What I changed after looking at images:
- S01: scaffold `medium` framing cropped head/hands, sticker clipped off-screen -> medium-wide, sticker moved to pixel coords.
- S03: my Timeline card had yellow dates on sky (unreadable), label "Add feature #32" clipped at right edge, line drawn across the house -> replaced with FlowDiagram (cards on white). "master" sticker covered the node text -> moved below node.
- S02: red circle cut through the second text line -> enlarged highlight box (x .03 y .435 w .94 h .17).
- S07: tags overlay is 28px, unreadable -> sticker size 84 at pixel coords.
- S08: yellow accent word "really" invisible on pale sky -> removed `accent`.
- S09: character cropped by `medium` -> medium-wide.
- remocn comparisons (side-by-side images in review/compare/):
  * S05: ours BigStat (black 40 crossed by the house roof, label touching both edges) vs remocn smash-count (first still showed "1": needed preview_at; then white opaque stage; with background transparent + scale .85 + dy -300 it is a big red 40 clear of the caption band). KEPT remocn. Its label was pushed offscreen by dy so I used our callout overlay.
  * S06: ours Versus vs remocn versus-split. remocn showed a hard-coded "Remocn" logo, wide caps text clipped on the right ("COPY THE FO"), hid the world. KEPT ours.
  * S08: ours EndCard vs remocn post-script. post-script = flat white card, P.S. line collides with caption. KEPT ours.

## Audio / typography / captions / build notes
(a) Failed commands
2. `TTS_SCRIPT=data/tts.json python3 $TK/tools/audio/voice.py .` (exactly as in skills/audio-production/SKILL.md "Voice stage" step 3): `ModuleNotFoundError: No module named 'numpy'`. The system python3 is not the toolkit's. words.py with the same python3 did NOT fail: it printed "Whisper unavailable (ModuleNotFoundError); spreading words inside the exact line times instead" and wrote an even-spread words.json (silently worse caption timing). Work-around: run both with `$TK/.venv/bin/python`. Neither next.mjs nor the skill names the right interpreter (in a normal install `python3` may be right; here REEL_PY is unset by the wrapper).
3. `state.mjs approve $P storyboard` before `state.mjs frame ... approve` for each of S01..S09: "storyboard frames not approved one by one". Expected, but next.mjs does not mention per-frame approval at all.
4. `state.mjs request $P assets` / `build` / `visual_critic` / `audio_critic`: '"build" is done: it must be shown to the user with "request" first' (and "X is not an approval gate"). Confusing: the message says to run `request` but `request` says it is not a gate. next.mjs never asks for these, so ignore.
5. Image viewer returned ENOENT twice (read_file on review/compare/S05-remocn-v2.jpg, review/gallery/captions.jpg) right after the command that wrote them; a re-read a few seconds later worked. Probably my tool, not the toolkit.
6. `choose.mjs $P voice ...` succeeded but next.mjs kept saying "audio: not finished". Cause: audio-plan.json keeps `"status": "DRAFT defaults for timing only..."` (written by storyboard_review/build_timeline) and next.mjs line 14 requires no "DRAFT" in status; choose.mjs (voice branch) updates voice/music but never clears `status`. Work-around (inside the project, not the toolkit): I edited audio/audio-plan.json `status` by hand. Without reading next.mjs source I could not have known.

(b) Guesses
- Voice am_michael x1.1, music upbeat, sfx soft: no human, taken from the brief. Pronunciation of "git": could not hear it; Whisper heard "git" correctly (words.txt), so no pron entry.
- Typography set 5 (Friendly rounded, Fredoka) and caption preset one-word (the pack default): picked by looking at the gallery sheets. The gallery's sample text is hard-coded ("Make videos with code", "40,000 stars"), not my script, so I could not judge readability on my real text.
- `assets` stage: I just ran the state ritual; the toolkit never asked for anything (manifest.json from the capture already existed).
- Whole `production` gate: ran state ritual only, no go/no-go analysis requested by next.mjs.

(c) Wrong/outdated instructions
- skills/audio-production/SKILL.md "Voice stage" steps 3: `python3` (see failed command 2).
- skills/remotion-production/SKILL.md line 1 "FIRST run rs.mjs router markup timing sequencing ... Never write Remotion code before reading them": the build stage here needs no Remotion code at all; next.mjs names this skill for `build`, so a cheap agent will waste time (I skipped it).
- skills/remotion-production "Setup": "`--shots S03,S05` forces only those shots" and RUNBOOK rule 5 "only the changed shots re-render": after I changed S02 and S05 the 2nd build_video re-rendered ALL 9 shots (segment mtimes 13:09-13:14, new hashes for every shot incl. untouched S09), taking 5m54s again. The first build took 6m12s. The rerun re-ran Kokoro/Whisper/mix too, so probably the per-shot hash includes the timeline/audio, which was rewritten (non-identical) each time.
- build_video.mjs printed "Rendering videos requires glibc 2.35 or higher on your OS. Your system has glibc 2.34." right after "rendered in ... s". It did render (video OK, no embedded video used) but the warning is unexplained; did something fall back? I did not use OffthreadVideo, so no visible effect.
- build_video.mjs final line "DONE renders/git-branch.mp4  QA: " has an empty QA field; the QA numbers are only in renders/git-branch.qa.json.
- skills/script-writing says order "cta first then save last"; the video critic (VID02) flags "the CTA keyword is not in the last captions" -> contradictory guidance (critic minor left as is).
- video critic VID03 "a very long shot 8.13s": no shot in timeline.json is longer than 4.1 s (S05). False positive or measures something else (no explanation). Left as is.
- video critic VID01 MAJOR "a cut happens that the storyboard did not plan at 4.67s": real. It was my ProofCard popping in at the word "pointer" after ~2 s of an empty block world (anchor on the card entrance). Found by contact sheet + critic, fixed (see (d)).
- After `state.mjs seal` ("TEST receipt written") next.mjs still prints "NEXT: deliver ... Seal the video ... copy the finals to output/". I ran the deliver state ritual; unclear what else it wants. Left.
- `critique.mjs <P> all` writes review/critics/SUMMARY.md but says it "looked at pixels? measured only" for every critic: the vision critics (`critique.mjs vision --packet ...`) are NOT run by `all` and next.mjs never asks for them in the visual_critic stage. I did not run `vision` packets (I looked at the images myself); see (e).

(d) Changes after looking at images (render stage)
- Final contact sheet 1 (review/final.jpg, first build): S02 (real capture) was an empty block world for tiles 3-5 (~2.3 s) and the card popped in at 4.67 s on "pointer"; S05 was empty for ~2.5 s until the count started on "forty"; a red "10" was cropped at the top edge during the count. Fixes: removed `props.anchor` on the ProofCard so it enters at the shot start; anchored smash-count and its callout on "hood" (so the count lands on "forty"), changed scale .85/dy -300 to scale .75/dy -200. Video critic went revise 86 (1 major) -> pass 96.
- Remaining in final.jpg: ~0.5 s of empty world while S02 and S05 animate in (entrance animation), the S05 count shows intermediate numbers (16 ...) which are an effect, not claims.

## Remocn used (reachable: yes; search worked from cache or net, `add` worked)
Installed: smash-count, post-script, versus-split (all MIT, license notice in remotion/src/remocn/LICENSE-NOTICE.txt).
- S05 smash-count (KEPT) vs our BigStat. - S06 versus-split (rejected) vs our Versus. - S08 post-script (rejected) vs our EndCard. Side-by-sides: review/compare/S05-side-by-side.jpg, S06-side-by-side.jpg, S08-side-by-side.jpg (+ S05-remocn-v2/v3.jpg).

## (e) Numbered changes I would make to the instruction files (not the code)
1. next.mjs / RUNBOOK: print, for every stage, the exact `state.mjs check/start/done/request/approve` sequence (one line) or point to one wrapper. I needed a custom stage.sh. Also say plainly that in TEST mode the `approve --quote` text is free.
2. next.mjs "research" step: replace the printed `capture_web.mjs ... --expect` with the version that works for text below the fold (actions file with scroll/expect/screenshot, scroll about 1800 for a long book page) and name skills/playwright-capture in `read:`. Show the actions-file JSON in the RUNBOOK.
3. next.mjs "storyboard" step: name skills/remocn, and add the concrete remocn commands in order (`search`, `info`, `add`, set `preview_at`, compare in a side-by-side) and a rule "keep only if it fits 9:16, has no brand logo, and background can be transparent". Say remocn components take `theme`, `background: "transparent"`, and RemocnBlock takes `scale`/`dy` (px).
4. skills/storyboard + manifest: state that overlay `x,y` are PIXELS on the 1080x1920 canvas (x is the centre), not fractions; say tags are 28 px (too small) and stickers are the readable choice. I lost one render cycle to this.
5. skills/storyboard: say that scaffold's `medium` framing crops the blocky hero's head and hands; start from `medium-wide`. Say the scaffold puts the real capture on the wrong line (a BrowserWindow on the line of claim 2, not the line with the quoted sentence) and that BrowserWindow/ProofCard `highlight` boxes should be taller than the text (the rough-notation ellipse cuts through the last line).
6. skills/storyboard "No empty frames": add the exact rule "do NOT put `anchor` on the entrance of a card that is the only visual of its shot; anchor overlays, not the main card, or anchor on the first word of the line". The video critic found a real glitch caused by exactly this.
7. skills/audio-production: use `$TK/.venv/bin/python` (or whatever `REEL_PY` is), not `python3`; say that words.py silently falls back to spread timings when Whisper is missing and that this is a failure, not a warning. Say that after `choose.mjs voice` the audio-plan.json still says DRAFT and how to clear it, or simply say "run build_video.mjs, it will do voice/timeline/mix" and drop the manual steps 1-5 (build_video does them all).
8. next.mjs `audio` ready-check: say what the file must contain ("status must not contain DRAFT"); currently only "audio-plan.json has no DRAFT status", with no way to learn which command removes it.
9. skills/typography / captions: say the gallery sample text is placeholder and the gallery cannot show your own words; tell the agent to decide from the pack's default (here: one-word) unless there is a reason. A cheap agent will otherwise burn 3 min per gallery.
10. RUNBOOK rule 5 / remotion-production: state honestly that a second build re-renders everything when voice/mix are re-run, or tell the agent to pass `--shots` / skip the voice step so the cache holds; add the expected time (6 min per full 0.5 build here, software GL).
11. skills/script-writing and the video critic must agree on where the CTA goes.
12. next.mjs after `critique.mjs all`: either list `critique.mjs vision --packet ...` steps (with image names to open) or state clearly "vision critics are optional".
13. next.mjs should show the per-frame approval commands for the storyboard gate and say that in TEST mode the nine `state.mjs frame <S> approve` calls are needed before `approve storyboard`.
14. skills/remotion-production: remove the "FIRST run rs.mjs ..." instruction from the build stage, or say "only if you write Remotion code".
15. RUNBOOK says read skills only when next names them, but AGENTS.md says to read SKILL.md first and SKILL.md is 95 lines of reference; make one entry point.

## (f) Skill reads other than the one next.mjs named
2 skill files: skills/playwright-capture/SKILL.md (capture actions format; next.mjs named video-research) and skills/remocn/SKILL.md (storyboard skill told me to; next.mjs never named it). Plus 1 non-skill file read because a workspace rule told me to: the root SKILL.md of reel-studio. I also read tool/component source (Overlays.tsx, RemocnBlock.tsx, Timeline/FlowDiagram in data.tsx, choose.mjs, next.mjs) to diagnose problems: that was necessary only because instructions were silent (overlay units, DRAFT status).
Skills named by next.mjs and read: video-director, video-research, script-writing, storyboard, audio-production, typography, captions, remotion-production, final-quality-control. script-critique, storyboard-critique, visual-critique were never named and not read.

## Confirmation
Nothing under /projects/sandbox/stick was edited, created or deleted (git status in that repo is clean). The only writes were inside /projects/sandbox/rp/agent-test2 (and the caches the wrapper points to under /projects/sandbox/rp, e.g. /projects/sandbox/rp/work and /projects/sandbox/rp/home).
