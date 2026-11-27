---
name: reel-craft
description: Craft rules for any short vertical video, in any style - hook and script structure, pacing and cuts, transitions, captions, overlays and mockups (which one, where, for how long), sound effects by event, voice casting and emotion, copying a reference style with a better twist, speed and 4K export. Read it before the script stage and again before the storyboard stage.
---

# Reel craft (applies to every style and every topic)

The pipeline gates make a video *valid*. This file makes it *good*. Numbers below are working defaults taken from the reference library (`reference-library/ref*/measure.json`); a style pack's own `STYLE.md` overrides them.

## 1. Order of work
reference (optional) -> twist -> topic -> research -> script (+cast) -> visual concept -> storyboard (frame by frame) -> assets (real captures) -> audio -> build -> critics -> contact sheet -> listen -> ship.
Never skip a stage to save time; save time with the speed rules in section 9.

## 2. Script that holds attention
- **Hook in 3 s, 16 words or fewer.** Pick one pattern: open-loop question ("Why does a site load instantly the second time?"), contradiction ("You are charging your phone wrong."), number + stake ("73,667 developers starred this."), cold open in the middle of the action ("The box was already open."), direct accusation ("Stop doing this in your terminal."), POV ("POV: the client wants it tomorrow."). A greeting is never a hook.
- **A new piece of information every 2 to 3 s**: a fact, an image, a turn, a number. If two consecutive lines add nothing, cut one.
- **Beats**: hook -> stakes -> setup -> step or mechanism (one idea per line) -> proof (real evidence on screen) -> twist -> CTA or save. Short films may merge beats; they may not drop the hook or the proof.
- **Pattern interrupt every 5 to 7 s** (a new shot size, a stat, a sound hit, a character reaction). Never two consecutive shots with the same framing.
- **Loop**: the last line echoes the first (a question answered, a prop returned) so the replay feels seamless.
- **Pace**: 120 to 180 words per minute (the script critic checks). Numbers are written the way they are said ("eight hundred milliseconds").
- **CTA**: one action, one keyword, in the last 3 s, on a card (`CommentBox`/`EndCard`).
- **Dialogue** (two or more characters): lines of 9 words or fewer, a reaction line after every reveal, interruptions allowed, one speaker per line, a `speaker` name tag in captions.

## 3. Cuts, pace and transitions
- Cut because the information or emotion changes, never on a timer. Start the next picture ON the word that names it.
- Median shot: explainer 2.0 to 3.0 s, story 2.5 to 4 s, tech-news 1.7 to 2.5 s. Never shorter than 1.0 s unless it is a flash or a hit. Hold a card long enough to read it (see 5).
- Transition by motion: **cut** (default), **whip** + whoosh (fast topic change or movement), **dip** (time jump), **zoom/match-cut** (a shape continues), **flash** + hit (impact), **swing** (a card replaced by a card). A transition needs a stated reason (`transition_out.why`).

## 4. Captions
- Genre: `word-pop` (3 words, default), `one-word` (comedy, hype), `phrase` (calm explainers), `karaoke` (music and lyrics), `boxed` (tech), `dialogue` (two speakers; name tag above), `headline` (news). One highlighted word per caption, chosen by emphasis, then number, then the longest word.
- Position: the style pack's `caption_y` (between y 180 and 1500 on 1080x1920). Never over a face, a key UI element or a card's text. If a card needs the caption zone, move the card up, not the caption.
- A caption is on screen at least 0.2 s (the timeline builder merges shorter ones). Contrast is checked by the frame critic.

## 5. Overlays, mockups and cards: which one, where, how long
Each is a real-world device the viewer already reads at a glance. Use the one that matches the *kind of fact*:

