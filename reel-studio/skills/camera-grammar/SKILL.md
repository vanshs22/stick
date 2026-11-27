---
name: camera-grammar
description: The camera and cut decisions that apply to EVERY style and format (vertical Shorts, 16:9 long-form, 2D cards, 3D). Use before storyboarding any video: lens feel, angles, framing, moves tied to words, shot length per cadence profile, vertical and landscape safe areas, and what each style may or may not do.
---

# Camera grammar (common to every style)

A style decides the LOOK. These decisions are the same for all of them; a style only picks a **cadence profile** (`style.json` "cadence", data in `profiles.json`): beat-short, cutaway-short, kids-song, film-cinematic, longform-calm, explainer-2d. `tools/check_storyboard.mjs` compares the real shot lengths with that profile once the timeline exists; `tools/ink/plan.mjs` does the same for beat plans.

## Decisions every video makes
1. **The picture changes only when the story needs a new picture**: a new subject or speaker, a reaction, a punchline, a place or time change, or the profile's cadence demands a visible change. A cut or move never fills silence.
2. **Every move is anchored to a word** (or a musical beat for songs), starting about 0.2 s before it. Plan from word timings, never type seconds.
3. **Every framing reads at first glance**: one subject, the face visible and big enough, a bright high-contrast focal point, nothing covering the face.
4. **Lens feel**: wide-ish lens for sets (vertical fov 60-80 in a vertical frame, about 40-55 in 16:9), low hero angles about 40 percent of shots, 3/4 faces (never dead frontal), longer lenses for intimate close-ups, dutch only 2-6 degrees inside a move. Reframing 16:9 to 9:16: vertical fov x1.4, subject up to 30-45 percent of the height.
5. **Depth**: something near the lens in about half the shots, three depth layers in a set, a practical light in every frame. A foreground object frames a shot but never sweeps across the subject during a move.
6. **Alternate**: wide establishing, medium of the character, close or macro on the thing that matters. One anchor object per location; few locations, many framings.
7. **Facts are objects**: a number or label painted on the thing it is about (sound-off readable), never over a face, about one primary tag per 15 s in Shorts.
8. **Safe areas**: 9:16 captions at 70 percent height, faces at 30-45 percent; 16:9 titles in the central 90 percent, lower third for subtitles; long-form ships an SRT instead of burned-in captions.
9. **Physical plausibility**: the camera never inside geometry, never beyond a set edge, never above a missing ceiling; check the whole move, not the keys.
10. **Keep the 180 degree line** in dialogue; reverse shots keep eye lines.
11. **Retention**: re-hook each sequence with a strong picture, land visual gags on the punchline, give the last line a visual payoff.
12. **Look at the contact sheet before the critics** (three frames per shot show the move).

## Profiles (what a style picks)
| cadence | shot length | camera events/min | use |
|---|---|---|---|
| beat-short | 1.5-6 s | 48-66 | vertical beat-driven 3D (inkbeat) |
| cutaway-short | 2-4 s | 20-36 | curiosity-loop with cutaways, punch-ins on key words (zackd-cutaway) |
| kids-song | 2-4 s on the music beat | 14-30 | toddler songs, 16:9 long-form (kidsong-3d); gentle only, no whips, shake or flashing |
| film-cinematic | 3-8 s | 8-22 | held frames, motivated moves (anime-cinematic, pixar-soft, noir) |
| longform-calm | 3-6 s | 12-24 | calm explainers and talking heads, classic coverage |
| explainer-2d | 1.5-4 s | n/a | 2D cards and diagrams: a visible change every 1.5-3.5 s |

Moves and amounts (all profiles, scale by cadence): PUSH 12-15 percent of the distance, PULL 16-22, MACRO 30, ORBIT 15-25 degrees, CRANE and DOLLY a quarter of the distance, TILT 14, PUNCH 8-15 percent in 6 frames; a move between distant framings takes 0.85-1.0 s. Details and the beat rig: `skills/inkbeat/references/camera-and-editing.md`.

## Layouts: every style works in portrait (9:16) and landscape (16:9)
Set `"aspect": "16:9"` (or `"9:16"`) in `brief.json` (or pick a platform: youtube, linkedin and x are 16:9). The frame size flows from there: timeline, Remotion composition, safe zones, captions, presenter, overlays, QA and the 4K export all follow it. Look at the other layout before committing: `node tools/other_layout.mjs <project> [--aspect 16:9]` (stills in `review/layout-16x9/`, the project is not touched).
- **Safe zones**: portrait keeps the style pack's `safe_zone` (px on 1080x1920). Landscape derives them from the height (content between 14 and 78 percent, or from 25 percent when the `headline` caption sits on top; captions at 80 percent) and a pack may set `safe_zone_landscape`. Fonts keep their pixel size because both layouts have a 1080 px short side.
- **Cards are wide in landscape**: the browser window, terminal, proof card, notebook page, map, timeline, versus and flow diagram take landscape shapes (`LY` in `engine/tokens.ts`); a card is scaled to fill the content zone (up to 1.15x) or shrunk to fit. A proof card takes the picture's own shape, so the circle stays on what it circles. Cards that have no landscape shape yet (lists, evidence variants, phone) are centred and shrunk to fit.
- **Captures follow the layout**: `capture_web.mjs --project <P>` uses a 780x426 page for 16:9 (480x486 for 9:16); `acceptance.mjs ... --aspect 16:9` re-captures, and `tools/sync_highlights.mjs` moves each circle to where its capture recorded the element.
- **Presenter packs**: in landscape the host stands on the left and the cards take the right 60 percent.
- **Overlay positions**: fractions of the frame (-2 to 2) work in both; px authored on the portrait canvas are mapped onto the card the shot drew, so a tag stays on the same part of its card. Step labels sit in a band above the content zone.
- **Lens**: cameras are authored for one layout; for the other, multiply the vertical fov by 1.4 going to portrait (divide going to landscape) and keep faces at 30-45 percent of the height in portrait. The inkbeat renderer does this itself (`looks.mjs --layout L,P`, `Story`).
- **Captions**: burned-in captions work in both layouts (the `headline` preset moves to the top-left with smaller type); long-form 16:9 normally ships an SRT instead (the inkbeat plan writes `captions.srt`).
- **Photos and checks**: `fetch.mjs` checks sharpness against the project's frame, final QA checks the delivery size and caption band per layout, `picture_quality` works on any aspect.
