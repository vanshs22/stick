# Learnings from 27 reference videos (8 styles)

Source: 27 vertical shorts the user supplied (r01..r27), measured with `tools/reference/dna.py` (DNAs in `reference-library/dna27/`) and read from 8-frame contact sheets. Audio was measured only (never heard); no transcripts (script structure comes from on-screen captions). Face detection unavailable, so face framing is `unknown`.

## Measured medians per style

| style | n | dur s | cuts/10s | median shot s | LUFS | BPM | cap y% | cap words |
|--|--|--|--|--|--|--|--|--|
| 1 face + overlay above (r08 r11 r19) | 3 | 34 | 3.8 | 2.2 | -14.1 | 136 | 47 | 3 |
| 2 stickman + 3D background (r21 r26) | 2 | 61 | 3.5 | 2.5 | -14.0 | 144 | 70 | 1.5 |
| 3 2D stickman (r06 r10 r13 r14) | 4 | 59 | 4.0 | 1.9 | -14.1 | 123 | 70 | 2 |
| 4 whiteboard / blackboard explainer (r03 r17 r02 r15 r16) | 5 | 51 | 0.3 | 30 | -14.1 | 108 | 52 | 11 |
| 5 two-person deep thinking (r01 r09 r20) | 3 | 82 | 2.9 | 2.7 | -14.1 | 136 | 69 | 1 |
| 6 Roblox story (r04 r12 r23 r24) | 4 | 85 | 6.3 | 1.4 | -14.1 | 122 | 64 | 2 |
| 7 Claude minion + round-faced 3D person (r07 r18 r25) | 3 | 74 | 3.6 | 2.2 | -14.1 | 118 | 49 | 7 |
| 8 animated host below + explainer above (r05 r22 r27) | 3 | 65 | 0.8 | 7.0 | -14.1 | 112 | 50 | 7 |

Universal: every video sits at about -14 LUFS (our -14 target is right). BPM of music beds is 108-144; shot length tracks it.

## What each style does, and our own touch

1. **Face + overlay above.** Serif-italic full-screen title cards and terminal cutaways between face-cam; r19 splits a pixel-mascot infographic (top) over the face (bottom), white caption pills at mid-height, handheld plus dutch moves. Touch: original mascot, section chips, caption pill that avoids the face box.
2. **Stickman + 3D background.** Lit real-time 3D rooms, tiny sprite stickmen, thin lowercase white captions near 70%. Touch: painterly sets, rim light, camera push on the key beat.
3. **2D stickman.** Painted flat sets, HUD counters ("N DAYS LEFT", "PLAYERS ALIVE"), yellow-keyword caps captions, close-up reaction faces, poll-style end card. Touch: our rig v2 with x/y characters, HUD overlay, stakes counter.
4. **Whiteboard / blackboard explainer.** Almost no cuts: one long animated infographic shot (white grid with mono step chips, big numerals, pill titles; or dark brown/orange with tab pills, orange keyword boxes, pixel icon, comment-keyword CTA). Many words on screen. Touch: scripted element reveal timed to words, doodle overlay draw-on, original icon set.
5. **Two-person deep thinking.** Dark, painted, two faces close, quoted dialogue captions small at about 69%, final line scaled up as the payoff ("Twenty years downstream."). Slow pushes, long holds, eyes as the only motion. Touch: eye-line and breath motion, one enlarged payoff line, sparse sound bed.
6. **Roblox story.** Fastest cutting (6.3 cuts/10 s), lit 3D blocky world, score badges above heads (581,314), word-by-word captions, extreme angles (top-down, upside-down, low), time-of-day labels, "HUSS!" sting keyword. Touch: counter badges, angle variety rule, location sign overlays.
7. **Claude minion + round-faced 3D person.** Soft-lit 3D, big-eyed glasses character plus low-poly mascot, yellow/white bold captions with a bounce, UI cards (step chip, browser window, progress) floating in front of the character, pastel end card with CTA and handle. Touch: original mascot, step-card overlay system, CTA plate.
8. **Animated host below + explainer above.** Fixed host (bottom 30 %) gesturing in sprites; top 70 % holds a cinematic UI explainer panel (cream editorial with red keywords and a clock widget; or dark with green glow hex-graph) that changes per sentence; caption with highlighted keyword box at about 50 %. Touch: x/y characters as the host, per-sentence panel swap, keyword highlight box.

## Gaps against our engine
- Layout: split host-below/explainer-above, long-hold infographic mode, caption pills / keyword boxes, HUD counters and score badges are only partly covered.
- Overlay brain does not pick doodles or step cards automatically.
- Characters exist only in 2D packs; no 3D round-faced character yet.
- No measurement of speech rate, voices, or SFX; transcripts missing.

## Next (needs user approval)
Map these 8 styles onto packs, add the missing layouts and overlays, then make the 10 s proof per style.

## Script and audio structure (from transcripts, `reference-library/transcripts27/`)

Tools: vendored `claude-watch-video` (MIT, `tools/reference/watch.mjs`, ~5 s per video, faster-whisper tiny.en) for transcripts; `rea-video` (Apache-2.0) for SFX/stems/stickers (~5 min per video, run only on r08 and r19; sidecars in `reference-library/sfx27/`, converted by `tools/reference/deep_ingest.py`). Whisper was clean except r12 and r16 (garbled: fast speech or music) and r01/r09/r20 (no speech: caption-only films over music).

**Word counts:** tutorial/promo styles (1, 4, 7-claude, 8) run 90-260 words in 35-80 s, about 3.5-4 words/s (fast). Story styles (2, 6) 220-500 words. Roblox r23-25 are the longest (400-500 words).

**Hook (first sentence) patterns, all with a number or a stakes line:**
- Warning/negation: "Don't use Claude code unless you've installed these five plugins." (r08)
- Absurd claim + stakes: "make 100 versions of Claude fight to the death" (r11); "buried a man alive with a bell tied to his finger" (r06); "He bent the roller coaster's loop out of shape... it cost him everything" (r26)
- Social proof: "Someone open sourced... passed 11,000 stars" (r19); "Twenty-five GitHub repos... you only need four" (r15)
- World rule: "In this town, everyone is only allowed to take 1 million steps in their entire life" (r23, r24); "If you plant a tree beside an empty road, cars will steer right into it" (r21)
- Dialogue cold open: "Claude, I asked you to fix one typo!" (r07); "Claude, I graduated today. Zero offers." (r18); "What? Why does AI get dumber the longer I chat?" (r25)
- Tutorial promise: "Everyone's making AI animated reels... nobody's showing you how. So I'll show you everything." (r22, r27, same template)

**Tutorial body:** numbered list ("The first is... The second is...") or steps ("Step one. Connect Playwright") with a problem->fix sentence each; r03 uses "The problem: ... The fix: ...".

**CTA (every tutorial/promo ends with a comment keyword):** "comment Claude/arena/pre-sell/reels/Wi-Fi/Studio/kit/set up/agent/apply and I'll send you the link." Roblox/story ends with a callback twist ("The whole town walks upside down", "It was in this video the whole time") or a plug ("connect viral explainers to Claude, link in bio"). Dialogue styles (7) end on a joke tag ("Your billing code hasn't run since March.").

**SFX (r08, measured):** 36 hits in 57 s (6.3 per 10 s), mostly whooshes, plus clicks and one ding; 39% sit on cuts; bed at -55..-60 dB under voice; voice is TTS at about 225 wpm, male, 98 Hz. r19: only 3 hits (1.4 per 10 s). So SFX density differs 4x between styles; our audio plan must set it per style, not globally.