| Fact being said | Component (manifest) | Real-world model | Place | Enter / hold | Sound |
|---|---|---|---|---|---|
| A repo, stars, a package | `RepoCard` + scribble circle on the number | GitHub repo header | upper-middle, y 300-900 | on the repo name; hold until the number is said + 0.8 s | pop, then tick on the circle |
| "Go to this page / docs" | `BrowserWindow` (a REAL capture) or `ProofCard` | Chrome window | centre, slow zoom to the key region | on the page name; 2.5 to 3.5 s | whoosh in |
| A command or code | `Terminal`, `Typewriter` | macOS Terminal, VS Code | centre | on the verb; type speed matches the spoken pace | type (only while typing) |
| A post, creator, viral claim | `PhoneFrame`, `ProfileCard` | Instagram / TikTok post UI | centre, phone at 70 percent width | on the creator or claim; likes count up on the number | pop, count |
| An anecdote or dialogue | `ChatBubbles` | iMessage / WhatsApp | upper-middle | each bubble on its spoken line | pop per bubble |
| One big number | `BigStat` | broadcast stat card | centre | counts up exactly while the number is spoken | count, ding at the end |
| A verdict (true, false, scam) | `Stamp` | rubber stamp | over the card it judges | slam on the verdict word | stamp or slam |
| Two things compared | `Versus`, `BarChart` | comparison table | centre | each side on its word | tick per side |
| A sequence or dates | `Timeline`, `Checklist`, `FlowDiagram` | roadmap, to-do list | centre | each step on its word | tick per step |
| A change over time | `LineChart` | stock chart | centre | line draws while the change is described | riser (optional) |
| A mystery, a case, a person | `EvidenceCard` | case file, polaroid | centre, slight tilt | on the noun | pop, stamp for the reveal |
| A lesson, a rule | `NotebookPage`, `KineticList`, `Highlight` | notebook, marker | centre | on each item | pop |
| A name or topic label | lower-third (HyperFrames `lower-third`), `step-chip` overlay | news lower-third | y 1000-1200, left | 0.3 s after the name; hold 2 s | none or blip |
| The call to action | `CommentBox`, `EndCard` | comment field | y 700-1100 | last 3 s | ding |

Rules for every overlay:
1. It must show what the narration cannot say (a card that only repeats the words is a major finding of the visual critic).
2. It enters on its anchor word, within 0.1 s, never on a made-up number of seconds.
3. Reading time = 0.33 s per word shown + 0.5 s. A card shorter than that is cut or its text is reduced.
4. One card at a time. Content stays inside y 260 to 1340; captions live below it.
5. Real data comes from a real capture with provenance. A number that is illustrative says so on screen or in the research file as `opinion`.
6. Mockups are adjusted to the style: the pack's colours, corner radius and font, not the original brand's.

## 6. Sound effects by event (only names the mixer knows)
`pop` something appears, `tick` step or item, `type` typing, `count` number counting, `stamp`/`slam` verdict or impact, `ding` CTA or success, `whoosh`/`swish` fast move or whip transition, `zip` slide, `thud`/`boom` heavy landing or reveal, `sparkle` magic or a good result, `riser` build-up before a reveal, `alarm`/`heartbeat` danger, `boing`/`gulp`/`plop` comedy, `zap`/`blip` tech.
- Every sound is attached to a visual event (an anchor word or a transition). No sound without a cause.
- At most 4 sounds in one second; none in the last 0.2 s; the same effect not twice within 2 s; effects stay soft under the voice. A riser ends exactly on the hit it announces.
- Silence is a tool: drop the music for one beat before a reveal.

## 7. Voice, casting and emotion
- One narrator voice, or a **cast** for stories: `script.cast = {"MAYA": {"gender": "female", "tone": "warm"}, "LEO": {"gender": "male", "tone": "playful"}}`, each line `speaker: "MAYA"`. A female role always gets a female Kokoro voice (`af_`/`bf_`), a male role a male one (`am_`/`bm_`); two characters never share a voice (`build_tts_input.mjs` refuses otherwise). Tones: female warm, bright, soft, playful, calm, clear; male steady, friendly, playful, deep, low, documentary, storyteller.
- **Emotion per line** (`emotion`): neutral, happy, excited, sad, fear, shock, anger, calm, sarcastic, whisper, determined, curious, proud. Use at least three different emotions in a story under 30 s. Typical map: reveal = shock, danger = fear (plus a whisper line before it), joke = sarcastic, win = excited then proud, loss = sad.
- Honest limit: Kokoro has no acting model. Emotion is shaped speed, pitch, level, pauses, tremor and edge. Help it with punctuation in `tts_text` ("I... I can't." for fear, "No. Way." for shock, "Wait, what?!" for surprise) and keep emotional lines short.
- Music: pick by mood (upbeat explainer, tension mystery, bed calm). Keep it about 19 dB under the voice (earshot measured 29 dB as inaudible). Fade out at the end.
- Always run `python tools/audio/ears.py <P>` and listen to the clips it cuts. The checks measure; a person judges taste.

