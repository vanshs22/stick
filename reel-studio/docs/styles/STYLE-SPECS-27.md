# Style specs from 27 references (what to build and what to improve)

Evidence: contact sheets of all 27 videos (15 frames each), transcripts (`reference-library/transcripts27/`), DNA measurements (`reference-library/dna27/`), SFX/stems for r08 and r19 (`reference-library/sfx27/`). Not heard by me: audio. Every spec says KEEP (technique to copy), OUR TOUCH (what we change so it is not a copy), BUILD (engine gap). Existing packs: sketchy-stickman, neon-dashboard, facecam-overlay, doodle-explainer, plus the nine older ones.

## Cross-style rules (seen in all 27)
1. **Hook in the first 2 s:** a number, a stake, or a rule-breaking claim, spoken and shown on screen at once (see LEARNINGS-27 hook list).
2. **A new visual every 1-3 s** in cut styles; in long-hold styles something *inside* the frame changes every 1-2 s (a card flips, a counter ticks, an icon draws on).
3. **Captions follow speech 1-3 words at a time** (styles 1-3, 6) or a sentence at a time (styles 4, 5, 7, 8); a single highlighted keyword colour per video.
4. **One recurring brand object** (pixel crab mascot, Claude spark, flower mascot, host, golden mic/TV halo "MC") that returns every few seconds.
5. **End card = comment keyword CTA** (tutorial) or "Part N, follow for Part N+1" (story series) or a twist.
6. Loudness -14 LUFS, music 108-144 BPM, music well under the voice.
7. Series framing: r13/r14/r10 are parts 2/3/1 of one show ("LAST ONE BREATHING WINS") with a HUD that persists across parts. We should support a `series` block (title, part number, HUD state).

## Style 1: face with overlay above (r08, r11, r19)
- **Layout:** vertical split. Top 40-45 % = overlay card, bottom 55-60 % = face cam. A white seam line is not drawn; the caption sits ON the seam (y 40-50 %). Full-screen cutaways (title cards, terminal, charts) replace the face for 2-3 s, then return.
- **Overlay content per sentence:** r11 uses pixel mascots (100 crabs → tournament → arena sprite scenes with "TOO GENERIC / NO PROOF" speech boxes), then real UI (terminal, email card, GitHub link). r19 uses an animated infographic scene per phrase (stars falling into a jar, bar steps, search lens over social logos, chat bubbles, payment toast, code window, calendar+phone) in pastel with a baseball-cap mascot. r08 mixes brand title card, graphs, blurred dashboards with an orange highlight frame, terminal.
- **Captions:** r11 = mono caps in a dark pill at the seam. r08 = bold sans 1-2 words, keyword in serif-italic or green highlight, over the lower face. r19 = coral rounded pill 3-5 words, bottom of overlay.
- **Camera:** face cam slow digital push-in with punch-in on emphasis (handheld/dutch share 0.39 in r08); overlays enter with scale-pop; blur transitions between cutaway and face.
- **Audio:** TTS-like fast voice 225-235 wpm, whoosh on cuts and sticker pop (r08 6.3/10 s; r19 only 1.4/10 s), bed -55 dB.
- **OUR TOUCH:** original mascot (not crab/Claude), seam-aware caption that avoids the face box, per-sentence overlay picked by the overlay brain, 3 levels of overlay density (calm/medium/busy).
- **BUILD:** `facecam-overlay` pack exists; add top-card templates (counter-jar, bar-steps, search-lens, chat-bubbles, payment-toast, terminal), seam caption, cutaway/face scheduler.

