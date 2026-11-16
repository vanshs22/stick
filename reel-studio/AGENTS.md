# For agents that read AGENTS.md instead of skills (OpenCode, Codex, Cursor, Kiro)

Read `RUNBOOK.md` (one page) in this folder and follow it. `SKILL.md` is the reference; open it only when the runbook points you there. Load the skill in `skills/<stage-name>/SKILL.md` when you reach that stage.
`TK` is this folder. Projects live in `./reel-projects/<name>` of the user's working directory (`new_project.mjs <name> --dir <parent>` puts them elsewhere).

Modes: PRODUCTION mode (making a video) never edits the toolkit; TOOLKIT DEVELOPMENT mode (the user asks you to improve/fix the toolkit) may edit `tools/`, `remotion-template/`, `style-packs/`, `schemas/`, `skills/` and must add tests and run `node tools/selftest.mjs`. Details: the top of `RUNBOOK.md`. Approval gates stay real in both modes.
