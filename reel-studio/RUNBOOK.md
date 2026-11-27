# Runbook for any agent (read this first, it is short)

You need a shell and file access (Claude Code, OpenCode, Codex, Cursor, Kiro, Cline, Aider ...). A plain chat window without a shell cannot run this toolkit.
`TK` = this folder. `P` = the project folder.

## Two operating modes (decide which one you are in, from the user's task)
**Production mode** (the user wants a VIDEO): the toolkit is a fixed instrument. Change project files only: brief, script, storyboard, assets, audio plan, typography, captions. Do not edit `tools/`, `remotion-template/`, `style-packs/`, `schemas/` or `skills/`. If the toolkit itself is wrong, stop, tell the user what and why, and offer to switch mode.
**Toolkit development mode** (the user asks you to improve, fix or extend the toolkit): you are authorised to edit `tools/`, `remotion-template/`, `style-packs/`, `schemas/`, `skills/`, installers and tests. Rules there: find the root cause (grep every caller), fix the shared code once, add or extend a self-test or regression fixture for each bug (`tools/selftest*.mjs`), run `node tools/selftest.mjs` before you stop, keep `docs/REPAIR_LOG.md` and `CHANGELOG.md` current, and report what is implemented, what is tested and what is unverified. Never mark something verified that you did not run.
In both modes the approval gates stay real: no one approves for the user.

## The loop
1. `node $TK/tools/next.mjs $P` prints the ONE next step: the skill to read, the exact commands, what "good" looks like.
2. Do it. Read the named skill file (`skills/<name>/SKILL.md`) only when `next` names it.
3. Run `next.mjs` again. Repeat until it says all stages are done.
At a user gate `next.mjs` says "ASK THE USER and STOP". Ask one clear question with the files to look at, wait, then record their own words with `state.mjs approve --quote`. Never approve for them.

