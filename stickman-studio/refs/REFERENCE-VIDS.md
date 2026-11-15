# Reference videos (`reference vids/` folder) — what each one is

Measured locally (OpenCV + faster-whisper + numpy, zero AI credits). Numbers are in `refN.measure.json` / `refN.audio.json`,
frames in `refN.sheet.jpg`. Files are numbered in alphabetical order of the upload names.

| ref | length | words/min | cuts/10 s | look | family |
|---|---|---|---|---|---|
| ref1 | 57 s | 122 | 4.4 | low-poly night office, woman in yellow jacket + 3 AI-agent creatures, heavy depth-of-field, 2-line dark caption pill at top | **A. lowpoly-story** |
| ref4 | 48 s | 164 | 5.2 | low-poly night desk, orange "Clawd" crabs, speaker tags YOU / CLAUDE above caption, UI cards (terminal, receipts), glowing "BUILD" word, gradient end card | **A. lowpoly-story** |
| ref2 | 53 s | 189 | 2.1 | light-grey stage with a stock-ticker wall, voxel characters in hats, title bar at top, boxed bottom caption with green word highlight, floating label chips | **B. voxel-explainer** |
| ref7 | 43 s | 173 | 1.6 | deep-blue starfield, Minecraft-style man + orange box creature, "STEP n · …" chip with progress dashes, UI cards, white/yellow bottom captions, stamped "ANIMATOR ✗" | **B. voxel-explainer** |
| ref8 | 29 s | 167 | 16.0 | Roblox-style blocky world (towers, clouds, shacks), one yellow word at a time in the middle, constant camera tilts, narrator + music | **C. roblox-story** |
| ref5 | 38 s | 186 | 7.6 | off-white paper (#F6F3EF), illustrated bearded presenter bottom-right, tiny mono label top, big sans line with red italic serif keyword, phone/terminal/chart cards, numerals | **D. editorial-presenter** |
| ref6 | 48 s | 255 | 5.8 | same editorial system, background colour changes per beat (black / paper / grey-blue / green / red), hoodie avatar + robot-head laptop mascot, counters top-right | **D. editorial-presenter** |
| ref3 | 53 s | 246 | 4.7 | selfie face-cam on beige; screen-recording cards with coloured glow border pop in above the face; italic serif keyword pop over face; "comment DOCS" CTA | **E. facecam-overlay** |

Shared audio facts (all 8): loudness -14.1 to -15.0 LUFS; music sits 2 to 12 dB under the voice; speech 122 to 255 words/min.
The SFX burst detector found 0 to 1 bursts per 10 s, so I do not trust it. Whoosh/pop timing has to be judged by ear on the originals.

## Families and what each needs

| family | needs a renderer that does not exist yet? | reuse | cost on 2 vCPU |
|---|---|---|---|
| D. editorial-presenter | yes, but 2D only: paper background, avatar, cards, mono labels, serif keyword, per-beat colour | existing 2D canvas, captions, finish/QA, mix | cheap (seconds per frame) |
| E. facecam-overlay | small: composite cards + captions over the user's own video | captions, words.py, mix | cheap (ffmpeg + canvas) |
| A. lowpoly-story | yes: flat-shaded low-poly character, creatures, desk/night set, top caption pill | three.js engine, DOF, camera; MIT base `stochosfrance/lowpoly-reel` | like current 3D |
| B. voxel-explainer | yes: voxel character + creature, stage sets, UI chips | three.js engine | like current 3D |
| C. roblox-story | yes: blocky character, tower/shack/island sets, fast camera moves | three.js engine | like current 3D |

Open-source bases (both MIT, cloned to `/projects/sandbox/vendor-refs`, not copied into this repo yet):
- `JohnHeibel/ClaudeAnimationBase`: p5.js + p5.brush, the "Clawd" character with 31 emotions, hand-painted look (this is the "claude animation base").
- `stochosfrance/lowpoly-reel`: Three.js low-poly desk-at-night scene with the orange block creature, rain, hologram panel, sound design script.
