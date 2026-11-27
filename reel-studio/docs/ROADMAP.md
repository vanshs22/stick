# Status

| phase | what | state |
|---|---|---|
| 1 | audit, cinematography solver and critic, auto-camera removed, six-style experiment, rebuilt voxel and Pips | done, rendered and critiqued (`docs/EXPERIMENT.md`) |
| 2 | approval workflow v2, galleries, previews for 10 packs, choose/combine, storyboard review/alts/edit, audio previews, reference analysis | done, each tool run on real input |
| 3 | Stage3D film look, GSAP FlowDiagram, HyperFrames adapter, Playwright capture with provenance, Agent-Reach, yt-dlp, official Remotion skills | done; HyperFrames: one sample block only |
| 4 | critics (automatic and vision protocol), fix plan, per-shot render and assemble, optional analytics | done, run on real renders and bad fixtures |
| 5 | installers, doctor, selftest, docs, skills | done on Linux; Windows script not run on Windows |
| acceptance | a full project through the IDE conversation | storyboard contact sheet first, then the user's approval, then audio to final |

Known gaps: no GPU (slow renders); the agent cannot hear; face detection unavailable in OpenCV 5 headless; layout gallery never reviewed by a human; legacy `Scene3D` examples kept as regression tests; `custom` combined packs are generated on demand (none ships).

## Latest changes
- Minion depth: volume shading, rim shell, contact shadows, mirror floor, spot-light shadows.
- 2D timing: unanchored entrances start within 0.06 s, exits take at most 0.12 s, the first shot is never blank at frame 0, the host fades in once instead of per shot.
- Headline captions switch to light ink on dark `bg`; `check_storyboard` warns when bare-ink text components sit on a dark bg.
- `package_post` picks the cover when a caption chunk is fully spoken and takes `--tags`.
- `next.mjs` names threejs-production only for 3D packs; frames critic advice is split for 2D and 3D.

## Not verified
- Voice and music taste (the agent cannot hear audio), the Windows `install.ps1`, GPU render speed.
