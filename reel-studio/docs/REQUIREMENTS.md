# Requirements and setup (what to download, how big, what each part unlocks)

## Minimum (2D cards, Stage3D, narration, critics): `bash install.sh` (Windows: `.\install.ps1`)
| need | version | size | notes |
|---|---|---|---|
| Node.js | 18+ (22 LTS recommended) | | the installer stops with a clear message if it is missing |
| Python | 3.10 to 3.13 (3.10 to 3.12 safest) | | a `.venv` is created; Windows prefers 3.10 to 3.13 |
| disk | about 3 GB | Remotion packages 600 MB, Chrome headless shell 150 MB, Kokoro voice 340 MB, Python packages 1 GB | |
| RAM | 8 GB (16 GB for 3D at 1080p) | | |
| CPU | 4+ cores (8 recommended); a GPU is optional | | no GPU: software WebGL (`swangle`), slower 3D |
| FFmpeg | installed for you (`static-ffmpeg`) if missing | | |
| internet | for the one-time downloads, real captures, Poly Haven, Noto emoji | | renders themselves are offline |
`node tools/doctor.mjs` lists anything missing with the exact fix; `node tools/selftest.mjs` must print "All ... checks passed".

## Optional add-ons (flags of the installer)
| flag | unlocks | download | check |
|---|---|---|---|
| `--with-photoreal` | Blender Cycles plates, depth parallax, sequences | about 400 MB (`bpy`) + 20 MB system libs on Linux without root | `node tools/photoreal.mjs doctor` |
| `--with-voice2` | Chatterbox: emotion control and voice cloning | about 2.5 GB (CPU torch 200 MB, model 2 GB) | `node tools/selftest_voice.mjs --full` |
| `--with-agent-reach` | research without keys | small | `node tools/doctor.mjs` |
| earshot (manual) | AI listening report | about 1.1 GB | `node tools/audio/earshot.mjs` |
| inkbeat | 3D toon engine | `cd renderers/inkbeat && npm install` (about 300 MB) | `node tools/ink/looks.mjs <dir>` |

## Environment
`.env` (copy `.env.example`): `REMOTION_GL` (auto), `CHROME_PATH` (a system Chrome for captures), `REEL_HOME` (a writable folder for models; default `~/.reel-studio`), `REEL_PY`. A read-only home: set `REEL_HOME`.

## What runs where
| OS | status |
|---|---|
| Ubuntu / Debian / Amazon Linux | developed and tested here (this pass: Amazon Linux 2023, 8 cores, no GPU) |
| macOS | clean-room CI passes (previous pass); this pass's new tools were not run there |
| Windows | clean-room CI passes (previous pass); this pass's new tools were not run there. Use a project folder without spaces |
Run `.github/workflows/clean-install.yml` in your repository to verify on all three.

## Agents
Any agent with a shell and file access works (Claude Code, Kiro, Cursor, Codex, OpenCode, Cline, Aider). It reads `AGENTS.md`, then `RUNBOOK.md`, and loops on `node tools/next.mjs <project>`. A model that cannot see images runs the vision critics as "unavailable" and the report says those checks were not done.
