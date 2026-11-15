# Reel Studio outputs (1080x1920, 30 fps, real Kokoro voice, Whisper word timing, -14 LUFS)

| file | style pack | length |
|---|---|---|
| voxel-explainer.mp4 | voxel-explainer (neon voxel night) | ~19 s |
| claude-3d-person.mp4 | stylized-3d-presenter (warm desk at night) | ~19 s |
| claude-minions-explainer.mp4 | original-creatures (teal studio, orange/yellow minions) | ~16 s |
| roblox-story.mp4 | roblox-inspired (block world, growing tower, storm) | ~13 s |
| stickman-3d.mp4 | stickman-3d (ink stickman with scarf on paper) | ~12 s |

`*-contact-sheet.jpg` = one frame every 0.5 s. Rebuild: `reel-studio/examples/<name>` + `tools/run_example.mjs`, `scripts/e2e.sh`.
No GPU here, so run with `REMOTION_GL=swangle`. Music and effect sounds are procedural (not auditioned by me).
