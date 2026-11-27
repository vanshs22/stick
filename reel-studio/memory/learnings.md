# Lessons learned (the agent reads this first and appends after every video)

Format: `- [style or area] what went wrong or right -> what to do`.

- [3D] A scene rendered with no output gamma/tone mapping looked near-black; always check median luma of stills (tools/qa/frame_stats.mjs) before rendering the full video.
- [3D] Camera inside a light cone or behind a wall gives a dead frame; use a wide lens (fov 55+) in dark rooms.
- [timing] Visuals timed in raw seconds break when the voice changes; anchor every entrance to a spoken word.
- [sound] Sounds that are not tied to a visual event feel random; no more than 4 in a second; no identical effect twice within 2 s.
- [captions] Captions over a face or the key visual hide the point; move the shot, not the captions.
- [evidence] A drawn fake of a real page destroys trust; capture the real page or say it could not be captured.
- [script] Opening with context ("Today we talk about...") loses the viewer; open with the point.
- [QA] Never call a video done without looking at a contact sheet of the final render.
- [capture] A desktop-width screenshot makes evidence text about 14 px on screen -> capture with `--viewport 480x486 --scale 2`; scroll to the number you quote and prove it with `--expect`.
- [3D poses] `explain` from a three-quarter camera puts the hands over the face -> use `explain-wide` while speaking, and look at the still.
- [3D framing] Critters and thick-armed voxel/blocky characters crop or get covered at medium-close-up -> use medium or wider.
- [captions] With an illustrated host the captions must sit above the host's head (pack safe_zone.caption_y), not at the default 1440.
- [review] Evidence and build-up cards must be previewed in their finished state, not at 70 percent of the shot (tools/preview_shots.mjs does this; `preview_at` overrides).
- [cinematography] Keep az on one side between consecutive shots and change framing a step or the angle 30 degrees; a move that outlasts its shot is rejected.
- [styles] Showing one script in many styles: use tools/style_sheets.mjs, never hand-copy shots; open every overview.jpg.

## Production toolkit pass (what the 3D films and the 25 s test taught)
- Render order that saves time: preview at --scale 0.5, fix, one full render. 3D shots are about 3 minutes each without a GPU; 2D films about a minute.
- QA thresholds must match the style pack: captions live between y 180 and 1500, not inside the content area (180-1380).
- One-word captions under 0.2 s are unreadable; the timeline builder merges them.
- `import()` of a file path needs a `file://` URL on Windows; `npm`/`npx` need a shell; directory links need junctions. CI on all three systems finds these, Linux alone cannot.
- Do not trust "pass" without looking: the critics passed a film with the wrong face on one speaker.
- Approval gates: five is the most a person will tolerate (direction, script_review, storyboard_review, sound_review, final). Everything else is tool-enforced work, not a question. Production readiness runs automatically inside build_video.
- A pass is not quality: critics passed blurred films with no music. Guards now measure the picture (crisp blocks), the music (audible bed) and the sfx count, and fail the export.
- Measure before "fixing" audio: three of five polish steps made the voice LESS real. Keep what the meter rewards.
- Earshot metrics have a domain: salient-hit density is not meaningful for narrated explainers.
- Vet downloaded music by listening with a model (AudioSet class), not by its title.
