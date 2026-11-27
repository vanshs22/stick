# Reel Studio

A toolkit that lets an AI coding agent (Claude Code, OpenCode with a free model, Cursor, Kiro, Codex) produce a finished short vertical video from a topic. The agent is the director and critic. The toolkit supplies the skills, the Remotion/three.js scene library, the tools and the critics. You approve the important steps.

Everything is code and free: Remotion renders, three.js draws 3D, GSAP and HyperFrames blocks animate inside the Remotion timeline, Playwright captures real websites, Kokoro speaks, Whisper times the words, FFmpeg encodes. No AI image or video generation and no paid keys.

Open `START-HERE.md` first (the flow and the ten rules that decide quality).

```
bash install.sh          # Windows: .\install.ps1
node tools/selftest.mjs  # must end with "All ... checks passed"
```
Then open your agent in an empty folder and say: *"Use reel-studio. Make a 40 second reel about <topic>."* Details: [QUICKSTART.md](QUICKSTART.md), [INSTALLATION.md](INSTALLATION.md), [TROUBLESHOOTING.md](TROUBLESHOOTING.md).

## How a video is made
Intake, style, topic, research, script, script critic, storyboard, audio, typography, captions, production, final. Each step is an approval gate; the storyboard is approved frame by frame. Between steps, critics inspect the real output (script, research sources, storyboard, rendered frames, audio, captions, the whole video) and name the shot to fix, so one shot is re-rendered instead of the film. See [docs/WORKFLOW.md](docs/WORKFLOW.md).

## Styles
Eleven style packs with real preview stills (`node tools/gallery.mjs <project> --kind styles`): Claude minions (a duo of original glossy cube mascots on a neon stage), Voxel explainer, 3D stickman, Roblox-inspired, stylized 3D presenter, original creatures (the Pips), Noir 3D, Editorial notebook, Editorial sticker, Paper atlas and Voxel studio, plus Claude minions (a duo of original glossy cube mascots on a neon stage). You can compare two, combine a world with a character (`tools/combine_styles.mjs`), or give a reference and get a new pack (`tools/new_style_from_reference.mjs`). The choice is stored in the brief and drives the engine.

## Folders
| folder | what |
|---|---|
| `SKILL.md`, `AGENTS.md`, `CLAUDE.md` | entry points for agents |
| `skills/` | 18 skills the agent loads when it reaches that stage |
| `tools/` | state and approvals, galleries, storyboard review, audio, capture, research, reference analysis, critics, per-shot render, QA |
| `remotion-template/` | the Remotion project every video starts from (Stage3D, 2D cards, captions, GSAP/HyperFrames adapters) |
| `style-packs/` | styles: rules, tokens, characters, worlds, camera language, previews |
| `schemas/` | JSON contracts between stages |
| `examples/` | six same-script style experiments plus older examples (see `examples/README.md`) |
| `characters/` `renderers/blender/` | six locked characters with emotions; the photoreal (Blender Cycles) engine |
| `docs/` | **STYLE-GUIDE** (use, make, add a style), **LONGFORM-LANDSCAPE** (16:9 + YouTube), audit, cinematography, experiment, critics, workflow, integrations, reuse |
| `memory/learnings.md` | lessons the agent reads first and appends to |
| `creator/` | your profile (niche, audience, tone) and optional analytics |

## Limits you should know
- No GPU: renders work but slowly (software GL, about 14 minutes for 12 seconds at full size on a 4-core server). A desktop GPU is much faster.
- The agent cannot hear. Voice and music checks are measurements; taste needs your ears. Vision critics run only if your model can view images, and say so when it cannot.
- Some sites (YouTube from servers) block downloads; the tool explains and asks for a file.
- `install.sh` (Linux, macOS) and `install.ps1` (Windows) are all tested by CI (clean-room install, self-tests, a real render): see docs/STATUS.md.
