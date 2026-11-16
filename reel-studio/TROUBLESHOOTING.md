# Troubleshooting

Run `node tools/doctor.mjs` first: each missing item prints its fix.

| symptom | cause and fix |
|---|---|
| `Rendering videos requires glibc 2.35` warning | Remotion's compositor prefers a newer glibc. Rendering worked on glibc 2.34 in testing; upgrade the OS if renders crash. |
| render is black or very slow, "GL" errors | no GPU: `REMOTION_GL=swangle` in `.env`. Slow is expected (see README). |
| `Timed out ... delayRender` | a frame took longer than the limit: render with `--timeout 300000` and lower `REMOTION_CONCURRENCY`. |
| `Kokoro model files` missing | `python tools/audio/voice.py --download` (about 340 MB). |
| `ffprobe` errors about streams | only the stand-in is installed: it knows duration. Install real ffmpeg (`brew/apt/winget install ffmpeg`). |
| yt-dlp: "Sign in to confirm you're not a bot" | the site blocks this machine. Download the video yourself and pass the file to `tools/reference/ingest.mjs`, or pass `--cookies cookies.txt` exported from your browser. The toolkit does not try to evade the block. |
| Playwright capture says the expected text is missing | the page changed, needs a login, or blocked the browser. The capture is recorded as failed; give the agent a file, or another source. A redraw is labelled as a recreation, never as a screenshot. |
| `agent-reach` not found | optional. Research then uses the agent's own web search; record every URL in `research/sources.json`. |
| python `libatomic.so.1` missing (Playwright for Python) | not needed: the toolkit uses `playwright-core` with Remotion's Chrome. |
| `could not write ~/.claude/skills` | read-only home: run `node scripts/install.mjs --into <project>` or point the agent at `AGENTS.md`. |
| "BLOCKED: gate not approved" | working as designed: show the user the stage and get their answer (`tools/state.mjs request`, then `approve --quote`). A file edited after approval needs a new approval. |
| vision critic says "NOT run" | your model cannot view images. Open `review/*.jpg` yourself; automatic critics still ran. |
| Windows: `bash scripts/e2e.sh` | run it in WSL or Git Bash; the other tools are Node and work in PowerShell. |
| `npm install` fails in `remotion-template` | check Node 18+, free disk, network; delete `remotion-template/node_modules` and run the installer again. |
