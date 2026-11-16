---
name: audio-production
description: Plans and produces the audio - voice selection and pronunciation, narration with word timing, music direction, sound effects tied to visual events, mixing and loudness - and criticises the real audio. Use for the voice stage, the sound plan and the audio critic.
---

# Audio production

## Plan (`audio/audio-plan.json`, schema `audio-plan`)
- Voice: Kokoro voices (`python3 $TK/tools/audio/voice.py --list`), or `own-recording`, or `captions-only`. Speed 1.0-1.2 for fast explainers, 0.92-1.0 for calm or noir.
- Pronunciations for names and acronyms: `{"GPU":"G P U","Kokoro":"koh-koh-roh"}` (only the voice changes; captions keep the real spelling).
- Music: `bed` (soft chords), `upbeat` (112 BPM pluck groove), `tension` (drone), `none`, or `file` (a royalty-free file with its licence in the manifest). Pick by mood: explainer = upbeat, mystery = tension, calm = bed. `gain_db` relative (default 0; -3 if it competes with the voice).
- Delivery: `target_lufs` -14, `true_peak_db` -1.5 (social). Voice must stay clear: music ducks under speech automatically.

## Voice stage (gate: let the user hear it)
1. `node $TK/tools/audio/build_tts_input.mjs $P`
2. Sample first: voice a 2-line test, give the user the file, let them change voice or speed.
3. Full voice (from `$P`): `TTS_SCRIPT=data/tts.json python3 $TK/tools/audio/voice.py . && TTS_SCRIPT=data/tts.json python3 $TK/tools/audio/words.py .`
   Own recording: `TTS_SCRIPT=data/tts.json python3 $TK/tools/audio/words.py . --audio <file>`. Captions-only: `estimate.py .`.
4. Read `data/words.txt`: check numbers, names and pauses. Fix pronunciations and redo only if wrong.
5. `node $TK/tools/timing/build_timeline.mjs $P` (stop on any error it prints), `node $TK/tools/audio/build_cues.mjs $P`, `TTS_SCRIPT=data/tts.json python3 $TK/tools/audio/mix.py .`

## Sound design
Each effect is attached to a visual event through the storyboard (`sfx`, `transition_out.sound`): pop for a card appearing, tick for step numbers, type for typing, stamp for a verdict, ding for the call to action, count for counters, whoosh/swish for movement and cuts, thud/slam for impacts. Not every cut needs a sound; every sound needs a visual reason. Repeats of the same effect within 2 s sound cheap.

## Audio critics (write `review/audio-critic.json`, critic `audio`)
Run `node $TK/tools/qa/audio_check.mjs $P/data/mix.wav` and judge by the numbers and by `cues.json`:
- Voice critic: pronunciation of every name, pauses at commas, no clipped words, delivery matches the mood.
- Music critic: mood fits; never masks speech (voice at least 12 dB above music while talking); it fades out at the end.
- SFX critic: each sound has a visual cause; no more than 4 in a second; levels soft (nothing harsh above 5 kHz); no identical effect twice within 2 s.
- Mix: loudness within 1.5 LUFS of target, true peak <= -1.0, no clipping, no silence over 1.5 s.
Findings use `fix_target` audio (re-run mix) or storyboard (move/remove a sound).

Official rules: `node $TK/tools/rs.mjs audio audio-visualization sfx voiceover silence-detection`. Our mix is built outside Remotion (`mix.py`) and played as one `<Audio>` track from `@remotion/media`; use `audio-visualization` for waveforms and bars that react to the real audio, and `silence-detection` to trim dead air from an own recording.

## Tools (v2)
- Previews before approval: `node $TK/tools/audio/preview_audio.mjs $P [--voices am_michael,af_heart] [--speeds 1.0,1.1] [--pron "ffmpeg=eff eff em peg"]` makes short voice samples, music beds and the sound-effect set, so the user can hear the choices. The user chooses voice, speed, delivery, pronunciations, music (or none) and sfx direction: `node $TK/tools/choose.mjs $P voice --voice am_michael --speed 1.05 --pace calm|brisk --music bed|upbeat|tension|none --sfx soft|none|punchy --pron "word=spoken form"`, stored in `audio/audio-plan.json`.
- Every sound effect belongs to an event: `build_cues.mjs` records shot + event for each cue; the sfx critic flags a sound with no event.
- `node $TK/tools/critique.mjs $P audio` measures clipping, silences, whether a speech recogniser hears what the script says, music level under the voice (voice should be 8 to 30 dB above), headroom and sfx density. You cannot hear: say that taste (warmth, mood fit) needs the user's ears.