## Style 2: 2D stickman in 3D background (r21, r26)
- **Layout:** full-frame lit 3D world (country road with tree, theme park, garage); a small cartoon stickman (round head, thin limbs, cap; big expressive eyes) standing inside it; camera is the star: drone orbit, low road-level tracking, driver POV, top-down on the roller coaster, close-up on a prop.
- **Props with text:** neon sign "DON'T HIT THIS TREE", speed-limit sign "YOUR SPEED 15", sign "TARGET FIXATION", banner "OPENING TOMORROW", ride name on the cart. Signs are diegetic (part of the world), not overlays.
- **Captions:** thin white sans, lowercase, 1-2 words, y 70 %, soft shadow.
- **Camera numbers:** median shot 2.5 s, 3.5 cuts/10 s, 144 BPM music bed; long establishing 9-18 s shots appear (r26 has shots up to 18 s with a slow push).
- **Story arc:** setup (character + goal) → escalation (rival copies / drivers crash) → reversal (physics trick) → payoff image (explosion, lone sign in night rain).
- **OUR TOUCH:** our painterly/PBR sets with original characters x and y as sprites (billboard) in the 3D world; diegetic sign props from a prop list; day→night grade shift per act.
- **BUILD:** sprite-in-3D mode exists in inkbeat (F); need a library of 8 diegetic sign props, POV-from-vehicle camera rig, drone orbit, grade-per-act.

## Style 3: 2D stickman, flat (r06, r10, r13, r14)
- **Layout:** 9:16 flat vector scenes (painted backdrops: bedrooms, car interior, stage with spotlight, CCTV wall, news desk). Characters: white round-headed stickmen with distinct hair/hat/glasses; extreme close-ups of faces (eyes/brows only) alternate with wide two-shots. Elaborate character: golden-halo TV-headed host "MC".
- **HUD (r10/13/14):** top-left, "● 90 DAYS LEFT" in red + "100" big white + "PLAYERS ALIVE"; numbers change in the story (100 → 99).
- **Captions:** bold white caps, 2-3 words, y 70 %, keyword in yellow, black outline.
- **End card:** dark, "LAST ONE BREATHING WINS / PART N / FOLLOW FOR PART N+1" (red PART N).
- **Cutting:** 4 cuts/10 s, median shot 1.9 s; whip/zoom into face for emotion; screens-in-screens (phone call, TV news with red map, CCTV grid).
- **Audio:** multi-voice dialogue (distinct voices per character), sting at reveals; r10/13/14 transcripts show 100-110 words per minute-long part, so dialogue is slow and dramatic.
- **OUR TOUCH:** rig v2 characters x/y + original cast; stakes HUD with series state; "screen-in-screen" template (phone/TV/CCTV) as a built-in shot type.
- **BUILD:** HUD overlay (title, big number, label, animated tick), series end card, screen-in-screen shot type, close-up-face shot (eye-only crop).

## Style 4: whiteboard / blackboard explainer (r03, r17, r02, r15, r16)
- **Layout:** no host. One continuous animated infographic per sentence; the frame is the board. Caption block y≈50 % (r03/r02), or bottom 15 % (r17, r02: rounded pill, orange keyword), or top as a sentence + big number (r17/r16).
- **Variants:** r03 white grid + mono step chips + black pill titles + mini avatar bottom-left; r17 pale grey → dark navy transitions, 3D tilted card arrays (1,000,000 views), calendar, ledger bar, football-stadium comparison (visual unit conversion), hand-drawn red pen annotation; r02 dark with a coral spark mascot, speed dial 0→10x, device list with "Not recognized"/"Blocked" tags, 1→23 "fixes found" counter, final green ring; r15 dark brown/orange tab pills, repo cards with star counts; r16 Hindi/Hinglish: GitHub profile card, count-up 1,74,736 stars, "64 AI AGENTS / 261 SKILLS" boxes, hub-and-spoke diagram ("Claude" centre), terminal command, price tag ₹4,999 → FREE stamp, comment box "GITHUB", follow card.
- **Captions:** r02 = lower pill, keyword orange; r16 = small bold bottom line; top line = Hindi lead-in ("aur andar milta hai…") in grey plus the punch line in huge caps with red/green keyword (kicker + headline pattern).
- **Pacing:** 0.3 cuts/10 s; inside the shot a new element every ~2 s; numbers count up; before/after states (slow → 10x, 1 → 23 → 'applied').
- **Audio:** music 108 BPM, voice 3.5-4 w/s.
- **OUR TOUCH:** element-reveal timeline derived from the script (each sentence = one reveal), doodle overlay for arrows/circles, original mascot, unit-comparison template (e.g., "10 football stadiums").
- **BUILD:** infographic block library: count-up number, speed dial, device list with tags, hub-and-spoke, price tag→FREE stamp, comment-box CTA, follow card, terminal typing, bar steps, tilted card array; kicker+headline caption mode.

