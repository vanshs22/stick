---
name: inkbeat
description: Make a toon-shaded 3D cartoon Short (painted textures, ink outlines, a camera that is never still) from a script and its word timings. Use when the user wants the inkbeat look or this camera grammar: beats on words, push-through cuts, low and high angles, foreground props, painted key-fact tags.
---

# Inkbeat: the look and the camera grammar

Engine: `renderers/inkbeat` (Remotion + three.js / React Three Fiber, MIT, notices in `renderers/inkbeat/THIRD_PARTY_NOTICES.md`). Style pack: `style-packs/inkbeat`. Full rules in `references/` (camera-and-editing, look-and-ink, characters, sets-and-materials, flicker-and-determinism, render-and-qa, shorts, audio-and-voice). Read `camera-and-editing.md` and `shorts.md` first.

## The camera grammar in one screen (the common rules are in `skills/camera-grammar`; this is the beat-short profile)
- **No cuts, camera beats.** About 56 camera events a minute (a beat is a move; a push-through cut counts). Around 5 percent of frames still. The move is the transition.
- **Every move is anchored to a word**, starting about 0.2 s before it: `[line, "word", nth]`. Sentence starts land on a beat (about 68 percent).
- **Moves**: PUSH 12-15 percent of the distance, PULL -16..-22, MACRO 30, ORBIT 15-25 degrees (small roll), CRANE/DOLLY a quarter of the distance, TILT 14, WHIP 25, PUNCH 8-15 percent in 6 frames on a punchline. A move between two distant framings takes 0.85-1.0 s and is one `to` lens.
- **Between beats** the camera drifts (3 percent per second and a slow arc). Pushes outnumber pulls about 2:1.
- **Angles**: lenses 60-80 degrees for sets, 85-95 low hero, 40-50 close-up; 40 percent low, 20 percent high; something near the lens in half the shots; dutch 2-6 degrees only inside moves.
- **Few locations, many framings.** One anchor object per location; alternate a macro on it with a medium on the character; change set only at a story turn.
- **Facts are objects**: a painted tag (1-3 words) on the prop the fact is about, never over a face, never on everything.
- **Cuts** are push-throughs (outgoing punches in over 3 frames, incoming lands over 8 with a fov pull).
- **Vertical framing**: faces at 30-45 percent of the height, captions at 70 percent, lowercase 1-2 words, swapped on the onset.

## Flow (tools)
1. Script + real word timings (`data/words.json` from `build_video`, or any `[{w, line, s, e}]`).
2. Write `ink-plan.json` (see `examples/showcase-bughunter-ink/`): shots (set mood, hero position and acting, lens as a `preset` heroLow/medium/closeUp/wide or an `aim` {from, at, fov, face}), `beats`, `show` (tags, gate, pop).
3. `node tools/ink/plan.mjs <ink-plan.json> <words.json>` resolves words to times, writes `renderers/inkbeat/src/story/plan.gen.ts` and prints the pacing: events per minute (target 56 +- 4; plan 10 percent more), sentence starts on a beat, longest hold (max 2.5 s).
4. `cd renderers/inkbeat && npm install` once, then `node tools/ink/stills.mjs <outDir>`: three stills per shot (15, 50, 90 percent, so the MOVE is visible) and `storyboard.jpg`. LOOK at it: a gate post covering a sign, a subject leaving the frame during a drift and an empty first frame were all found this way.
5. Video: `npx remotion render src/index.ts Story` (and `StorySub` at 4x fps, averaged with ffmpeg `tmix`, for motion blur). Measured QA: `python tools/qa/ink/analyze_pacing.py <mp4>` (beats/min, percent still, percent fast, hard cuts) and `flicker.py`. One render on the GPU at a time (`gpu_lock.py`).

## Honest limits
- Without a GPU a still takes about 15 s and a 35 s film hours; the contact sheet is the review step, the full render is a decision.
- Sets are code (`src/story/Den.tsx`): a new location is new code, with painted textures, 12+ props per framing and 1 cm offsets between faces (z-fighting).
- Audio is not part of this renderer: build the voice, music and sfx with the normal toolkit (`audio-production`) and mux.

## Other looks on this engine
`kidsong-3d`, `zackd-cutaway`, `anime-cinematic`, `pixar-soft` (style-packs/, looks in `renderers/inkbeat/src/looks/`). Judge them side by side: `node tools/ink/looks.mjs <outDir>` (wide, medium, close per style). Long-form 16:9: set `"format": "16:9"` and `"cadence"` in `ink-plan.json`; the plan then renders 1920x1080 with no burned-in captions and writes `captions.srt`.
