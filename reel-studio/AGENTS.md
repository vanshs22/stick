# For agents that read AGENTS.md instead of skills (OpenCode, Codex, Cursor, Kiro)

Read `START-HERE.md` (one page: the flow and the ten quality rules), then `RUNBOOK.md` (one page) in this folder, and follow them. `SKILL.md` is the reference; open it only when the runbook points you there. Load the skill in `skills/<stage-name>/SKILL.md` when you reach that stage.
`TK` is this folder. Projects live in `./reel-projects/<name>` of the user's working directory (`new_project.mjs <name> --dir <parent>` puts them elsewhere).

Modes: PRODUCTION mode (making a video) never edits the toolkit; TOOLKIT DEVELOPMENT mode (the user asks you to improve/fix the toolkit) may edit `tools/`, `remotion-template/`, `style-packs/`, `schemas/`, `skills/` and must add tests and run `node tools/selftest.mjs`. Details: the top of `RUNBOOK.md`. Approval gates stay real in both modes.

## Where the craft lives (read before the step it covers)
`docs/STORY-BRAIN.md` (how to write the script) · `docs/STYLE-GUIDE.md` (new looks, 2D, Stage3D and 3D as data) · `docs/CHARACTER-BIBLE.md` (characters, faces, emotions) · `docs/CAMERA-GRAMMAR.md` · `docs/OVERLAY-BRAIN.md` (what to show on every word) · `docs/OVERLAY-GRAMMAR.md` · `docs/AUDIO-MUSIC.md` · `docs/CAPTIONS-TYPOGRAPHY.md` · `docs/PHOTOREAL.md` · `docs/LONGFORM-LANDSCAPE.md` · `docs/INKBEAT.md` · `docs/TECH-STACK.md` · `docs/REQUIREMENTS.md`. Show every gate in the chat with `node tools/present.mjs <project> <view>`; three approvals by default (direction, blueprint, final).
