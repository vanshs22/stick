# Setup: install, check, make your first video

Reel Studio is a folder of tools and skills that an AI coding agent (Claude Code, OpenCode, Cursor, Codex, Kiro, Cline...) uses to make short videos. No paid API, no server. The agent does the thinking; the toolkit renders.

## 1. Install (Linux, macOS, WSL)
You need Node 18+ (22 recommended), Python 3.9+, and about 2 GB of disk (600 MB packages + 340 MB voice model + Chrome).
```
cd reel-studio
bash install.sh                  # everything, then self-tests and a small real render
bash install.sh --skip-models    # without the 340 MB voice model (no narration until you add it)
bash install.sh --with-agent-reach   # also the optional keyless web research tool
```
Windows: `.\install.ps1` (same options). **Windows and macOS are not tested yet**; Linux is. If it fails, run `node tools/doctor.mjs` and follow the fix it prints.

No GPU? Set `REMOTION_GL=swangle` in `.env`. It works but is slow: a 5 s 3D shot at 1080x1920 takes about 8 minutes; 2D films build in about 1.5 minutes.

## 2. Check that it works
```
node tools/doctor.mjs            # what is installed; REQUIRED vs recommended vs optional; which features are unavailable and why
node tools/selftest.mjs          # fast checks (about a minute)
node tools/selftest.mjs --full   # + voice, web capture, HTML/GSAP/HyperFrames/remocn adapters, references, audio chain, a 3D still
node tools/smoke_render.mjs      # a small real render from scratch
```
The installer writes `install-report.md` with the result of all of this.

## 3. Give the toolkit to your agent
```
node scripts/install.mjs         # links the skills into ~/.claude/skills, ~/.config/opencode/skills, ~/.agents/skills (never overwrites your own skills)
```
Or just tell the agent: "read reel-studio/AGENTS.md" (it points to `RUNBOOK.md`, one page).

## 4. Make a video
```
node tools/new_project.mjs my-video          # creates ./reel-projects/my-video
node tools/next.mjs ./reel-projects/my-video # prints the ONE next step; repeat until done
```
The agent loops on `next.mjs`. At every approval gate it stops and asks you; you answer in your own words and it records them (`state.mjs approve --quote`). Gates: intake, style, topic, research, script, visual concept, storyboard (frame by frame), assets, audio, typography, captions, production readiness, final. Editing an approved file invalidates the approval. An agent cannot approve for you.

Build and check:
```
node tools/build_video.mjs <project> --scale 0.5   # half-size preview, voice + captions + sound + render + QA
node tools/build_video.mjs <project>               # full 1080x1920 delivery render
node tools/critique.mjs <project> all              # critics (script, storyboard, visual intent, audio, frames, video)
node tools/audio/ears.py <project>                 # free listening report + a one-minute checklist of clips for YOUR ears
```
Delivery limits (length, size, loudness) come from `brief.delivery` or the platform preset, not fixed numbers. Audio is required unless `audio-plan.json` says `"mode": "silent"`; a missing mix fails the build.

## 5. Two modes for the agent
- **Production mode** (make a video): do not edit `tools/`, `remotion-template/`, `style-packs/`.
- **Toolkit development mode** (improve the toolkit): the agent may edit them, must add tests and run `node tools/selftest.mjs`. Details at the top of `RUNBOOK.md`.

## 6. Examples and finished films
`examples/` has 20 ready projects. Run one end to end as a TEST project (no approvals, receipts say TEST):
```
node tools/acceptance.mjs accept-motion-explainer --work ./work --stage all
```
Finished 1080x1920 films with real voice and QA are in `output/acceptance/`. Read `docs/STATUS.md` for what is tested, what is not, and what is left.

## 7. Optional extras
- Listening tools: `tools/audio/ears.py` is built in. `tools/audio/earshot.mjs` wraps the open-source earshot analyser (needs its own install and about 1.1 GB of models); it has been run once and is not part of the default install.
- Research without Agent-Reach: `tools/research/import_sources.mjs` records URLs, pasted text, files and your competitor CSV with provenance.
- HyperFrames blocks: `node tools/hyperframes.mjs search <words>` and `add <block> --project <P>`. remocn components: `node tools/remocn.mjs search "<need>"`.

## 8. Known limits (honest list)
- No GPU: renders are slow. The 3D acceptance films (Roblox, voxel, mixed) are authored and checked as stills but not yet rendered at full size.
- Voice and music taste cannot be judged by an AI; use the listening checklist.
- Windows and macOS installs are untested (`ci/clean-install.yml` is ready to run on GitHub Actions).
- Characters are procedural rigs, not modelled assets.
