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
