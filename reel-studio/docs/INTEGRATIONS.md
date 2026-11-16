# Integrations: what each one does and where it stops

| piece | role | how it is wired | limit |
|---|---|---|---|
| Remotion | the one deterministic timeline and renderer | `remotion-template/`, official `remotion-dev/skills` installed and readable with `tools/rs.mjs` | needs Chrome; slow without a GPU |
| Three.js | 3D shots (`Stage3D`): SDF clay characters, voxel, blocky, stick and critter rigs, worlds, DOF/bloom/ACES, soft shadows | `remotion-template/src/three/`, camera solved by `cinema.js` (shared with the Node critic) | software GL is slow; `Scene3D` is legacy |
| GSAP | precise sequenced motion for diagrams | `FlowDiagram` component; timelines are seeked by the Remotion frame | no own clock |
| HyperFrames | selected HTML/GSAP blocks (lower thirds etc.) | `HtmlBlock` component loads a block in an iframe, a paused `window.__timelines` timeline is seeked per frame; shots list `blocks` | HyperFrames' own renderer/timeline is not used. About 450 registry blocks exist (`npx hyperframes add <block>`); only the adapter and one sample block (`public/hyperframes/lower-third.html`) are built and tested. |
| remocn | 900+ ready-made Remotion components (text, transitions, backgrounds, captions, app-screen simulations), on demand | `tools/remocn.mjs` fetches the live index and copies a component's source into the project; the `RemocnBlock` shot component runs it on our timeline | MIT, independent project; needs network to add; 16:9 sizing needs `scale`/font checks in portrait; simulations are illustrations, not evidence; some components need extra npm packages (`--install-deps`) |
| Playwright | real website evidence with provenance | `tools/capture/capture_web.mjs` using `playwright-core` + Remotion's Chrome | login walls, bot blocks: recorded as failures |
| Agent-Reach | optional research channels (web, GitHub, YouTube search) without keys | `tools/research/search.mjs`, per project `brief.research.agent_reach` yes/no/ask | install from GitHub (the PyPI name is another project); never required |
| yt-dlp | fetch a reference video | `tools/reference/ingest.mjs` | YouTube blocks many server IPs; a local file always works |
| OpenCV + FFmpeg | measure references and renders | `tools/reference/analyze.py`, `tools/critics/render_analysis.mjs` | face detection is unavailable in OpenCV 5 headless (returns null, reported) |
| Kokoro, faster-whisper | free local voice and word timing | `tools/audio/voice.py`, `words.py` | Kokoro voices are good, not human; check pronunciation with the voice critic |