## 8. Copy a reference style, then beat it with a twist
1. `tools/reference/ingest.mjs` a video the user supplies; read `references/<name>/analysis.json` (pace, camera habits, palette, caption zone, loudness, sound density).
2. `node tools/reference/twist.mjs <P> <name> --idea "<one sentence: what is better>"` writes `twist.json`: what to KEEP (measured production language) and measurable levers to IMPROVE (earlier hook, a proof layer, sound tied to events, a loop ending, cleaner caption contrast).
3. Build in the pack that matches; the `reference` critic checks the render against both: close enough in pace and look to read as the same family, far enough to be new (similarity 0.55 to 0.90), and each lever met.
4. Never copy the script, characters, scenes, logos, music or wording. Learn the language, change the content.

## 9. Speed without losing quality
- Preview at `--scale 0.5` (4x faster) and fix there; render full size once.
- Shots are cached by content hash: change one shot, only that shot re-renders. Do not touch `remotion-template/src` mid-project (it invalidates every shot).
- 2D styles render in about 1.5 minutes; 3D shots cost minutes each on CPU. Give 3D only to shots that need depth; use 2D cards for facts.
- Rendering uses all cores but two by default (`REMOTION_CONCURRENCY` to change).
- Delivery: master at 1080x1920 (QA runs on it), then `--upscale` for the 2160x3840 file: Lanczos, instant, no AI. For crisp vector text at native 4K on a 2D style use `--scale 2` (about 4x the time).

## 10. Before you say "done"
Contact sheet looked at by you (not only the critics); captions never cover the subject; every overlay sits on its anchor; sounds match events; `ears.py` clips listened to or handed to the user; QA passes on the master; the 4K file decodes. List what you could not verify.

## 11. Lessons from the first 25-second two-character test (each one cost a render)
- **Look at the sheet before the critics.** The critics passed a film whose second speaker wore the first speaker's face, whose padlock was invisible and whose shock beat was dark text on red. Contact sheet first, then critics.
- **Sample inside the shot, not at whole seconds.** A stamp or card that slams on its anchor can look empty at the sample time. Take frames 0.15 s, 0.4 s and 0.9 s after the shot starts before calling a shot empty.
- **Two characters, one rig:** give each speaker `presenter.look` (`beard:false`, `longHair:true`, `hair`, `skin`, `jacket`) AND a `speaker` name tag. Voice, face and tag must agree.
- **Captions:** headline captions are kept to one line (24 characters); a longer caption collides with the cards that start at y 260.
- **Text on a dark background:** `TitleCard` draws dark ink; use `paper` or `slate`, or switch to `Stamp`.
- **Overlay coordinates are pixels on 1080x1920.** Put a circle on the thing it circles after you have seen where the card draws it (the first guess was off in two shots). The pass is: render, look, move, render only that shot.
- **Sound:** at most three whooshes in eight shots (the sfx critic enforces it); a cue that is quieter than the voice or music under it is flagged by `ears.py`: raise its gain or move it into a gap.
- **Earshot** (`node tools/audio/earshot.mjs <P>`): measured this film as launch-grade (loudness -14.3 LUFS, 93 percent of visual events have a sound, no dead air). Its remaining notes were stereo width and low end; `mix.py` now spreads the music and adds a sub layer under impacts.
- **Real sites rate-limit:** capture once, reuse `assets/web/...`; the capture step now retries on HTTP 429.

## 12. Lessons from the Claude-BugHunter explainer (36 s, 9 shots, every critic passed)
- **Blur is a defect.** `picture_quality.py` counts crisp blocks per frame; a blurred film fails 13 to 14 of 14 sampled frames. The storyboard check errors on aperture > 0.006, `look.maxblur` > 0.012, `bgImage.blur` > 10 (warns above 6). Props and cards must stay sharp; only the photo behind them may soften.
- **Cards enter on the cut**, not on a late anchor word: a card that waits leaves an empty first second.
- **One-line headline captions** (21 characters at most). Long ones wrap into the cards.
- **GitHub capture recipe:** capture the real page, scroll the element into view with `highlight`, then assert the text is inside the frame (the capture guard refuses text outside it). Use selectors that match one element; a `text=` that matches several fails. Every claim on screen needs real evidence (a capture, a number from the API or README). Where two sources disagree (README says 83 skills, description says 82), write "over eighty".
- **Sources line:** short, last card; the research critic checks it against `research.json`.
- **Photos:** Openverse image URLs are previews (<= 1024 px); use Wikimedia Commons originals and measure size. Wikimedia answers 429 without a User-Agent: the fetcher sends one and retries.
- **White cards:** Checklist, Versus, CommentBox, FileList and ChatBubbles are page-like; the frames critic exempts them from the bare-ink rule.
- **Whoosh at most three** per film; music must be real music (see audio-production).

Camera and cut rules that hold for every style: `skills/camera-grammar/SKILL.md` (cadence profiles per style).
