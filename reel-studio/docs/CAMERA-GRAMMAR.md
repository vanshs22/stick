# Camera grammar: the master file (every engine, every format)

One grammar, five engines: 2D cards (Remotion), Stage3D (three.js), inkbeat (3D toon beat camera), photoreal plates (Blender), and real footage (Playwright B-roll). A style only picks a cadence profile (`skills/camera-grammar/profiles.json`); the rules below do not change. Short form for the agent: `skills/camera-grammar/SKILL.md`. Checked by `tools/check_cinematography.mjs` (the camera spec), the `video` critic (measured cut rate, unplanned cuts) and the vision critic `camera`.

## 1. The twelve decisions (every film)
1. The picture changes only when the story needs a new one: a new subject, a reaction, a punchline, a place or time change, or the profile's rhythm for a song.
2. Every move is anchored to a word, starting about 0.2 s before it. Plan from the word timings.
3. A framing reads at first glance: one subject, a face big enough, a bright focal point, nothing important behind captions or platform buttons.
4. Lens feel: wide-ish for sets (vertical fov 60 to 80 in 9:16, 40 to 55 in 16:9), 85 to 95 for a low hero angle, 35 to 50 for a close-up. Photoreal plates use real focal lengths (below).
5. Depth: something near the lens in about half of the shots; three depth layers in a set; a practical light in every frame.
6. Alternate wide establishing, medium of the character, close or macro on what matters; few locations, many framings.
7. Facts are objects: a label on the thing it names, never over a face.
8. Safe areas: 9:16 captions at 70 percent height, faces at 30 to 45 percent; 16:9 titles in the central 90 percent.
9. Physical plausibility: the camera is never inside geometry or beyond a set edge.
10. Keep the 180 degree line in dialogue; reverse shots keep eyelines.
11. Retention: re-hook each sequence with a strong picture, land visual gags on the punchline, give the last line a visual payoff.
12. Look at the contact sheet before the critics: three frames per shot show the move.

## 2. The shot ladder (use the same words in every storyboard)
| framing | shows | use for | lens (16:9 / 9:16 vertical fov) |
|---|---|---|---|
| extreme close-up | an eye, a hand, a detail | one emotional beat, a macro on an object | 28 / 40 |
| close-up | head and shoulders | a line that matters, a reaction | 35 / 45 |
| medium close | chest up | dialogue | 40 / 55 |
| medium | waist up | explaining, gesture | 45 / 60 |
| wide | full body in the set | action, context | 55 / 70 |
| establishing | the whole place | start of a scene | 60 / 80 |
| insert | a prop or a screen | evidence, a detail | 30 / 45 |
| over-the-shoulder | the listener's shoulder in front | a two-person conversation | 40 / 55 |
Angles: eye level (honest), low (power, 40 percent of hero shots), high (weakness, small, 20 percent), dutch 2 to 6 degrees only inside a move. Screen direction: a character moving right keeps moving right until a reason (a cut on action) turns them.

## 3. Moves and what they mean
| move | meaning | amount | duration | profile / curve |
|---|---|---|---|---|
| push-in (dolly in) | attention, tension, a decision | 8 to 15 percent of the distance | 1.5 to 4 s | ease-in-out, sine |
| pull-out | revelation, loneliness, an ending | 15 to 22 percent | 1.5 to 3 s | ease-out |
| truck / track | following, comparing | a quarter of the distance | 1 to 3 s | linear to ease |
| crane up / down | scale, a place change | 10 to 25 percent | 2 to 4 s | ease-in-out |
| orbit / arc | reveal a form, a threat | 15 to 25 degrees (8 degrees on a parallax plate) | 2 to 4 s | ease-in-out |
| rack focus | move attention without cutting | focus pull 0.4 to 0.8 s | | |
| whip pan | a hard transition, energy (beat styles only) | 25 percent | 6 frames | in-cubic |
| punch-in | a punchline, a shock | 8 to 15 percent in 6 frames | | out-expo |
| handheld | documentary, tension | 0.2 to 0.4 amplitude | continuous | noise |
| static | calm, weight, a confession | | 2 to 6 s | |
Every move names: why, from, to, target, duration, profile, curve. A static shot is fine. Never a move for its own sake, never two moves in one shot unless one is a micro drift (3 percent per second).

## 4. Rhythm: cadence profiles, measured
From `skills/camera-grammar/profiles.json` and the seven reference reels (`docs/OVERLAY-GRAMMAR.md`, section 1): talking-head and dialogue reels cut every 2.3 to 4 s (13 to 19 per minute); designed explainers 4 to 6 s (9 to 13 per minute); a held film may stay 20 s on one shot if its graphics change; the camera is almost never fully still (0 to 6 percent of frames). A cut lands on the voice's emphasis for explainers and on the beat for montage. Never more than the profile's `max_hold` without a camera event or a new graphic.

## 5. Cuts and transitions
Cut on action or on a word; a cut changes angle by at least 30 degrees or the size by one step (no jump cut on the same framing); match-cut on shape or motion; a push-through (outgoing punches in over 3 frames, incoming lands over 8) for beat styles; dissolve only for a scene or time change; a transition always has a sound or a reason.

## 6. Photoreal plates: the lens, the light, the move
- **Lens:** product and object beauty 50 to 85 mm look (fov 24 to 38 on a 36 mm sensor), interiors 24 to 35 mm (fov 54 to 74), macro 100 mm (fov 20). `camera.fov` in the scene spec is the horizontal field of view.
- **Depth of field:** `fstop` 1.8 to 2.8 for a cinematic falloff, 5.6 for a documentary look; `focus` is the point that is sharp (rack focus = two keys with different `focus`).
- **Light:** one HDRI for the world and reflections, one warm key area light for direction (energy 200 to 400, size 2); fill from the HDRI. Contrast between key and shadow side about 3:1.
- **Move on a parallax plate:** push up to 12 percent, truck or orbit up to 8 degrees, crane up to 10 percent. Past that, render a Blender sequence (`photoreal.mjs sequence`). The plate has 12 percent overscan so edges never show.
- **Grade:** AgX, a little bloom (0.2 to 0.3) on highlights only, vignette 0.25 to 0.35, grain 0.01 to 0.015, chroma 0.002.

## 7. Real footage (Playwright B-roll)
A screen recording is a camera too: scroll with ease (1 to 1.6 s per screen), move the cursor in an arc, zoom to 1.25 to 1.4 on the thing named, hold the result for the reading time. `tools/capture/record_broll.mjs` does all three deterministically; beats are timed to anchor words.

## 8. Vertical and landscape
Vertical: faces in the upper 45 percent, captions at 70 percent, push-ins stronger (the frame is narrow). Landscape: a left column for a host or headline, cards on the right, captions in the lower band, slower moves, longer shots (3 to 8 s). See `docs/LONGFORM-LANDSCAPE.md`.

## 9. Checklist before the storyboard gate
Every shot names its framing and why; moves have a reason and a word; no two consecutive shots share framing and angle; the 180 line holds; every photoreal move is within the parallax limits or is a sequence; the first frame is never empty; the last shot pays off.
