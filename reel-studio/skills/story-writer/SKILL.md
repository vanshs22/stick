---
name: story-writer
description: Write 10-20 second (and longer series) story shorts that read like a person wrote them and play like a small film. Hook, escalation, turn, open question, CTA, voice direction, and the choreography of what happens on screen. Use before storyboarding any story short; run tools/script_lint.mjs and tools/voice_direction.mjs after writing.
---
# Story writer (human, not AI)

Goal: a viewer should not be able to tell a machine wrote it. Every line is a thing a specific person did, said or noticed. Nothing is a lesson, a summary or a slogan until the very last line, and even then it is a question, not a moral.

## 1. The shape of 10-20 seconds (about 40-50 words, 4-6 lines)
| line | job | example (the "Pull" short) |
|---|---|---|
| 1 hook | a person, a goal and a clock, in 14 words or fewer, starting mid-action | "One job. Get the cake through that door before six." |
| 2 trouble | the first attempt fails, with a concrete detail the camera can show | "The door said pull. He pushed. Twice." |
| 3 witness | someone else sees it; a reaction is funnier than an explanation | "A man walked past. Slowly. Like he'd seen this before." |
| 4 turn | the real mechanism arrives as an action, not a statement | "He pulled. It opened like it had been waiting all day." |
| 5 open loop + CTA | one question the viewer can answer in the comments | "Dumbest thing you've ever pushed? Comment it." |
Longer: add a second failed attempt (rule of three, each worse) and a cost line with one exact number.

## 2. Sounding human
- Write for the ear. Say every line out loud. If you would not say it to a friend, cut it.
- Mix rhythm: at least one beat of 1-3 words ("Twice."), one run of 8-12 words. Never five sentences of the same length.
- Contractions ("he'd", "didn't"). Fragments are fine. A comma or full stop where you would breathe; no em dashes.
- Specific over general: a cake, not "a package"; six o'clock, not "soon"; "the door said pull", not "the instructions were clear".
- Let the joke sit in what is NOT said (the passer-by's slow walk), not in explaining it.
- No stock phrases (the lint lists them: delve, journey, game-changer, "did you know", "in today's world", "let's dive in", "not just X but Y", "at the end of the day").
- No lists of three unless it is a joke about lists. No "In conclusion". No moral.
- A real person has one slightly odd opinion or word choice: keep it.

## 3. Hook craft
One sentence, no greeting, no year, no "today". Pick one engine: a strange action ("He paid strangers to push empty carts"), a deadline ("before six"), a contradiction ("The sign said pull. He pushed."), a number ("Eleven minutes late"). It names a person or a thing, not a topic. First spoken word lands on frame 0-6 with the picture already in motion.

## 4. Questions and open loops (for continuous story videos)
- Every video plants ONE open loop and does NOT close it: the question the viewer will answer in the comments, or the thing that happens next.
- Series: end each part on a question the next part answers ("What was behind the second door?"); start the next part by answering it in the first 3 seconds, then open a new one. Keep a `series_ledger` of open loops in the project notes.
- Ask questions that are cheap to answer and personal ("Dumbest thing you've ever pushed?"), never "What do you think?". A question has a keyword for the comment (PUSHED) so replies can be counted.
- Inside the story, questions are for the character, not the narrator ("Why is nobody helping?" is better as a look).

## 5. CTA craft
One specific small action, in the character's voice, last 1-2 seconds, warm and slow: comment a word, name a thing, vote A or B. Never "like and subscribe". The last frame is the character looking at the viewer.

## 6. Voice direction (real human tone, pauses, emotion)
Run `node tools/voice_direction.mjs script.json`. It writes per line: speed, energy, pitch (rising on questions), pause_before and pause_after, breath, stress words, hesitation, and the gestures those stress words drive. Rules it applies: the beat of silence goes BEFORE the punchline (0.3 s), not after; short lines get longer pauses after them; the hook is said like it just happened to the speaker; the CTA is slower and warmer; nobody breathes between every sentence; a question ends rising and leaves room.
- Each line carries an `emotion`; the voice, the face (kit faces) and the body pose all follow that one tag. Change emotion inside a line only at a comma or a full stop.
- With a real performer or a better TTS: give them the performance sheet (not the raw script). Record one line per take, keep the breaths, trim silences to the pauses in the sheet, never "clean" every breath away.
- Captions: 1-3 words, never the whole sentence.

## 7. Choreography: what happens on screen (the human director's job)
Write `stage` for every line: where the characters stand, what they do, what the props do, in fractions of the line (0-1). Actions: walk, pose, mood, rattle, open, enter, carry. The planner compiles it and PROVES the logic (tools/lib/choreo.mjs):
- a door opens only after someone reaches for it; nobody walks through before it is open; a pulled door swings TOWARD the street, so the person steps back first; a pushed door swings away.
- two people never overlap; nobody walks into a car, bench, hydrant, crate; nobody stands on a live road unless the story crosses it; a carried box stays at the hand.
- passers-by, parked and moving cars, and lanes are part of the world: they follow lanes, keep their spacing and never touch the cast.
- every beat has anticipation (look, reach), the action, and a reaction (mood change). The reaction lands on the word, not after.
- one hero object per shot at most; one change per beat; a camera move for each beat (SCENE-PLANNING.md).

## 8. Checks before storyboarding
1. `node tools/script_lint.mjs script.json` (0 fail). 2. Read it aloud once. 3. `node tools/voice_direction.mjs script.json`. 4. `node tools/plan_scenes.mjs script.json <dir>` (ledger and choreography proofs pass). 5. Look at the stills.

## 9. Failure log
Hooks over 14 words; stats instead of one exact detail; a moral in the last line; five equal-length sentences; a CTA that asks for nothing specific; explaining the joke; characters standing on the road; a door that opens by itself; a pedestrian lane running through the hero.
