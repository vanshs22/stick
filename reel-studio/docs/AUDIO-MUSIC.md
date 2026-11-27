# Audio: voice, music, sound effects, mix

All of it is code, free and local. The voice is the part a viewer judges first; then sound effects tied to the picture; then music that matches the field and the tempo of what works.

## 1. Voice engines (`audio/audio-plan.json` `voice.engine`)
| engine | quality | speed here (CPU) | emotion | clone | install |
|---|---|---|---|---|---|
| `kokoro` (default) | clear, neutral narrator; the most accurate on numbers and names | real time or faster | shaped prosody: speed, pitch, level, pauses, tremor, edge per emotion | no | `install.sh` |
| `chatterbox` (MIT) | more human, expressive, real emotion control | about 4 to 10 s of compute per second of speech (a GPU: about 10x faster) | `exaggeration` per emotion (measured: excited median pitch 167 Hz vs calm 125 Hz, pitch range 125 vs 71 Hz) | yes, from a 6 to 15 s clean clip of YOUR voice (`voice.ref`, per speaker `voice.refs`) | `install.sh --with-voice2` (2.5 GB) |
Choose Kokoro for fast narration and tutorials, Chatterbox for stories, dialogue and anything where feeling matters, and a reference clip of a real person for a channel voice. Orpheus 3B and Dia are better still on a GPU but heavier than this toolkit ships; both can be added as another engine in `voice.py` the same way `chatterbox_main` is.
Emotions (both engines): neutral calm happy excited sad fear shock anger sarcastic whisper determined curious proud. Put `emotion` and `speaker` on script lines; give two speakers two different voices (Kokoro `cast` voices, or Chatterbox `refs`). Use at least three emotions per story and punctuation to steer pacing (commas breathe, dashes cut, "..." hangs).
The timings are measured, not estimated: faster-whisper aligns the words, so captions, overlays and sound effects land on the real spoken word.

## 2. Music: relevant, not generic
Three ways, in order of preference:
1. **A real CC0 or licensed track that fits.** `node tools/audio/library.mjs music "lofi chill" --dir <P> [--allow-by]` downloads CC0 / public-domain (CC BY with `--allow-by`, credit then written to the manifest) tracks with source, creator, licence, tempo and genre guess in `assets/music/manifest.json`. Put it in the plan: `"music":{"bed":"file","file":"assets/music/<id>.mp3"}`; `mix.py` carves 2.2 kHz for the voice and adds low-end body.
2. **A genre bed built for THIS film**, tuned to the tempo of what works: `"music":{"bed":"genre:phonk@140"}` (`lofi phonk trap corporate cinematic synthwave house`), with drums (synthesised kick, snare, clap, hat, cowbell), bass or 808, chords, plucks, reverb, side-chain ducking, and an arc (intro, build, drop, outro; `music.arc`, `music.key`, `music.seed`). Measured by `tools/selftest_music.mjs` (tempo, audible beat, low and high balance, no clipping).
3. **Your own licensed track.** The toolkit never downloads or re-uses a commercial track without a licence.
**Finding what is trending in your niche:** `node tools/audio/library.mjs trend "claude code tutorial" --n 8 --dir <P>` lists the top short videos of the niche (title, views) and, when YouTube allows the audio samples (on your machine: `--cookies-from-browser chrome`), the tempo and genre of what they use; the audio is deleted after analysis. For reference reels you have, `python tools/reference/overlay_scan.py` measures tempo, how many cuts land on a beat and the loudness curve. `library.mjs match <trend-profile.json|scan.json ...>` prints the `music` block (genre and bpm) for your plan. Measured on the seven reference reels: 86 to 140 bpm (a narrated explainer sits at 86 to 105, a fast skit at 126 to 140), and only 17 to 47 percent of cuts land on a beat in voice-led films: cut on the voice's emphasis, use the beat for montage.

## 3. Sound effects
Two layers:
- **Procedural** (26 sounds: pop, tick, swish, whoosh, stamp, thud, riser, ding, type, count, zap ...): always available, tied to events (`shot.sfx[{type, anchor, gain}]`, transitions, overlay entries). Level table in `mix.py`; a sub layer is added under impacts.
- **Recorded** (CC0): `node tools/audio/library.mjs sfx whoosh --n 4 --dir <P>`, then `{"type":"file:assets/sfx/<id>.mp3","anchor":"word","gain":0.5}` in a shot's `sfx`. A real recording beats a synthetic one for whooshes, impacts, ambience and foley; use procedural for UI sounds (ticks, pops).
Rules: every sound belongs to a visual event (`build_cues.mjs` records which); one sound per entry; gain 0.3 to 0.5 for UI, 0.6 to 0.9 for impacts; sound effects sit 6 to 9 dB under the voice; no two plates on one frame with two sounds; the music ducks 55 percent under speech.

## 4. Mix and checks
`mix.py`: voice normalised to -19 dB RMS, music at -14 dB (-20 without voice) ducked under speech, effects, stereo width (the high band delayed 9 ms), a soft limiter to -1 dBFS, then the master is normalised to -14 LUFS by final QA. Critics: `voice`, `music`, `sfx`, plus `audio/ears.py` (measures and prepares a listening checklist) and optional `earshot` (AI listening). They measure; a person (or you, if you can hear) decides taste.
