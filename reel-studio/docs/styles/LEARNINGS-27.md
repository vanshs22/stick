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
