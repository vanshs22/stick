---
name: reference-style
description: Make a video in the SAME STYLE as a reference image or video the user gives (a 3D character look, a lighting setup, a set, a camera feel, a colour grade, a 2D look), then add our own twist. Read it whenever the user attaches or links a reference and says "make it like this", "same style", "copy this look", "in this style but...". It teaches how to read a style properly, how to map it to what the engine can really render, how to say honestly what cannot be matched, and how to prove the film is in the style.
---

# Reference style: copy the LOOK, change the content, add a twist

The user gives you a picture or a video and wants a new film that looks like it. Your job has two halves that people mix up:
1. **Read the style** (character design, materials, set, lighting, camera, colour, post, and for video the pacing and sound) precisely enough that another person could rebuild it.
2. **Rebuild it with this toolkit's engine** and be honest about what the engine cannot reach.

Never copy the content: not the person, the script, the jokes, the logos or the music. A reference teaches a *look and a language*; the film is new.

## The commands (in order)
```
node $TK/tools/reference/ingest.mjs $P <file-or-url> --name ref1         # image, video, site or repo; measures it and cuts keyframes
node $TK/tools/reference/style_brief.mjs $P ref1 --template              # MEASURES the look (light side, blur, warm/cool, vignette, face, palette) and writes the sheet to fill
#  >>> LOOK at every image it lists, fill every TODO in references/ref1/style-brief.json <<<
node $TK/tools/reference/style_brief.mjs $P ref1 --validate               # refuses vague, empty or unlooked sheets
node $TK/tools/reference/style_map.mjs $P ref1                            # closest pack, overrides, an honest fidelity table, gaps, twist options
node $TK/tools/reference/blueprint.mjs $P ref1 --duration 18              # VIDEO references only: cut grid, pace, camera, sound hits
node $TK/tools/reference/twist.mjs $P ref1 --idea "<what is new, 8+ words>" --levers palette_shift,character_swap
#  ... script (skills/viral-script), storyboard, build ...
node $TK/tools/critique.mjs $P style                                      # measures the film against the brief, writes review/style-compare-ref1.jpg
node $TK/tools/reference/style_check.mjs $P ref1 --template               # then LOOK, fill, --validate: every must-keep confirmed in the film
```
Worked example (a stylised 3D podcaster at a microphone, night studio, neon sign): `skills/reference-style/example-podcast-3d.style-brief.json`. Read it before you write your first brief: it shows the level of detail that passes.

## Step 0: tell the user what to expect (before you build anything)
Ask at most three things and answer the rest yourself:
1. "What must match most: the **look** (light, colour, lens, set) or the **character's face and hair**?" (the engine matches the first far better than the second)
2. Topic, length, platform (if not given).
3. "May I change the character, palette or set for the twist?" (default yes: that is the point)
Say plainly: "The engine renders stylised 3D with articulated characters. I can match the lighting, colour, depth of field, camera and set closely; faces and hair will be simpler than a film-studio render. I will show you a side-by-side before the long render."

## Step 1: read the style (this is the part most agents do badly)
Do the **five-second read first**: cover everything and ask "what 3 words would I use to describe it to a designer?" (e.g. *soft, glossy, cosy-night*). Those words become `medium.look_in_one_line`. Then go through the sheet top to bottom, LOOKING at the image for every field. Rules:
- **Measure, do not adjectivise.** "Big eyes" is useless. "Each eye about 1/5 of the face width, round-almond, one catch-light upper left" can be rebuilt. Use ratios (eye width to face width, head to body, hand to face), counts (how many catch-lights, how many set objects), and `#RRGGBB` colours (at least 6: skin, hair, outfit, key light, accent, dominant).
- **Read light from evidence.** The side with the long soft shadow is away from the key. Catch-lights in the eyes show the key's side and softness (a large soft rectangle = a soft box). A bright thin edge on one side of the hair and hood is a rim light: write its colour. A glow that tints a wall is a practical (neon, lamp, screen): write its colour and where it sits. Two colour temperatures (warm one side, cool the other) is the most common "cinematic" recipe.
- **Read the lens from depth.** Strong background blur and a close foreground object means a portrait lens and a wide aperture (set `aperture` high). Everything sharp means a wide lens or a flat 2D look.
- **Read materials by how they catch light.** Skin that glows at the edges (subsurface), glossy hair clumps, knit fabric with a visible weave, matte plastic, brushed metal. These decide whether the look is "soft stylised" or "hard low-poly".
- **Inventory the set.** List every object with position, colour and whether it glows. Backgrounds carry half the style.
- **For a video, add the language:** `blueprint.mjs` measures cuts, shot length and camera moves; then watch the keyframes for how the character moves (bouncy, snappy), blink rate, mouth shapes, caption style, transitions and sound density.
- **Common misreads:** calling a 2D flat character "3D" because it has a drop shadow; missing a second light colour; ignoring a foreground blurred object (it is part of the composition); writing "a man" instead of describing the DESIGN; copying a logo into `set_dressing` (record it under `brand_marks_to_avoid` instead).
- If you cannot see images: `style_brief.mjs --unavailable "reason"`, then ask the user to describe the character, set and lighting in words. Never invent what you did not see.

