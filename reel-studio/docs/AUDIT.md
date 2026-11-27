# Repository audit (Phase 1)

Written before any change in this upgrade. Evidence levels used below:
**E** = code exists · **X** = I executed it in this sandbox and it ran · **V** = it appears in a rendered video I inspected.

## 0. What is in the repository

| part | what it is |
|---|---|
| `reel-studio/` (4 earlier commits + 3 from the last session) | Remotion toolkit: master `SKILL.md`, 14 stage skills, 10 JSON schemas, `tools/` (state, validate, timing, audio, QA, capture, research, reference), `remotion-template/` (engine + 25 components + R3F `Scene3D`), 10 style packs, 8 analysed reference clips, examples |
| `faceless-shorts-skill.zip` | **A second, complete production system**: 6 styles (Deep Dive 3D, Night File 3D, Tall Tale 3D, Inside Out, Stick Story, Paper Atlas), each with `STYLE.md`, a style sheet and a runnable `example/`. Vanilla three.js + headless Chrome capture. Contains the best 3D character code in the repo (see 6) |
| `reel-maker-skill.zip` | One `SKILL.md`: a "notebook" Reels recipe (script rules, 1080x1920 safe zones, scene rules, loudness) |
| `animated-reels (1).zip` | A Remotion template (`primitives`, `Captions`, `voTiming`, `theme`) + `SKILL.md` |
| `output/`, root `*.mp4` | 5 baseline videos from the last session, plus 4 downloaded short-form clips and 9 reference clips in `reference vids/` |

## 1. Existing capabilities, and how far each one is proven

| capability | E | X | V | notes |
|---|---|---|---|---|
| Remotion project template, one frame-driven timeline | yes | yes | yes | all animation is a function of the Remotion frame |
| Kokoro voice (`voice.py`) | yes | yes | yes | needs a writable `REEL_HOME`; model downloaded here (340 MB) |
| faster-whisper word timing (`words.py`) | yes | yes | yes | needs `ffprobe`; this sandbox only had `ffmpeg`, so I used a shim |
| Estimated timing (no voice) | yes | yes | no | |
| Timeline, word anchors, caption chunks | yes | yes | yes | caption preset used to be ignored; fixed last session |
| Procedural SFX + music bed (`mix.py`, `build_cues.mjs`) | yes | yes | yes | **never listened to by me**; only loudness is measured |
| Captions: word-pop, one-word, dialogue, headline | yes | yes | yes | boxed, phrase, typewriter, karaoke exist in code, no video uses them |
| 25 2D components (cards, terminal, charts...) | yes | yes | partly | Terminal, Checklist, CommentBox, EndCard, Stamp, KineticList, NotebookPage seen. ProofCard, RepoCard, ProfileCard, RouteMap, EvidenceCard, Ledger, PhoneFrame, ChatBubbles etc. never rendered by me |
| 14 overlays | yes | yes | partly | label, step-label, sticker, tags, callout seen |
| R3F `Scene3D` with 5 character variants and 5 sets | yes | yes | yes | see section 5: this is the weak part |
| Playwright capture (`capture_web.mjs`) | yes | **no** | no | Python Playwright cannot run here (missing `libatomic.so.1`); Node Playwright untested until Phase 3 |
| Approval gates (`state.mjs`) | yes | partly | no | `init/start/done/request/approve/check` exist; see section 9 |
| Style / typography / caption galleries (`gallery.mjs`) | yes | no | no | |
| Reference analysis (`reference/*.py|mjs`) | yes | no | artifacts only | produced the 8 `reference-library/refN` folders; needs OpenCV (now installed) |
| Competitor research (`research/search.mjs`) | yes | no | no | written for the Panniantong Agent-Reach; the **PyPI package named `agent-reach` is a different project** (rss/youtube only). The real one installs from GitHub (v1.6.1, verified) |
| Critics | skills only | no | no | `visual-critique`, `script-critique`, `storyboard-critique` are instruction files. Executable checks that exist: `check_storyboard.mjs`, `frame_stats.mjs`, `audio_check.mjs`, `final_qa.mjs` |
| Installer / doctor | yes | partly | no | `doctor.mjs` ran but reports "missing" for things that exist in a venv elsewhere; no `install.sh`/`install.ps1`; `install.mjs` links skills only |
| yt-dlp | no | installed | no | YouTube refuses this server's IP ("confirm you're not a bot"), so URL download needs cookies or a local file. Must be explained to the user, not hidden |
| OpenCV | partly (reference tools) | installed (5.0.0) | artifacts | |
| HyperFrames | **absent** | no | no | no component, no mention in the toolkit |
| GSAP | **absent** | no | no | animation uses `anim.ts` easing + Remotion springs |
| Official `remotion-dev/skills` | installer exists | not rerun | n/a | |
| Creator analytics | **absent** | | | |

## 2. Executable but only partly implemented

- **Voice/caption approval**: the gate is one stage (`voice_captions`); no voice preview step, no separate typography/caption gates.
- **Style choice**: `gallery.mjs --kind styles` exists, never run; there is no way to combine packs or take a reference-derived pack.
- **Reference similarity**: numbers (cuts/10 s, palette, motion) exist, no comparison against a rendered output.
- **Targeted correction**: `preview_shots.mjs --only S03` renders single stills; there is no "re-render only these frames and splice" path.

