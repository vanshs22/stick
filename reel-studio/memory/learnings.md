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
