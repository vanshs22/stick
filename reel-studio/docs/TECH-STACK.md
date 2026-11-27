# Tech stack: what each tool is for (and when NOT to use it)

Everything is code. Writing the code well and fast is the product: the faster the toolchain renders and the earlier a critic catches a problem, the fewer rounds a film needs.

| Tool | Use it for | Do not use it for | Where |
|---|---|---|---|
| **Remotion** (React, one timeline) | every film: composition, timing, captions, cards, overlays, transitions, the final render. ONE clock; everything else is seeked by its frame | physics-heavy 3D, path tracing | `remotion-template/`, `tools/build_video.mjs` |
| **Remotion official skills** (`remotion-dev/skills`, `tools/rs.mjs <topic>`) | the rules for Remotion code: timing, sequencing, effects, transitions, captions, audio, 3D, maps, rendering. They win over our rules where they differ | | `scripts/install_remotion_skills.mjs` |
| **three.js / React Three Fiber** (`@remotion/three`) | real-time 3D worlds and characters (Stage3D): fast iteration, stylised looks, toon, voxel | photoreal (it is a rasteriser) | `remotion-template/src/three/` |
| **Blender Cycles** (`bpy`, `.venv-blender`) | photoreal PLATES: HDRI light, PBR, real lens, depth of field; depth maps for parallax; sequences for big moves | people, real-time previews of animation | `renderers/blender/`, `tools/photoreal.mjs` |
| **Poly Haven (CC0)** | HDRIs, PBR textures, models for Blender | anything needing people | `tools/assets/polyhaven.mjs` |
| **inkbeat engine** (R3F toon, `renderers/inkbeat`) | beat-driven 3D toon shorts, cutaways, kid-song, anime and pixar-soft looks | quick 2D explainers | `docs/INKBEAT.md`, `tools/ink/` |
| **GSAP / HyperFrames blocks** | small timeline-heavy pieces (flow diagrams, lower thirds) inside a shot, seeked by the Remotion frame | a second clock | `FlowDiagram`, `HtmlBlock` |
| **remocn** (350+ components) | animations, backgrounds, app-screen simulations we lack | what we already have | `tools/remocn.mjs` |
| **rough-notation** (`@remotion/rough-notation`) | hand-drawn circles, underlines, highlights | | overlays `scribble` |
| **Playwright** (`playwright-core`) | REAL evidence: screenshots with provenance and `--expect`; frame-stepped B-roll with cursor and zoom | drawing a "fake" page | `tools/capture/capture_web.mjs`, `record_broll.mjs` |
| **yt-dlp** | reference videos for analysis; trend metadata | publishing, redistributing | `tools/reference/ingest.mjs`, `library.mjs trend` |
| **OpenCV + NumPy/SciPy** | reference analysis: cuts, optical flow, overlay plates, palette, face framing | | `tools/reference/*.py` |
| **faster-whisper** | exact word timing (captions, anchors, sound events) | | `tools/audio/words.py` |
| **Kokoro-82M** (onnx, CPU) | fast, accurate narration | acting | `tools/audio/voice.py` |
| **Chatterbox** (MIT, `.venv-voice`) | expressive emotion, voice cloning | speed on CPU | `voice_chatterbox.py` |
| **FFmpeg** | encode, loudness, contact sheets, upscale, mux | | everywhere |
| **earshot** (optional) | AI listening report on the mix | | `tools/audio/earshot.mjs` |
| **Agent-Reach** (optional) | research without keys | | `tools/research/` |
| **Pillow** | contact sheets, thumbnails | | tools |
| **Noto Emoji (Google, Apache-2.0)** | caption emoji pictures | | `tools/emoji.mjs` |

## Choosing the engine for a shot (decision list)
1. Words on a card, a number, a diagram, a UI, a real page: **Remotion cards** (cheapest, crispest).
2. A real website in motion: **Playwright B-roll** (`Footage`).
3. A stylised character or a world, fast iteration: **Stage3D** (three.js).
4. A beat-cut toon short or a song: **inkbeat**.
5. A real-looking object, room, product, glass, light: **Blender plate** (`PlateShot`); a big camera move: **Blender sequence**.
6. People that must look real: none of the above. Use real footage you own, or say so and pick a stylised character.
A film may mix engines shot by shot inside ONE timeline (the pack decides the default), as long as it looks like one design.

## Speed rules (render as fast as possible, at the highest quality)
- Iterate at `--scale 0.5` and low samples; render the master once. Per-shot cache: only changed shots re-render. All CPU cores minus two. Stills of every shot before any long render.
- GPU: set nothing; `REMOTION_GL` is chosen automatically (`swangle` on a headless Linux box, `angle` with a GPU), Cycles picks CUDA/OPTIX/HIP/METAL when present.
- Photoreal cost is per SHOT (about 1 minute on CPU), not per second: use parallax plates, not sequences, unless the move needs real 3D.
- Fix the cheap thing first: the layout lab (`tools/layout_lab.mjs`) measures every card in both frame shapes in a minute; a critic finding costs seconds, a re-render costs minutes.
