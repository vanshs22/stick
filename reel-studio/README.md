# Reel Studio: a portable AI video-production toolkit

Give this folder to an AI coding agent (Claude Code, OpenCode with a free model, Cursor, Kiro...). Say "make a reel about X".
The agent follows `SKILL.md`: it researches, writes, storyboards, builds the scenes in Remotion and three.js, records the voice, mixes the sound,
checks its own frames and audio with critics, and stops at each gate for your approval.

## Install
```
node scripts/install.mjs            # links the skills into ~/.claude/skills, ~/.config/opencode/skills and ~/.agents/skills
npx skills add remotion-dev/skills  # the official Remotion agent skills
node tools/doctor.mjs               # tells you what else to install
```
Then open any folder in your agent and ask: "Use reel-studio to make a 40 s reel about ...".

## What is in here
| folder | what |
|---|---|
| `SKILL.md` | the entry skill: stages, gates, rules |
| `skills/` | 15 focused skills the agent loads when it reaches that stage |
| `tools/` | scripts the agent runs: state, validate, timing, voice, sound, capture, reference analysis, QA |
| `schemas/` | the JSON contracts between stages (`python3 scripts/make_schemas.py` regenerates them) |
| `remotion-template/` | the Remotion project every video starts from |
| `style-packs/` | 8 style packs: rules, tokens, components, defaults |
| `examples/` | 4 small test videos (brief, script, storyboard, audio plan) |
| `reference-library/` | shot analyses of the 8 supplied reference videos |
| `creator/` | your creator profile (niche, audience, tone, what to avoid) |
| `memory/` | lessons the agent appends after every video |
| `docs/` | roadmap, critics, project files |

Status: see `docs/ROADMAP.md`.

## Test everything (after install)
```
node tools/run_example.mjs software-explainer test1
bash scripts/e2e.sh reel-projects/test1 --no-voice --scale 0.5   # quick: estimated timing, half size
bash scripts/e2e.sh reel-projects/test1                          # full: Kokoro voice + Whisper timing
```
Examples: software-explainer, character-story, motion-graphics, voxel-howto.
