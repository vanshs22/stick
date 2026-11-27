# Quickstart (5 minutes plus downloads)

1. `bash install.sh` (Windows: `.\install.ps1`). First run downloads about 1.5 GB (Python packages, Remotion, Chrome, the Kokoro voice). Add `--skip-models` to postpone the voice.
2. `node tools/selftest.mjs`. Fix anything it reports (`node tools/doctor.mjs` prints the command).
3. Edit `creator/creator-profile.json` (niche, audience, tone, things to avoid).
4. Open your agent in an empty folder and say:
   > Use the reel-studio skill. Make a 40 second reel about <topic>. Ask me before each step.
5. You will be asked, one at a time: goal and platform, style (a numbered sheet of real previews), topic, research, script, storyboard (every frame), voice/music/sound samples, typography, captions, then the final cut. Answer "yes", a number, or what to change.
6. The finished video is in `reel-projects/<name>/renders/<name>.mp4` with a contact sheet in `review/` and an approval receipt.

Test without a topic: `node tools/run_example.mjs experiment-stick demo` then follow `scripts/e2e.sh`.
Free models (OpenCode + a free model) work the same; if the model cannot view images it says so and you look at `review/*.jpg` yourself.
