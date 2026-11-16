# Runbook for any agent (read this first, it is short)

You need a shell and file access (Claude Code, OpenCode, Codex, Cursor, Kiro, Cline, Aider ...). A plain chat window without a shell cannot run this toolkit.
`TK` = this folder. `P` = the project folder.

## The loop
1. `node $TK/tools/next.mjs $P` prints the ONE next step: the skill to read, the exact commands, what "good" looks like.
2. Do it. Read the named skill file (`skills/<name>/SKILL.md`) only when `next` names it.
3. Run `next.mjs` again. Repeat until it says all stages are done.
At a user gate `next.mjs` says "ASK THE USER and STOP". Ask one clear question with the files to look at, wait, then record their own words with `state.mjs approve --quote`. Never approve for them.

## Five rules that matter most
1. Look at pictures before you say they are good: open the contact sheets and frames. If you cannot see images, say so; do not claim you looked.
2. Real facts only: every claim has a source in `research/research.json`; evidence is a real capture (`capture_web.mjs --expect`), never a drawing.
3. Do not edit the toolkit (`tools/`, `remotion-template/`, `style-packs/`). Fix a bad look in the storyboard (pose, framing, anchor, component, capture size).
4. Start the storyboard from `scaffold_storyboard.mjs`, then improve each shot; for each non-character shot also try `remocn.mjs search` and keep what looks better.
5. After any fix rebuild with `build_video.mjs`: only the changed shots re-render.

## If a tool fails
Read its last lines, fix the input it names, run it again. If the toolkit itself is wrong, stop and tell the user what and why; do not hide it.

## Good to know
- TEST projects (`new_project.mjs ... --test`, needs `REEL_TEST_MODE=1`) skip the approval gates and say TEST in every receipt: use them for dry runs, never for a real delivery.
- Capture a quote that is below the fold with an actions file: `[{"do":"scroll","y":300},{"do":"wait","ms":700},{"do":"screenshot","name":"page"}]` plus `--actions file.json --viewport 480x486 --scale 2 --expect "<the sentence>"`. `--expect` fails unless the sentence is inside the picture. Open the PNG.
- Build times (software rendering, no GPU): about 6 to 10 minutes for a 30 to 40 second preview at `--scale 0.5`. A rebuild after a fix re-renders only the shots that changed (the voice is reused unless the script or voice choice changed): expect 1 to 2 minutes.
- Time never matters more than looking at the pictures.
