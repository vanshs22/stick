# Installation

## Needs
| item | why | if missing |
|---|---|---|
| Node 18+ (22 LTS recommended) | everything | the installer stops and says where to get it |
| Python 3.9+ | voice, timing, critics, reference analysis | install from python.org (Windows: tick "Add to PATH") |
| 4 GB free disk (5 GB with the voice) | `.venv` 1 GB, Remotion packages 0.7 GB, Chrome, voice 0.35 GB | |
| ffmpeg + ffprobe | encode, measure | optional: the installer uses a bundled ffmpeg and a small ffprobe stand-in (duration only) in `.bin/` |
| Chrome | render, screenshots | fetched by Remotion (`remotion browser ensure`) |

## Run
```
bash install.sh [--skip-models] [--minimal] [--no-venv] [--into <project>]     # macOS, Linux, WSL
.\install.ps1   [--skip-models] [--minimal] [--no-venv] [--into <project>]     # Windows
```
Both call `scripts/setup.mjs`, which: creates `.venv` and installs `requirements.txt`; sets up ffmpeg; runs `npm install` in the toolkit and in `remotion-template` (shared by every project); fetches Chrome; downloads the Kokoro voice; links the skills into your agent's folders and installs the official `remotion-dev/skills`; creates `.env` from `.env.example`; prints the doctor report. It is safe to run again. `--minimal` skips Whisper, OpenCV and yt-dlp.

Optional research tool (works without keys): `pip install git+https://github.com/Panniantong/Agent-Reach` (the PyPI package of the same name is a different project).

## Which agent
| agent | how it finds the toolkit |
|---|---|
| Claude Code | skills are linked into `~/.claude/skills`; `CLAUDE.md` in this folder also works |
| OpenCode | skills in `~/.config/opencode/skills`; reads `AGENTS.md` |
| Cursor, Codex, Kiro, others | open this folder or tell the agent: "read AGENTS.md and SKILL.md in <path>" (`.agents/skills` is also linked) |

`node scripts/install.mjs --into <project>` installs the skills into one project only. `--copy` copies instead of linking (Windows does this automatically).

## No GPU
Set `REMOTION_GL=swangle` in `.env` on Linux servers and containers. Lower `REMOTION_CONCURRENCY` on small machines. Render a half-size preview first (`--scale 0.5`).
