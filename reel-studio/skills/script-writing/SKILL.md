---
name: script-writing
description: Writes the narration of a short video - hook, story arc, proof, objections, call to action - as numbered lines tied to research claims. Use for the script stage and for every rewrite requested by a critic or the user.
---

# Script writing

Output: `script/script.json` (schema `script`). Validate it: `node $TK/tools/validate.mjs script $P/script/script.json`.

## Shape (adapt; do not force every beat)
1. `hook` (line 1, at most 11 words): a bold specific claim, a number, a question or a surprise. It must be visualisable in the first second.
2. `stakes` or `twist`: why it matters, or what is unexpected.
3. `setup`: "Here is how it works" (one line).
4. `step` / `mechanism` lines: one idea per line.
5. `objection`: the viewer's doubt, answered. 6. `proof`: real examples or real numbers only.
7. `cta` first ("Comment WORD and I will send you ..."), then `save` last ("Save this so you can come back to it"). Most people leave at the save line, so nothing important comes after it.

## Rules
- Speak, do not write. Short words, contractions, no jargon without a picture. About 12 words per line is a good default for fast explainers; calmer styles (documentary, noir) may use longer, flowing sentences split at natural pauses. Follow the style pack.
- A line is a cut: the picture can change at every line. Split long sentences at commas or "and", keep the sentence flowing in the voice.
- Length: about 2.4 words per second. 40 s is about 95 words. Put the count in `est_seconds`.
- Numbers as they are spoken ("forty thousand"). Names that TTS may mispronounce go to the audio plan pronunciations.
- Every factual line lists its `claims` ids from the research. A line with no claim is opinion or narration. No claim may be `unverified`.
- `emphasis`: the 1-2 words the caption should highlight (the surprising or the number).
- `visual_hint`: what the viewer should SEE when this is said (a real page, an object, a gesture). If you cannot say, rewrite the line.
- Loop the ending: the last line can echo the first.
- Original wording. Learn the structure of references, never reuse their sentences.

## Pitfalls
- Opening with context ("Today we will talk about..."). Open with the point.
- Lines that only make sense with the previous line's picture.
- Claims with no visual proof available. Cut them or change the evidence plan.

## What the critic checks (so you do not guess)
- Hook: a question, a number or a personal opening ("What if...", "I...", "Why..."); a greeting is rejected. Each line that states a number or a fact lists its claim ids in `claims`.
- A `cta` beat is only needed when the brief has a CTA keyword; with no CTA, end on `save` or the payoff.
- Words: about 2.4 per second of the target length (80 words is about 33 s); speed above 1.0 shortens it.

Put the call to action (the brief's CTA keyword) in the LAST TWO lines: the video critic looks for it in the last captions.

# Story craft (what separates a script people finish from one they skip)
Write like a top short-form writer, then cut. The script is for the EAR first, the screen second.

## 1. One promise, one payoff
- Write the promise in one sentence before line 1: "By the end you will know/feel/be able to ___". Every line either builds toward it or goes. The last beat must pay it off visibly (a result, an image, a number the viewer can repeat).
- One idea per video. A second idea is a second video.

## 2. The hook (first 1 to 3 seconds, 8 to 14 words)
Pick ONE shape and make it concrete (a thing, a number, a name, never "a lot"):
- **Contradiction**: "Your project works. So why does nobody use it?"
- **Specific result**: "I cut my render from 14 minutes to 90 seconds." (only if true and sourced)
- **Open question the viewer already has**: "Why does git branching feel instant?"
- **Cost of ignoring**: "This one missing file costs you every new user."
- **Pattern break / bold claim you then prove**: "A video is just a function."
Never open with a greeting, a channel intro, "in this video", or context. If the first line could start any video, rewrite it. Say the hook out loud: if you stumble, simplify.
The first frame shows the hook's subject, and the same words appear as text within 1 second.

## 3. Retention structure: keep one thread open
Stakes -> cause -> mechanism -> proof -> payoff -> next step. After the hook, each beat should end with a small open loop that the next beat closes ("Because nobody knows how to start it." -> "A README is a free tour guide."). Use "but", "so", "because", "until" between beats; avoid "and then" chains. Do not give the payoff away before the last third. Put the strongest proof in the middle, not at the end.
Spacing: a surprise, a number, a reaction or a new picture about every 3 to 5 seconds (as a result of the story changing, not a timer).

## 4. Spoken rhythm
- Contractions, short words, one clause per sentence, 6 to 14 words, vary the length (a 3-word line after two long ones lands hard).
- Numbers: say them the way people do ("forty", "a million"); one number per line.
- Cut: filler ("really", "basically", "just"), hedges, throat-clearing, any line that repeats the one before. Keep the line the viewer would quote.
- Write beats as lines a narrator can breathe between (0.2 to 0.3 s); a comma is a micro-pause; a full stop is a beat.
- Every line needs a VISUAL (put it in `visual_hint`): if you cannot picture it, rewrite it or cut it.

## 5. Voice and tone per style
Match the pack: neon-stage explainers are quick, playful and punchy (hype but honest, never fake numbers); editorial packs are calm and exact; noir is sparse and dry; presenters are warm and direct. Address ONE viewer ("you"). Humour only if it serves the point.

## 6. Ending
Close the loop opened by the hook (echo its words), then ONE ask: the CTA keyword (the brief's) or "save this", never three asks. The last line is short. End the picture on a held, clean frame (no fade to nothing).

## 7. Self-check before the critic
Read it aloud with a stopwatch: length within 10 percent of the brief; the hook is under 3 seconds; every claim has a source id; no line over 22 words; the promise is paid off; cut 10 percent.
