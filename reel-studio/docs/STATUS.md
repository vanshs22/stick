# Status: what is implemented, tested, and still open

Written at the end of the production-readiness pass. "Tested" means a command was run and its output read. Nothing here is claimed from files alone.

## Done and tested (self-tests pass: `node tools/selftest.mjs`, 11 fast checks; `--full` adds voice, capture, adapters, references, audio, a 3D still)
- **Approval integrity.** New stages visual_concept, assets, production (real gates) and editorial_critic. Final approval fingerprints the MP4, its QA report, the contact sheet, captions and the report. `seal` refuses a video whose bytes changed, and the receipt carries the video sha256. Frame approvals store the still's hash and the shot's hash, so an edit invalidates them. 57 end-to-end checks in `tools/selftest_pipeline.mjs`; mutation-checked (breaking the code makes them fail).
- **Delivery profile.** No fixed 15-60 s or 50 MB. Limits come from `brief.delivery` or the platform preset; a null limit is not checked. Final QA also checks decode errors, resolution, aspect, fps, audio presence, loudness, true peak, black/frozen frames, timeline gaps, caption timing and safe zone.
- **Audio gate.** `audio-plan.mode` (narrated, narrated_music, music_only, silent, custom). A missing mix or narration FAILS the build; `silent` is explicit; `--estimate` builds are marked PREVIEW and can never be sealed.
- **Audio chain (real Kokoro and faster-whisper):** alignment, event-tied cues (a cue with no event is refused), a mix report (music under voice, headroom). Found and fixed: the mix peaked +2 dB over full scale and was being soft-clipped.
- **Voice critic** no longer calls "800" vs "eight hundred" a mispronunciation.
- **Playwright capture** tested on a local page (13 checks): click, type, scroll, wait, highlight, recording, provenance, honest failures. Found and fixed: an actions file with no screenshot "succeeded"; recording needs Playwright's ffmpeg, now installed by setup.
- **HyperFrames + remocn adapters** tested through the real renderer: same frame twice is byte-identical, animation advances, variables arrive, a real registry block (bar-chart-race) and a real remocn component render. Adapter gained `fit`, `vars` via `window.__hfVariables` and `replace`.
- **Reference ingestion** tested on known material: MP4, MOV, image, website, GitHub repo. YouTube was blocked by a bot check in this environment (reported, not faked).
- **Installer:** capabilities report, verification step (self-tests + small real render), `install-report.md`, optional Agent-Reach flag, never overwrites a user's own skills, exits non-zero on gaps. Clean-room test of a fresh extract passed earlier in this work (install, doctor, 12/12 self-tests, a small build).
- **Runbook modes:** production mode vs toolkit development mode, consistent in RUNBOOK, SKILL, AGENTS, CLAUDE.
- **Visual quality fixes:** Roblox studded baseplate (a real bug: the stud texture never applied), game props, name tag; voxel: legs detached from the thighs, face and nose; presenter: shirt hem and hands; stickman: pelvis; cinematography critic now rejects cut-off heads by default; minion depth/shadows/reflections.
- **Semantic visual director:** every line needs an approach and a stated reason; a card that only repeats the narration is a major finding.

## Full-resolution (1080x1920) films rendered, with real voice
- `accept-software-demo` (real Playwright captures, QA pass) and `accept-motion-explainer` (real HyperFrames block, QA pass), in `output/acceptance/`. Both are TEST projects: no user approved them and the receipts say so.
- Software GL only: a 4.7 s 3D shot takes about 8.5 minutes.

## NOT done / NOT verified (be strict about these)
1. **Full-resolution renders of the 3D acceptance films are not finished:** `accept-roblox-explainer`, `accept-voxel-explainer`, `accept-mixed`, and the controlled trio (Roblox, stickman, presenter on one script). Stills were checked; the storyboards are fixed (framing, continuity). Run: `node tools/acceptance.mjs <example> --work <dir> --stage build` (resumable; about 25 min per 14 s film), then `--stage review` and `--stage collect`.
2. **Per-style animated previews and a sample render for every style** are not produced (only stills exist for most packs).
3. **The research critic fails on the acceptance examples** because they ship no `research.json`; add research with sources or mark lines as opinion.
4. **Windows `install.ps1` and macOS are untested.** `ci/clean-install.yml` (Linux/macOS/Windows) is written but has never run; copy it to `.github/workflows/`.
5. **Voice and music taste, and any listening judgement,** cannot be done by an AI agent here: a human must listen.
6. **The agent's vision review** of the final films is partial: the contact sheets of the two finished films were looked at; the 3D films were not yet.
7. Per-style character quality still has known gaps: presenter hair is a helmet in extreme close-up; voxel eyes are large; no real skeletal-animation models (all characters are procedural, with real articulated rigs but not modelled assets).
8. Sub-agent re-test with a cheap model on the new gates (visual_concept, assets, production) has not been run.

## Listening (added after the status above)
- `tools/audio/ears.py <project>` (free, built in, tested on both finished films): measured listening transcript (`review/ears/timeline.md`), a picture (`sheet.png`), flags (late first word, dead air, level jumps, cues masked, music too close to the voice, hot mix) and `listen/` with short clips plus a one-minute CHECKLIST for the moments only a person can judge. It does not judge taste.
- `tools/audio/earshot.mjs <project>` wraps https://github.com/Leonxlnx/earshot (describe, timeline, critique against professional films). **Not run**: the build sandbox could not reach that repository, and it needs `uv` and about 1.1 GB of models. Install on your machine: `uv tool install "earshot[mcp] @ git+https://github.com/Leonxlnx/earshot" && earshot doctor --fetch`. Command syntax follows its README and may need adjusting on first run.

## Earshot, tested (0.4.1, from the zip you added)
- Runs on CPU in this sandbox: venv + CPU torch + `earshot doctor --fetch` (both models, 1.1 GB, about 10 s). `earshot describe`, `timeline` and `critique` ran on a real film's narration, mix and MP4.
- It CAN hear what a model cannot: it identified the narration as a speech synthesizer, measured music presence per 5 s window, sync of effects to cuts, loudness arc, salient-hit density and stereo width, and scores them against 7 professional launch films.
- It found a real defect my own checks missed: the music sat 29 dB under the voice, so it was present in only 25 percent of the film ("critical"). Fixed in `mix.py` (now about 19 dB under) and the audio critic now rejects music that is inaudible as well as music that is too loud. Earshot's verdict on the same film: "needs work, 1 critical" became "close, 0 critical".
- Still open from its report: the procedural music is nearly mono and has no sub-bass; effect density is high; no moment stands out in loudness.
- Setup used: `uv venv` + `uv pip install torch --index-url https://download.pytorch.org/whl/cpu` + `uv pip install -e ".[mcp]"` in the unzipped folder, `static-ffmpeg` for a real ffprobe (the toolkit's bundled ffprobe is a duration-only stand-in, which made earshot fail with "'float' object has no attribute 'get'"). Then: `EARSHOT_PY=<venv>/bin/python EARSHOT_HOME=<cache> EARSHOT_PATH=<folder with ffprobe> node tools/audio/earshot.mjs <project>`.
- Earshot hears and measures; it still cannot say whether a voice is pleasant. Its free-text tags on speech are weak ("walking through dry leaves"): trust its measurements and sync, not those tags. A human listen with `review/ears/listen/CHECKLIST.md` remains the final taste check.