## Step 2: map to the engine, honestly (`style_map.mjs`)
It picks the closest pack and writes `style-overrides.json` (your own look on top of the pack: colours, bloom, aperture, vignette, grain, the cast's skin/hair/outfit colours) and prints a **fidelity table**:
- **exact:** palette and grade, depth of field, bloom, vignette, grain, camera framing/angle/movement, cards and overlays, voice, music and sound.
- **close:** lighting direction and mood (warm key + cool rim + coloured practicals), a studio/room set with shelf, window and plants.
- **approximate:** the character's overall design, face (eye size, brows, lids), skin glow, hands, outfit detail.
- **cannot:** strand or clump-level hair, film-grade glossy eyes with several catch-lights, cloth simulation, objects the engine has not built.
Read `references/ref1/style-map.md`. **Tell the user the table in two sentences.** Every "cannot" and "needs build" is a decision: approximate it, work around it, build it (toolkit development mode, with a test), or leave it out and say so.

### Design the twist AROUND the engine's strengths
The best way to hide a gap is a character that does not need it:
- Hair cannot be matched? Give the new character a **beanie, hood, cap or headband**, or a short crop.
- Hands are simple? Keep gestures large and readable (open palm, point, shrug) and frame at medium-close-up.
- A glossy-eyed face is out of reach? Use a character whose appeal comes from colour, silhouette and acting (expressive brows, mouth) and keep the lighting recipe that gave the original its polish: warm/cool split, rim light, bloom, shallow depth of field. **Lighting and lens carry most of what people call "the style".**
- A missing set object? Replace it with a sticker, a screen prop or a neon ring in the same colour.

## Step 3: the twist (required, measurable)
Pick **two or more** levers and write one sentence (8+ words) saying what is new. `twist.mjs` records them; `critique.mjs style` checks what it can:
| lever | meaning | checked by |
|---|---|---|
| `palette_shift` | rotate the accent/dominant hue 20 to 110 degrees, keep brightness and saturation | measured (the critic computes the hue move) |
| `character_swap` | a different person: age, hair, outfit colour, profession | by eye (style_check) |
| `set_swap` | same lighting recipe, a different place and dressing | by eye |
| `lighting_twist` | same key/rim logic, different practical colour or time of day | by eye |
| `camera_twist` | same lens feel plus a purposeful move or closer angle | by eye |
| `format_twist` | same look, different format (skit, countdown, comparison) | by eye |
| `story_twist` | a reversal the reference lacks, paid off in the last line | by eye |
For a **video** reference also use the pace levers (tighter shots, a proof layer, event-tied sound, a loop ending). A good twist is visible in the first five seconds and is one you can say in one sentence.

## Step 4: build, look, prove
1. Write the script with `skills/viral-script`; the new content is yours.
2. Set the pack (`style_pack` in the brief = the closest pack), keep `style-overrides.json`, and cast a NEW character (`cast[].look` colours).
3. **Preview before the long render:** `build_video.mjs $P --estimate --scale 0.25` then `preview_shots.mjs $P` and put one still next to the reference. Fix lighting, framing and colour there.
4. Render, then `critique.mjs $P all`. Open `review/style-compare-ref1.jpg` (reference left, film right) and the contact sheet.
5. `style_check.mjs --template`, look, fill: for every `must_keep` say true/false and where you see it. A missing must-keep needs `"decision": "fix"` (then fix and re-render) or `"accept: <reason>"`. Also confirm the twist is visible and **no logo, trademark or real person** from the reference is in the film.
6. Tell the user: what matches, what is approximate, what you changed on purpose, and what you could not do.

## What to do when the engine cannot get close enough
1. **Say it, show the side-by-side, and ask.** Never present an approximation as a match.
2. **Toolkit development mode** (only if the user asks you to improve the engine): extend the rig (for example eye catch-lights in `remotion-template/src/three/human.js`, a prop in `props.js`), add a test, rerun `selftest.mjs`.
3. **Stills from the user's own image tool.** If the user can generate or supply stills in the target style, use them as `bgImage` backgrounds or `ProofCard` images with the slow push-in, put real overlays, captions and sound on top. That is honest 2.5D "still-motion", not an animated character. Do not call it character animation.
4. **Match the language, not the render:** if the look cannot be reached, match the pacing, framing, colour, captions and sound, and tell the user which parts of the style are missing.

## Never
- Copy a person's face likeness, a logo, a trademark, music or a script. The brief lists `brand_marks_to_avoid`; the check confirms it.
- Claim a style match you did not look at. `style_check.mjs` is not optional.
- Skip the twist. A film that is only a copy is refused by the style critic.

## Measure the production language too (overlay_scan)
`python tools/reference/overlay_scan.py <video> [...]` measures plates on screen, their vertical bands, cut rate and shot lengths, camera still/drift/move and push/pull shares, tempo and how many cuts land on a beat. Seven reference reels measured this way are in `reference-library/overlay-scan/` and summarised in `docs/OVERLAY-GRAMMAR.md`. Use the numbers as the bar to beat, and `library.mjs match` to turn the tempo into a music block.