## Style 5: two-person deep thinking (r01, r09, r20)
- **Asset reuse:** all three share the same two painted faces (one in front-left looking sideways, one behind-right with a hand over one eye). Only the dialogue text changes. So the style = one art set + a dialogue script.
- **Shots:** (a) two-shot (both faces, opening 0-5 s); (b) close-up of the near face with the far face cropped at the right edge, eyes darting; (c) close-up of the far face, eye wide, hand over face (used on 'heavy' lines); (d) very tight push on the near face at the payoff line.
- **Captions:** quoted lines in small white sans, top-left, aligned toward the speaker (left for the near face, shifted right for the far face); previous line fades; the final line is bigger/bolder ("Twenty years downstream.").
- **Motion:** almost only eye movement and a slow 3-5 % push; very long holds (r01 72 s, 15 shots in 15-s sampling are the same two frames).
- **Audio:** no voice (Whisper found 0-2 words in all three); ambient music bed; this is a read-the-text film.
- **OUR TOUCH:** new painted pair, eye-dart + blink + breathing loops, speaker-side caption placement, line-length-based hold time, one ambient track with slow swell on the payoff line.
- **BUILD:** `two-faces` template (3 framings, speaker side flags), eye-dart rig, dialogue-script → shots mapper.

## Style 6: Roblox story (r04, r12, r23, r24)
- **Layout:** full-frame real-time 3D, Roblox-like characters (blocky, gradient clothes with star badges), sets: street, haystack, cow's shop, lost-and-found stall, baby stroller close-ups, bank/hospital/town fronts, a top-down desk with laptop. Camera is hand-driven: top-down, upside-down, dutch, close-ups of props, POV.
- **Diegetic text:** counters over heads (581,314 steps, 703,519), signs ("COW'S HAY SHOP", "ONE RAW = 1 COIN"), clock sign "9:00 AM", "You're absolutely right." on a monitor.
- **Captions:** yellow/white bold sans, black outline, 1 word at a time at y 64 %; sting word repeated as the beat ("HUSS!" in r04).
- **Pacing:** 6.3 cuts/10 s (fastest), 84 s long; the hook sentence is a rule ("In this town, everyone is only allowed 1 million steps"); end with a twist/callback and a plug.
- **r12 (voxel host variant):** a blocky presenter in a room with props that change per sentence (neon sign, framed price, whiteboard, green terminal box), keyword boxes in captions (orange/green rounded boxes), spotlight cut for the reveal, 'comments' phone as the CTA.
- **Audio:** story narration 5+ w/s (r23: 504 words), whoosh on cuts, comic stings.
- **OUR TOUCH:** our voxel/Roblox-like worlds with original cast; head-counter prop system; keyword-box captions; 'twist/callback' ending template.
- **BUILD:** existing D/B packs cover worlds; add counter-over-head prop, keyword-box caption preset, spotlight reveal cut, top-down desk camera.