## Show the work in the chat, ask ONE question (three approvals by default)
Every gate is shown IN THE CHAT, not left in files: `node $TK/tools/present.mjs $P <direction|script|storyboard|captions|sound|blueprint|final>` prints markdown tables (paste them into your reply) and lists the images to open with your image viewer so the user sees them in the conversation. Then ask one question and STOP.
The default flow has THREE approvals from the user: (1) **direction** (brief, style look, topic, research angle: `present direction`); (2) **blueprint** = storyboard frames and assets + voice, music, type and captions in ONE answer (`present blueprint`, then `state.mjs bundle <P> request` and, after the user's own words, `state.mjs bundle <P> approve --quote "..." --all-frames`); (3) **final** (`present final`). The script is shown with the direction (`present script`) and may be delegated at the start ("run through to the storyboard": `approve --delegated --quote "<their instruction>"`, shown as DELEGATED in the receipt). The five gates and their signed chain are unchanged underneath: nobody approves for the user, every approval is tied to the files shown and goes stale if they change.
You, the host model, are also a critic: open the images the packet lists and answer its rubric (`critique.mjs <P> vision --packet <critic>` then `--submit`). Critics for the new engines: `photoreal`, `overlays`, `faces`, `thumbnail`. Fix what you find (`fix_plan.mjs`) at most 3 rounds per critic, then show the user what is left.

## The gate protocol (real projects): FIVE gates only
`direction` (brief + style + topic + research angle), `script_review`, `storyboard_review` (frames one by one + assets), `sound_review` (voice, music, type, captions), `final`. Production readiness, critics, asset licences, picture and sound checks are automatic and refuse bad work without asking the user.
1. `next.mjs` says `request approval`: run `state.mjs request <P> <stage> --question "<one clear question>"`. It writes `review/approvals/<stage>.md` and prints STOP.
2. Show the user the files it lists (images first) and ask that ONE question. Do nothing else until they answer.
3. Their answer is the quote: `state.mjs approve <P> <stage> --quote "<their exact words>"`. For the storyboard the user decides each frame (`state.mjs frame <P> S03 approve|reject|replace`); `next.mjs` lists every command.
4. If they ask for changes: make them, re-run the stage's checks, `request` again. Editing an approved file makes the approval stale on purpose.
5. `start`/`done` bookkeeping is automatic: you never call them. `state.json` is signed: setting "approved" by hand is detected and the gate stays shut.
The craft skills decide how good the result is: `script-writing` (story), `design-craft` (frames), `edit-craft` (pace, sound, captions, packaging). Read them when `next.mjs` names them.

## Craft and finishing (read `skills/reel-craft/SKILL.md` before the script and again before the storyboard)
- **Cast and emotion:** two or more speakers? Put `cast` in `script.json` (gender + tone) and a `speaker` and `emotion` on each line. A female role gets a female voice, a male role a male voice, never the same voice twice. Use at least three emotions in a story. Give each speaker a different look with `presenter.look` in the storyboard (`beard:false, longHair:true, hair, skin, jacket`).
- **Reference style + twist (image or video):** read `skills/reference-style/SKILL.md`. `ingest.mjs`, `style_brief.mjs --template` (LOOK, fill, `--validate`), `style_map.mjs`, `blueprint.mjs` (video), `twist.mjs --idea "..." --levers palette_shift,character_swap`. After the render: `critique.mjs <P> style` and `style_check.mjs` (look at `review/style-compare-<ref>.jpg`). The `reference` and `style` critics check the twist is really in the film.
- **Finish:** `build_video.mjs <P> --upscale` also writes `<name>.4k.mp4` (Lanczos, instant, no AI) from the master that passed QA. Then `critique.mjs <P> all` (includes `toolchain`, which proves each stage's tool ran), `qa/contact_sheet.mjs`, `audio/ears.py <P>`. Look at the sheet, listen to the clips (or hand them to the user).
- **Seal:** `state.mjs seal <P> <renders/video.mp4>` (the video the user approved as final).

## Style and long-form
- A look the gallery does not have (realistic 3D, chalk, neon, anything): `skills/style-studio` and `docs/STYLE-GUIDE.md`. Pictures first, the user chooses, then the same pipeline.
- 16:9 / YouTube: `docs/LONGFORM-LANDSCAPE.md`. After any card, overlay, caption or pack change run `node tools/layout_lab.mjs --aspect both`; for a finished film `package_youtube.mjs` then `critique.mjs <P> youtube`.

## Overlays: think word by word
Before the storyboard gate read `docs/OVERLAY-BRAIN.md` and run `node $TK/tools/overlay_director.mjs $P --apply`: every concrete word (number, price, date, list, platform, action, failure, win) gets a literal picture on its word, in one themed skin, a new visual every few seconds. The storyboard critic measures coverage and gaps. You add what only understanding can: the prop for an idea no rule knows.

## Before you call a release ready
`node tools/selftest.mjs --full`, then `node tools/style_matrix.mjs` (every style through the whole pipeline; add `--only` for a subset; the inkbeat styles need a GPU or hours) and LOOK at the contact sheets it collects.

## Five rules that matter most
1. Look at pictures before you say they are good: open the contact sheets and frames. If you cannot see images, say so; do not claim you looked.
2. Real facts only: every claim has a source in `research/research.json`; evidence is a real capture (`capture_web.mjs --expect`), never a drawing.
3. In PRODUCTION mode do not edit the toolkit (`tools/`, `remotion-template/`, `style-packs/`): fix a bad look in the storyboard (pose, framing, anchor, component, capture size). In TOOLKIT DEVELOPMENT mode fixing the toolkit is the job (see the two modes above).
4. Start the storyboard from `scaffold_storyboard.mjs`, then improve each shot; for each non-character shot also try `remocn.mjs search` and keep what looks better.
5. After any fix rebuild with `build_video.mjs`: only the changed shots re-render.

## If a tool fails
Read its last lines, fix the input it names, run it again. If the toolkit itself is wrong: in production mode stop and tell the user what and why (do not hide it); in toolkit development mode fix it at the root and add a regression check.

## Good to know
- TEST projects (`new_project.mjs ... --test`, needs `REEL_TEST_MODE=1`) skip the approval gates and say TEST in every receipt: use them for dry runs, never for a real delivery.
- Capture a quote that is below the fold with an actions file: `[{"do":"scroll","y":300},{"do":"wait","ms":700},{"do":"screenshot","name":"page"}]` plus `--actions file.json --viewport 480x486 --scale 2 --expect "<the sentence>"`. `--expect` fails unless the sentence is inside the picture. Open the PNG.
- Build times (software rendering, no GPU): about 6 to 10 minutes for a 30 to 40 second preview at `--scale 0.5`. A rebuild after a fix re-renders only the shots that changed (the voice is reused unless the script or voice choice changed): expect 1 to 2 minutes.
- Time never matters more than looking at the pictures.
- Write every contact sheet to a NEW file name (final-v2.jpg): the image viewer caches by path and shows the old picture.
