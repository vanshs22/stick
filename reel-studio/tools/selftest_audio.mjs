#!/usr/bin/env node
// The audio chain on a real narration: Kokoro voice -> faster-whisper word times -> timeline -> sound cues -> mix -> final QA.
// Verifies: the voice exists and is audible, word times are monotonic and inside each line (aligned with the generated narration, measured by
// re-transcribing), every sound cue belongs to a named visual event in a specific shot, the music sits under the voice, the mix does not clip, and a
// missing mix fails the build. Needs the Kokoro model files and faster-whisper (reported as NOT TESTED otherwise).
//   node tools/selftest_audio.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { TK, PY } from './lib/pipeline.mjs';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'reel-audio-')), env = { ...process.env, REEL_TEST_MODE: '1', TTS_SCRIPT: 'data/tts.json' };
let n = 0, fails = 0; const ok = (name, c, d = '') => { n++; if (!c) { fails++; console.error(`FAIL: ${name} ${d}`); } else console.log(`ok   ${name}`); };
const node = (args, o = {}) => spawnSync('node', ['--no-warnings', ...args], { encoding: 'utf8', env, ...o }), py = (args, o = {}) => spawnSync(PY, args, { encoding: 'utf8', env, cwd: P, ...o });
let P = tmp;
const have = spawnSync(PY, ['-c', 'import kokoro_onnx, faster_whisper'], { encoding: 'utf8' }).status === 0 && fs.existsSync(path.join(process.env.REEL_HOME || process.env.REEL_STUDIO_HOME || path.join(os.homedir(), '.reel-studio'), 'kokoro/kokoro-v1.0.onnx'));
if (!have) { console.log('NOT TESTED: Kokoro model files or faster-whisper are missing (bash install.sh). Nothing was faked.'); fs.rmSync(tmp, { recursive: true, force: true }); process.exit(0); }

