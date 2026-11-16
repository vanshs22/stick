#!/usr/bin/env node
// script/script.json + audio/audio-plan.json  ->  data/tts.json, the input format of voice.py / words.py / mix.py / estimate.py.
//   node tools/audio/build_tts_input.mjs <projectDir>
// Then (from the project folder, with TTS_SCRIPT=data/tts.json):
//   Kokoro voice : python tools/audio/voice.py . && python tools/audio/words.py .
//   own recording: python tools/audio/words.py . --audio my_voice.m4a
//   captions only: python tools/audio/estimate.py .
import fs from 'node:fs';
import path from 'node:path';

const P = process.argv[2]; if (!P) { console.error('usage: build_tts_input.mjs <projectDir>'); process.exit(2); }
const rd = (f) => JSON.parse(fs.readFileSync(path.join(P, f), 'utf8'));
// The storyboard stage needs timing (estimated is fine) before the audio gate exists: write a DRAFT plan the user has not chosen.
if (!fs.existsSync('audio/audio-plan.json')) { fs.mkdirSync('audio', { recursive: true }); fs.writeFileSync('audio/audio-plan.json', JSON.stringify({ voice: { engine: 'kokoro', voice: 'af_heart', speed: 1.0, pronunciations: {} }, music: { direction: 'light', bed: 'bed', gain_db: 0 }, mix: { target_lufs: -14, true_peak_db: -1.5 }, status: 'DRAFT defaults for timing only: the user has not chosen voice, music or sound yet' }, null, 1)); console.error('audio/audio-plan.json missing: wrote a DRAFT plan (defaults). The audio gate is still open.'); }
const script = rd('script/script.json'), plan = rd('audio/audio-plan.json'), m = plan.music || {};
const tts = { voice: plan.voice.voice || 'am_michael', speed: plan.voice.speed || 1.05, lead: 0.3, outro: 1.0, gap: 0.25,
  music: m.bed === 'file' ? (m.file || 'none') : (m.bed || 'bed'), musicDb: m.gain_db || 0, pron: plan.voice.pronunciations || {},
  lines: script.lines.map((l) => ({ id: l.id, text: l.text, ...(l.pause_after != null ? { gap: l.pause_after } : {}) })) };
fs.mkdirSync(path.join(P, 'data'), { recursive: true }); fs.writeFileSync(path.join(P, 'data/tts.json'), JSON.stringify(tts, null, 1));
console.log(`data/tts.json: ${tts.lines.length} lines, voice ${tts.voice} x${tts.speed}, music ${tts.music}. Run the voice tools with TTS_SCRIPT=data/tts.json`);
