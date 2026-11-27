#!/usr/bin/env node
// script/script.json + audio/audio-plan.json  ->  data/tts.json, the input format of voice.py / words.py / mix.py / estimate.py.
//   node tools/audio/build_tts_input.mjs <projectDir>
// Then (from the project folder, with TTS_SCRIPT=data/tts.json):
//   Kokoro voice : python tools/audio/voice.py . && python tools/audio/words.py .
//   own recording: python tools/audio/words.py . --audio my_voice.m4a
//   captions only: python tools/audio/estimate.py .
import fs from 'node:fs';
import path from 'node:path';
import { autoDirect, pauseMap } from '../lib/direct.mjs';

const P = process.argv[2]; if (!P) { console.error('usage: build_tts_input.mjs <projectDir>'); process.exit(2); }
const rd = (f) => JSON.parse(fs.readFileSync(path.join(P, f), 'utf8'));
// The storyboard stage needs timing (estimated is fine) before the audio gate exists: write a DRAFT plan the user has not chosen.
if (!fs.existsSync(path.join(P, 'audio/audio-plan.json'))) { fs.mkdirSync(path.join(P, 'audio'), { recursive: true }); fs.writeFileSync(path.join(P, 'audio/audio-plan.json'), JSON.stringify({ voice: { engine: 'kokoro', voice: 'af_heart', speed: 1.0, pronunciations: {} }, music: { direction: 'light', bed: 'bed', gain_db: 0 }, mix: { target_lufs: -14, true_peak_db: -1.5 }, status: 'DRAFT defaults for timing only: the user has not chosen voice, music or sound yet' }, null, 1)); console.error('audio/audio-plan.json missing: wrote a DRAFT plan (defaults). The audio gate is still open.'); }
const script = rd('script/script.json'), plan = rd('audio/audio-plan.json'), m = plan.music || {};
// Casting: script.cast {name:{gender,tone?,voice?}} + line.speaker + line.emotion. The narrator (no speaker) keeps the plan's voice.
// A character gets a voice of ITS gender (never a male voice for a female role); two characters never share a voice.
const GENDER = (v) => (/^[ab]f_/.test(v) ? 'female' : /^[ab]m_/.test(v) ? 'male' : null);
const TONE = { female: { warm: 'af_heart', bright: 'af_bella', soft: 'af_nicole', playful: 'af_sky', calm: 'bf_emma', clear: 'af_sarah', young: 'af_sky' }, male: { steady: 'am_michael', friendly: 'am_adam', playful: 'am_puck', deep: 'am_fenrir', low: 'am_onyx', documentary: 'bm_george', storyteller: 'bm_fable', young: 'am_puck' } };
const POOL = { female: ['af_heart', 'af_bella', 'af_nicole', 'af_sarah', 'af_sky', 'bf_emma'], male: ['am_michael', 'am_adam', 'am_puck', 'am_fenrir', 'am_onyx', 'bm_george'] };
const narrator = plan.voice.voice || 'am_michael', cast = script.cast || {}, overrides = plan.voice.cast || {}, used = new Set([narrator]), voiceOf = {}, errs = [];
for (const [name, c] of Object.entries(cast)) {
  let v = overrides[name] || c.voice || (TONE[c.gender] || {})[c.tone];
  if (!v || (used.has(v) && !overrides[name] && !c.voice)) v = POOL[c.gender]?.find((x) => !used.has(x));
  if (!v) { errs.push(`cast "${name}": no free ${c.gender} voice left (give one with voice:)`); continue; }
  if (GENDER(v) && GENDER(v) !== c.gender) errs.push(`cast "${name}" is ${c.gender} but voice ${v} is ${GENDER(v)}: pick a ${c.gender} voice`);
  if (used.has(v)) errs.push(`cast "${name}" would share voice ${v} with another speaker: every character needs its own voice`);
  used.add(v); voiceOf[name] = v;
}
for (const l of script.lines) if (l.speaker && !cast[l.speaker] && !/^narrator$/i.test(l.speaker)) errs.push(`line ${l.id}: speaker "${l.speaker}" is not in script.cast`);
if (errs.length) { console.error('casting problems:\n- ' + errs.join('\n- ')); process.exit(1); }
// Direction: a script with NO emotions gets an emotional arc from its beats, punctuation and words, and varied pauses, so the narration is never read flat.
// Your own `emotion` / `pause_after` always win. `"delivery": "flat"` in script.json switches this off (a deliberately deadpan read).
const flat = script.delivery === 'flat', auto = !flat && !script.lines.some((l) => l.emotion) ? autoDirect(script.lines) : null, pauses = flat ? null : pauseMap(script.lines);
if (auto) fs.writeFileSync(path.join(P, 'audio/direction.json'), JSON.stringify({ note: 'emotions were assigned automatically because the script had none: write your own `emotion` per line to direct the voice yourself', lines: script.lines.map((l, i) => ({ id: l.id, emotion: auto[i], pause_after: pauses[i] })) }, null, 1));
const tts = { voice: narrator, speed: plan.voice.speed || 1.05, lead: 0.3, outro: 1.0, gap: 0.25,
  engine: plan.voice.engine === 'chatterbox' ? 'chatterbox' : undefined, ...(plan.voice.ref ? { ref: plan.voice.ref } : {}), ...(plan.voice.refs ? { refs: plan.voice.refs } : {}), music: m.bed === 'file' ? (m.file || 'none') : (m.bed || 'bed'), musicDb: m.gain_db || 0, ...(m.key ? { musicKey: m.key } : {}), ...(m.arc ? { musicArc: m.arc } : {}), ...(m.seed != null ? { musicSeed: m.seed } : {}), pron: plan.voice.pronunciations || {},
  lines: script.lines.map((l) => ({ id: l.id, text: l.tts_text || l.text, ...(l.pause_after != null ? { gap: l.pause_after } : pauses ? { gap: pauses[script.lines.indexOf(l)] } : {}), ...(l.emphasis?.length ? { emphasis: l.emphasis } : {}), ...(l.speaker && voiceOf[l.speaker] ? { voice: voiceOf[l.speaker], speaker: l.speaker } : {}), ...((l.emotion || auto?.[script.lines.indexOf(l)]) && (l.emotion || auto[script.lines.indexOf(l)]) !== 'neutral' ? { emotion: l.emotion || auto[script.lines.indexOf(l)] } : {}) })) };
if (Object.keys(voiceOf).length) fs.writeFileSync(path.join(P, 'audio/casting.json'), JSON.stringify({ narrator, cast: Object.fromEntries(Object.entries(voiceOf).map(([n, v]) => [n, { voice: v, gender: cast[n].gender }])) }, null, 1));
fs.mkdirSync(path.join(P, 'data'), { recursive: true }); fs.writeFileSync(path.join(P, 'data/tts.json'), JSON.stringify(tts, null, 1));
console.log(`data/tts.json: ${tts.lines.length} lines, voice ${tts.voice}${Object.keys(voiceOf).length ? ' + cast ' + Object.entries(voiceOf).map(([n, v]) => n + '=' + v).join(', ') : ''} x${tts.speed}, music ${tts.music}. Run the voice tools with TTS_SCRIPT=data/tts.json`);