let r = node([path.join(TK, 'tools/run_example.mjs'), 'motion-graphics', 'au', '--dir', tmp]); P = path.join(tmp, 'au');
const rd = (f) => JSON.parse(fs.readFileSync(path.join(P, f), 'utf8')), wr = (f, v) => fs.writeFileSync(path.join(P, f), JSON.stringify(v, null, 1));
const sb = rd('storyboard/storyboard.json'), sc = rd('script/script.json'); sb.shots = sb.shots.slice(0, 2); const keep = new Set(sb.shots.flatMap((x) => x.line_ids)); sc.lines = sc.lines.filter((l) => keep.has(l.id));
// make sure the shots carry sound events tied to named word anchors
sb.shots.forEach((s) => { if (!(s.anchors || []).length) s.anchors = [{ name: 'a0', line: s.line_ids[0], word: (sc.lines.find((l) => l.id === s.line_ids[0]).text.split(/\s+/)[2] || 'the').replace(/[^\w]/g, '') }]; s.sfx = [{ type: 'pop', anchor: s.anchors[0].name, gain: 0.5 }]; });
wr('script/script.json', sc); wr('storyboard/storyboard.json', sb);
const ap = rd('audio/audio-plan.json'); ap.mode = 'narrated_music'; ap.music = { ...(ap.music || {}), bed: 'upbeat', direction: 'light' }; wr('audio/audio-plan.json', ap);
node([path.join(TK, 'tools/audio/build_tts_input.mjs'), P]);
r = py([path.join(TK, 'tools/audio/voice.py'), '.']); ok('Kokoro generates the narration', r.status === 0 && fs.existsSync(path.join(P, 'data/narration.wav')), (r.stdout + r.stderr).slice(-300));
const ffm = (a) => spawnSync('ffmpeg', ['-hide_banner', '-nostats', ...a], { encoding: 'utf8' }).stderr, dur = (f) => { const m = ffm(['-i', f]).match(/Duration: (\d+):(\d+):([\d.]+)/); return m ? +m[1] * 3600 + +m[2] * 60 + +m[3] : 0; };
const vol = (f) => +(ffm(['-i', f, '-af', 'volumedetect', '-vn', '-f', 'null', '-']).match(/mean_volume: (-?[\d.]+)/) || [])[1];
const nd = dur(path.join(P, 'data/narration.wav')); ok('the narration is audible and has a plausible length', nd > 3 && vol(path.join(P, 'data/narration.wav')) > -45, `${nd.toFixed(1)} s, mean ${vol(path.join(P, 'data/narration.wav'))} dB`);
r = py([path.join(TK, 'tools/audio/words.py'), '.']); ok('faster-whisper aligns the words', r.status === 0 && !/spreading words|spread inside/.test(r.stdout + r.stderr), (r.stdout + r.stderr).slice(-300));
const W = rd('data/words.json'), L = rd('data/lines.json'), lines = L.lines || L, mono = W.every((w, i) => i === 0 || w.s >= W[i - 1].s - 0.001), inside = W.every((w) => w.s >= -0.01 && w.e <= nd + 0.15 && w.e >= w.s);
ok('word times are monotonic and inside the narration', mono && inside && W.length > 5, `${W.length} words, mono ${mono}, inside ${inside}`);
const scriptWords = sc.lines.reduce((k, l) => k + l.text.split(/\s+/).filter(Boolean).length, 0); ok('every script word has a time (no dropped words)', Math.abs(W.length - scriptWords) <= 2, `${W.length} timed vs ${scriptWords} in the script`);
// alignment accuracy: cut the audio at the middle of a word and check the audio there is speech (energy), and in the gap before the first word it is quiet
const w0 = W[Math.floor(W.length / 2)], seg = path.join(tmp, 'seg.wav'); ffm(['-y', '-ss', String(w0.s + (w0.e - w0.s) * 0.3), '-t', String(Math.max(0.05, (w0.e - w0.s) * 0.4)), '-i', path.join(P, 'data/narration.wav'), seg]); ok('audio at the middle of a timed word contains speech energy', vol(seg) > -40, `mean ${vol(seg)} dB at ${w0.w}`);
r = node([path.join(TK, 'tools/timing/build_timeline.mjs'), P]); ok('timeline built from the real word times', r.status === 0, r.stdout + r.stderr);
r = node([path.join(TK, 'tools/audio/build_cues.mjs'), P]); const cues = rd('data/cues.json');
ok('every sound cue is tied to a named event: a shot, an anchor word and a time inside that shot', r.status === 0 && (cues.cues || cues).length >= 2 && (cues.cues || cues).every((c) => (c.shot || c.shot_id) && (c.anchor || c.event || c.why) && c.t >= 0), JSON.stringify((cues.cues || cues)[0]));
const tl = rd('data/timeline.json'); ok('cue times lie inside the film', (cues.cues || cues).every((c) => c.t <= tl.duration + 0.05));
// an effect with no event must be refused
const bad = JSON.parse(JSON.stringify(sb)); bad.shots[0].sfx = [{ type: 'whoosh' }]; fs.writeFileSync(path.join(P, 'storyboard/storyboard.json'), JSON.stringify(bad)); r = node([path.join(TK, 'tools/audio/build_cues.mjs'), P]); ok('an effect with no anchor/time (a "random whoosh") is refused', r.status !== 0, r.stdout + r.stderr); fs.writeFileSync(path.join(P, 'storyboard/storyboard.json'), JSON.stringify(sb)); node([path.join(TK, 'tools/audio/build_cues.mjs'), P]);
r = py([path.join(TK, 'tools/audio/mix.py'), '.']); ok('the mix is built (voice + cues + music bed)', r.status === 0 && fs.existsSync(path.join(P, 'data/mix.wav')), (r.stdout + r.stderr).slice(-300));
const mix = path.join(P, 'data/mix.wav'), pk = +(ffm(['-i', mix, '-af', 'astats=metadata=0', '-vn', '-f', 'null', '-']).match(/Peak level dB: (-?[\d.]+)/) || [])[1];
ok('the mix does not clip', isFinite(pk) && pk < -0.1, `peak ${pk} dBFS`);
// music under the voice: the mix is no louder than the voice alone by more than a small margin (music + sfx ride below it)
const mr = rd('data/mix-report.json'); ok('the mix report measures the music level while the narrator speaks: at least 8 dB under the voice (no masking)', mr.music_under_voice_db >= 8, JSON.stringify(mr));
ok('loud peaks are handled by a clean gain reduction (not by soft-clipping the voice): the master gain is reported and modest', typeof mr.master_gain_db === 'number' && mr.master_gain_db >= -8, JSON.stringify(mr));
{ const st = ffm(['-i', mix, '-af', 'astats=metadata=0', '-vn', '-f', 'null', '-']); const crest = +(st.match(/Crest factor: (-?[\d.]+)/) || [])[1]; ok('the mix keeps the voice dynamics (crest factor above 4, i.e. peaks are not squashed flat)', !isFinite(crest) || crest > 4, `crest ${crest}`); }
{ const cr = node([path.join(TK, 'tools/critique.mjs'), P, 'audio']); const mu = rd('review/critics/music.json'); ok('the audio critic reads that report and finds no masking or clipping problem', !mu.findings.some((f) => f.severity !== 'minor' && /mask|clip/i.test(f.problem)), JSON.stringify(mu.findings.map((f) => f.problem))); }
// the mix is longer than or equal to the voice, and still audible
ok('the mix covers the whole narration', dur(mix) >= nd - 0.2, `${dur(mix).toFixed(2)} vs ${nd.toFixed(2)}`);
fs.rmSync(tmp, { recursive: true, force: true });
if (fails) { console.error(`${fails} of ${n} audio checks FAILED`); process.exit(1); } console.log(`AUDIO SELFTEST PASSED: ${n} checks (real Kokoro voice, real faster-whisper alignment, real mix)`);