## Style 7: Claude minion + round-faced 3D person (r07, r18, r25)
- **Characters:** a low-poly mascot (r07 flower/coral blob with square eyes and tiny legs; r18 orange square octopus; r25 red pomegranate-spiky fruit) paired with a round-faced low-poly human (big glasses/cheeks or freckles). The mascot is the 'AI', the human is the user; they talk in dialogue (the human in the foreground close-up, the mascot centre-frame on a podium/books).
- **Overlay cards over the face (r18):** white macOS-window cards (step title, code, progress "98/100", form fields) float centre-screen over the blurred character; speaker tag "CLAUDE / YOU" in tiny caps above the caption; steps numbered ("STEP 1/4").
- **Captions:** r07/r18 sentence captions in 1-2 lines at y≈45-50 % (white, soft glow); r25 yellow-white bold word-by-word with a bounce; r25 shows a diagram card (1 2 3, "Party → Homework") at the end; CTA is a pastel gradient end card with the mascot, "Send this to a friend who just graduated", 'APPLY' button, handle.
- **Camera:** shallow depth of field, slow push on the speaker, mascot hero shot with rim light, tilt-up to a ceiling of paper in r25 (200 messages visual gag).
- **Audio:** two voices (one grumbly human, one cheerful mascot); r18 voice recorded clean; soft music.
- **Script:** the *joke* is the AI being literal/over-eager (r07: 200-file PR for a typo), the payoff is the tool/setup (CLAUDE.md, Playwright flow, context-length explanation) and a comment-keyword CTA.
- **OUR TOUCH:** original mascot + our round-faced character (chibi in C), speaker tag pill, step-card overlay system, joke→tool→CTA script template.
- **BUILD:** step-card overlay (title, code lines, progress), speaker tag, DOF blur plate behind the cards, gradient CTA card.

## Style 8: animated host below + explainer above (r05, r22, r27)
- **Layout:** top ≈ 70 % = explainer panel that changes each sentence; bottom ≈ 30 % = animated host (cartoon bust: r05/r22 curly-hair, beard, black hoodie; r27 brown-hair guy in black blazer) with 6-8 poses (point up, point sideways, thinking hand on chin, surprised, wink, hands up). A small brand tile (REEL KIT) sits bottom-left.
- **Panel types:** r05 cream editorial with red keyword + mono section header "// 04 — myth 2 — hard to use" and a "MYTHS 2/3" counter; background colour changes by section (cream → black → red CTA); r22 same family with step chips "STEP 3/6", a clock widget bottom-left that counts the demo time, red hand-drawn circle highlights; r27 dark with green neon, hex-grid skill hub, 1,000,000 counters, phone/terminal mockups.
- **Captions:** big sans 1-2 lines at the top of the panel (r05/r22), highlighted keyword with colour box (r27 at y≈50 %, 'millions', 'not', 'scores' in a green frame).
- **Cutting:** 0.8 cuts/10 s; inside the panel an element animates in every 1-2 s; host pose changes on emphasis.
- **Audio:** 65 s, 112 BPM, voice 3.5-4 w/s, comment-keyword CTA "comment kit / set up / agent".
- **OUR TOUCH:** x/y characters as the host (sprites exist: neutral, talking, explaining, pointing, thinking, surprised, approval), per-sentence panel swap driven by script lines, section header + counter chip, timer widget.
- **BUILD:** `split-host` layout (panel 70 / host 30) as a foundation layout, panel templates (editorial-cream, neon-dark), section chip with counter, keyword highlight box caption, pose-on-emphasis scheduler.

## What this changes in our zip (priority)
1. **Layouts:** `split-top-overlay` (style 1), `split-host` (style 8), `full-3d` (2, 6, 7), `board` (4), `two-faces` (5).
2. **Caption presets (data):** seam-pill mono caps, 1-word bounce yellow, sentence-glow white, keyword-box (green/orange), kicker+headline, quoted-dialogue side-aligned.
3. **Overlay library:** count-up, speed dial, device list+tags, hub-and-spoke, step card, terminal typing, price→FREE stamp, comment-keyword CTA, follow card, HUD (series), screen-in-screen, diegetic sign props, head counters, unit-comparison.
4. **Audio plan per style:** SFX density (0-6 per 10 s) and 'sfx on cut' share (0-40 %) as style parameters; two-voice dialogue; no-voice (style 5).
5. **Script templates (hook → body → CTA):** tutorial-list, joke→tool→CTA, world-rule story, series cliffhanger, dialogue-only.
6. **Quality loop:** add critics for counter continuity (HUD number must match story), speaker-side captions, element-per-2s density in long-hold shots.

Not verified: audio by ear; SFX numbers only for r08/r19; r12/r16 transcripts are garbled; face framing unmeasured.
