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


## Style contact sheets (same script in every style)
One folder per style: `output/<style-id>/` with `overview.jpg` (all 11 frames), `storyboard-1.jpg` and `storyboard-2.jpg` (approval sheets), `frames/`, `storyboard.json`, `critics.txt`. Review notes and fixes: `STYLE_REVIEW.md`.
Styles: editorial-notebook, editorial-sticker, noir-3d, original-creatures, paper-atlas, roblox-inspired, stickman-3d, stylized-3d-presenter, voxel-explainer, voxel-studio (legacy).
