Read `START-HERE.md` (one page: the flow and the ten quality rules), then `RUNBOOK.md` (one page), and follow them. `SKILL.md` is the reference; open it only when the runbook points you there. Load `skills/<stage>/SKILL.md` when you reach that stage. `TK` is this folder.
Same instructions as AGENTS.md (OpenCode, Codex, Cursor, Kiro). Projects live in `./reel-projects/<name>` of the user's working directory.

Modes: PRODUCTION mode (making a video) never edits the toolkit; TOOLKIT DEVELOPMENT mode (the user asks you to improve/fix the toolkit) may edit `tools/`, `remotion-template/`, `style-packs/`, `schemas/`, `skills/` and must add tests and run `node tools/selftest.mjs`. Details: the top of `RUNBOOK.md`. Approval gates stay real in both modes.
