# Quickstart (5 minutes)

1. `node scripts/install.mjs` (installs this toolkit's skills and the official Remotion skills `remotion-dev/skills`).
2. `node tools/doctor.mjs` and run the fix commands it prints (Python voice tools, ffmpeg, Chrome).
3. Edit `creator/creator-profile.json` (niche, audience, tone, things to avoid).
4. Open your agent in an empty folder and say:
   > Use the reel-studio skill. Make a 40 second Instagram reel about <topic>. Ask me before each step.
5. The agent will ask for: style, topic, then show research, script, storyboard frames and a voice sample. Say "approve" or tell it what to change.
6. The final video is in `reel-projects/<name>/renders/`.

Free models (OpenCode + a free model): same steps. If the model cannot look at images, it will say so, and you look at `review/*.jpg` yourself.
