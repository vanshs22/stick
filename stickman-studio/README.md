# Stickman Studio

Plain script in, finished narrated + captioned vertical video out. Local voice (Kokoro), local timing (Whisper), local render
(headless Chrome + FFmpeg). **No AI credits.**

```bash
bash make.sh examples/horror-dispatch.txt --style auto --name my-horror     # style picked from the story
bash make.sh script.txt --style cozy-cafe --name my-cafe                    # or choose one
bash make.sh --styles                                                       # list saved styles
bash make.sh script.txt --style amber-noir --name test --draft              # faster, lower quality
```

Output: `projects/<name>/renders/<name>.mp4`, plus `review/sheet.jpg` (contact sheet), `plan.json` (what the director decided)
and `director.log` (hook / pacing / structure report).

## How it works

1. **Director** (`director/director.mjs`, rules in `director/lexicon.json`) reads the script and decides, per beat:
   emotion + intensity, story arc (hook / build / peak / resolve / end), location, time of day, weather, who is on screen,
   clothes by role (police, doctor, thief, ghost...), pose from the verbs, shot type (wide / medium / two / close / insert),
   camera move, transition, prop insert (clock, phone, money, door, letter, bulb), kinetic keyword, rule cards, sound cues.
   It also splits long sentences, trims filler words, and reports a weak hook, flat emotion or no ending loop.
2. **Style** (`styles/*.json`) sets palette, character look, captions, camera, pacing, grade, voice and music.
3. **Engine** (`engine/`) draws every frame as a function of time: rigged characters (blink, brows, lip-sync to word timings,
   FK legs), perspective rooms, corridors, street/forest scenery with parallax, weather, lightning, flicker, colour grade.

## Saved styles (from the reference videos in `refs/`)

| id | look | from |
|---|---|---|
| `cartoon-comedy` | bright city/room, skin-tone heads, white gloves, bubbles | railway, "rich", "think ahead" shorts |
| `historical-cartoon` | warm earth tones, deep parallax, white heads, mitten hands | style-5 Japan |
| `amber-noir` | black faceless head, orange hoodie, plum/amber night | style-6 flow + MCP |
| `cozy-cafe` | washed pastel, white head, thin limbs, soft light | style-4 cafe |
| `meme-painted` | peach/red/teal, blush cheeks, period coats, fast cuts | b6 Eiffel |
| `dispatch-thriller` | navy night office, headset, rule cards, tension music | b4 dispatch |
| `safety-explainer` | grey-blue rooms, bubbles, yellow hook card | first elevator video |

### Add a style from a new reference video
```bash
python refs/analyze_style.py my-ref.mp4                       # measures palette, cuts/10s, saturation, motion
python refs/new_style.py refs/my-ref.measure.json my-style --base cartoon-comedy
```
Then tune `styles/my-style.json` (character, captions) by eye. `refs/fetch_ref.sh <url> <id>` does both and downloads with
yt-dlp, but YouTube blocks the sandbox ("confirm you're not a bot"): upload the file instead, or pass cookies.

## Writing scripts that work
The director decides how it looks; the words still decide whether it is good. Hook in the first line (question, shock or rule,
11 words or fewer), one idea per line, a turn at about 70 percent, and end on a question or callback. Keep it to 60-90 words
for a 30-40 s Short. `director.log` tells you when a rule is missed.

## Known limits
- The director is keyword rules, not language understanding: sarcasm, metaphors and unusual settings fall back to defaults.
  Add words to `lexicon.json` to teach it.
- Look is vector/cel-shaded with perspective and lighting. It is not the painted AI-image look of the style 5/6 references.
- Eight named locations exist (room, bedroom, office, cafe, kitchen, hallway, street, outdoor, forest, elevator).
- Two to three characters per story; hands cannot yet hold arbitrary props.

## Style families (reference-video styles)

`bash make.sh --styles` lists every style. A style's `family` picks the renderer:

| family | styles | what it is | cost (24 s clip, `--fast`, 8 cores) |
|---|---|---|---|
| stick | cartoon-comedy, amber-noir, cozy-cafe, historical-cartoon, meme-painted, dispatch-thriller, safety-explainer | 3D stickman story | 3 to 5 min |
| editorial | editorial-explainer | paper background, illustrated presenter, explainer cards, red italic keyword (refs 5, 6) | about 80 s |
| facecam | facecam-explainer | your own talking-head clip + cards + serif keyword pops. `bash make.sh clip.mp4 --video clip.mp4` | about 90 s |
| lowpoly | lowpoly-office | low-poly night office, AI helper creatures, dialogue captions (refs 1, 4) | 3 to 4 min |
| voxel | voxel-explainer, voxel-studio | voxel presenter + creature, step chip, cards (refs 7, 2) | 3 to 4 min |
| blocky | blocky-town | Roblox-style world, one yellow word at a time (ref 8) | 3 to 4 min |

Every family uses the same plan (director -> optional LLM -> finish), so rules and LLM give the same fields.
`node director/parity.test.mjs` checks this. Sounds per visual event: swish/whoosh at cuts and colour changes, pop on cards,
tick on steps, type on terminals, stamp, ding on the comment pill, count on numbers. Music beds: bed, tension, upbeat.
Reference analysis: `refs/REFERENCE-VIDS.md`. Competitor research (Agent-Reach): `node research/competitors.mjs "topic"`.
