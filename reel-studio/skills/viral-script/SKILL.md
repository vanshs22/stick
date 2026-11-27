---
name: viral-script
description: The viral script editor. Every video starts with script/viral-plan.json (promise, three hook options, beats with time shares, open loops, emotion arc, overlay and sound plan, loop, CTA, share reason), then the script is written against it and scored. Use at the script stage, for every style and every topic, and when remaking a reference video.
---

# Viral script editor

**Read `docs/STORY-BRAIN.md` first** (decide the viewer, promise, gap, turn and payoff; then every line must open, close, show, turn or land; hook bank; self-edit pass). The tools below only measure; this page is how you write well.

A viral short is not a lucky script. It is a plan that makes five decisions before a word is written. The toolkit enforces the plan; the craft below is how to fill it well.

## Commands
```
node $TK/tools/script_studio.mjs hooks "<topic>"                      # the hook patterns, fill-in lines
node $TK/tools/script_studio.mjs new   $P --format <f> [--ref <name>]  # scaffold script/viral-plan.json (TODOs)
node $TK/tools/script_studio.mjs score $P                              # rubric + the concrete rewrite for each finding
node $TK/tools/critique.mjs $P stage:script                            # script + viral critics together
```
Formats: `explainer` (hook, stakes, setup, mechanism, proof, twist, cta), `tutorial`, `story`, `dialogue-comedy` (premise, misread, escalation, reversal, tag), `listicle`, `news`.

## The five decisions (write them in the plan first)
1. **Promise.** One sentence: what the viewer gets by the end. If you cannot say it in one sentence the video is two videos.
2. **Hook.** Write THREE options with different patterns, say each aloud, pick the one you would stop on. Patterns: open-loop question, number + stake, contradiction, accusation ("you are doing X wrong"), POV or cold open. 8 to 9 words, 3 seconds, no greeting, no "so", no "in this video". The hook promises; it must not answer.
3. **Open loops.** At least one question opened in the first 3 seconds and closed between 55 and 80 percent of the film. While it is open the viewer stays. Open a second one before closing the first.
4. **Retention points.** A change the viewer can see or hear at least every 3 seconds: a new shot size, a number counting, a sound hit, a character reacting, a card replacing a card. Plan them by line id.
5. **Loop + share.** The last line reuses a word of the hook so the replay feels seamless. `share.reason` says why a stranger sends this to a friend (useful, funny, outrageous, validating). `cta.keyword` is one word, asked once, in the last two lines.

## Structures that work (pick one, do not mix)
- **Explainer:** hook (question) -> stakes ("here is what it costs you") -> setup (one picture) -> mechanism (2 to 3 steps) -> proof (a real capture or number) -> twist ("but the reverse is also true") -> CTA.
- **Story / mystery:** cold open -> setup -> escalation -> reveal at 65 to 80 percent -> reaction line -> loop to the cold open.
- **Dialogue comedy:** premise in the first line, one character misreads, the other escalates, a reversal at 70 percent, a tag line (the last laugh) that is shorter than anything before it. Two characters never share a voice; each reaction line is under 6 words.
- **Listicle:** the best item is second, not first; the last item reverses the list.
- **Tutorial:** the finished result is shown in the hook; each step is one verb.

## Voice of the script
Write for the ear: contractions, 12 words or fewer per line, one idea per line, numbers as they are said. Concrete beats vague ("73,667 developers", "the padlock", "3 a.m."). Cut intensifiers (amazing, literally, really, very, just). Read it aloud; cut 10 percent.

## Plan the presentation inside the plan
For each line decide what the viewer SEES that the voice cannot say (`overlay_plan`: a component from the manifest, see `reel-craft` section 5) and which sound belongs to which visual event (`sound_plan`). A line with nothing to show is a talking head shot: keep it under 2 seconds.

## From a reference video (copy the language, beat it)
1. `tools/reference/ingest.mjs`, then `tools/reference/blueprint.mjs $P <ref>`: the cut grid, shot-length targets, caption zone, sound onsets and a beat grid scaled to YOUR duration.
2. `script_studio.mjs new $P --ref <ref>` pre-fills the pace and the beat grid. Write NEW content: never the reference's words, characters, scenes or jokes.
3. `tools/reference/twist.mjs $P <ref> --idea "<what is better>"`. The viral and reference critics check that the twist is in the film.

## The loop
write plan -> write script -> `script_studio.mjs score` -> fix every major, defend or fix every minor -> `critique.mjs stage:script` -> ask the user. A plan can be waived only with `"waived": "<reason, 12+ characters>"` (for example a user-supplied script); the toolchain critic reports it.