## 3. Missing

Cinematography spec and continuity checker · character rig with IK and a real face · real environments/props · the executable critics listed in the brief · video-URL analysis flow · analytics flow · `install.sh`/`install.ps1`/INSTALLATION/TROUBLESHOOTING docs · HyperFrames and GSAP integration · approvals for brief, script-critic, audio, typography, captions, production, final-edit options.

## 4. Broken or weak (found by running it)

1. **Camera rules.** Last session I added an "auto-director" that cuts to a new angle every ~1.7 s, always-on camera sway, and a drifting camera behind every card. That is arbitrary, it is not direction, and it is removed in this upgrade.
2. **Characters (the main failure).** `Humanoid.tsx` builds people from cylinders, spheres and boxes with a flat-shaded Lambert material and a 2D canvas face. Result in the baseline videos: floating detached hands, tube limbs, no hair/clothing detail, no real shadows, no depth of field. The "minions" are boxes with two arched lines.
3. **Environments.** `Sets.tsx` sets are a gradient plane, a floor disc and floating polyhedra. The Roblox world is a checker plane with box buildings.
4. **Lighting/materials.** No shadow maps, no environment lighting, no tone mapping, no depth of field.
5. **`--auto` mode** in `run_example.mjs`/`state.mjs` marks every gate done. It exists for tests, but nothing marks the resulting video as a test. That conflicts with "approval must never be simulated".
6. **Doctor mismatch.** `doctor.mjs` expects `~/.reel-studio/venv`; a project venv elsewhere is reported as missing.
7. **Agent-Reach name collision** (above).
8. **`contact_sheet.mjs`** fails silently when `ffmpeg` is absent (it never checks `spawnSync().error`).
9. **Baseline videos are short** (12-19 s); two fail the toolkit's own 15 s minimum.

## 5. Quality of the five baseline videos (inspected frame by frame)

All five render, are voiced, captioned, loudness-normalised and sync correctly. The visual construction is below what is needed: see 4.2-4.4. Caption timing and legibility are the strongest part.

## 6. What to reuse (and what it is)

| component | where | decision |
|---|---|---|
| **SDF clay human** (`human.js`, `sdf.js`): surface-nets mesh, smooth blended body, `pose()` skeleton, face, x-ray mode | faceless-shorts `deep-dive` / `night-file` | **Reuse as the character base for the presenter and the original-character styles.** This is the biggest quality jump available and already exists |
| **Engine** (`engine.js`): ACES tone mapping, soft shadows, room environment, depth of field, bloom, vignette, grain | same | **Reuse** as the render path for 3D shots, driven by the Remotion frame |
| **Toon people, world, props** (`toon.js`, `world.js`, `props.js`) | `tall-tale` | Reuse for the "sunny 3D town" environment and props |
| `sets.js`, `sets3d.js` (kitchen, vessel, case rooms) | deep-dive, night-file | Reuse, adapt |
| Style sheets + `STYLE.md` rules | all six styles | Reuse as art-direction rules; they are the model for a style pack that has rules, code, example and QA |
| Faceless-shorts `selftest.sh`, `setup.sh`, `new_video.sh` | scripts/ | Reuse patterns for the installer |
| reel-maker rules (safe zones, scene rules, loudness) | SKILL.md | Fold into `typography` / `final-quality-control` skills |
| animated-reels `primitives`, `voTiming`, `Captions` | template | Compare with `engine/Captions.tsx` and keep the better of each; do not keep both |
| The Remotion engine (timeline, anchors, captions, Zone, overlays, 25 cards) | reel-studio | Keep |
| `state.mjs`, `validate.mjs`, schemas, `final_qa.mjs`, `frame_stats.mjs`, `audio_check.mjs`, `build_timeline.mjs` | reel-studio | Keep and extend |

## 7. Improve / replace

- **Improve:** `state.mjs` (gates), `check_storyboard.mjs` (add cinematography + continuity), `doctor.mjs`, `gallery.mjs`, `contact_sheet.mjs`, `capture_web.mjs`, `search.mjs`.
- **Replace:** R3F `Humanoid.tsx` and `Sets.tsx` as the *final* look. They stay only as a legacy fallback and get a deprecation note.

## 8. Current approval workflow (as implemented)

`state.mjs` knows 15 stages; 7 need approval: `style, topic, research, script, storyboard, voice_captions, final`. `check <stage>` blocks if an earlier gate is open. Nothing records *what the user said*, `approve` can be typed by the agent, and `--auto` bypasses every gate. Missing gates: brief, script critic result, audio, typography, captions, production, per-item storyboard replacement, final-edit change requests.

## 9. Installation and dependencies (as found)

`scripts/install.mjs` (links skills + fetches remotion skills), `tools/doctor.mjs` (reports). Python deps are installed by hand into `~/.reel-studio/venv`; Kokoro needs a 340 MB download; there is no one-command installer and no Windows script. This sandbox additionally needed: `ffprobe` shim, `REMOTION_GL=swangle`, a writable `HOME`, Node Playwright instead of Python Playwright.
