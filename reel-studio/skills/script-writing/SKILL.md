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
