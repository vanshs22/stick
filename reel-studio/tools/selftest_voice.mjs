#!/usr/bin/env node
// Voice casting + emotion check.  node tools/selftest_voice.mjs [--full]
// Fast: a female role never gets a male voice, two characters never share a voice, an unknown speaker is refused.
// --full (needs the Kokoro files): real synthesis. Different speakers use different voices, and emotion measurably changes the delivery
// (sad is slower than happy for the same words, whisper is quieter than neutral, a shock line starts after a beat of silence).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { TK, PY, run } from './lib/pipeline.mjs';

const full = process.argv.includes('--full'), tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'reel-voice-'));
const mk = (name, script, voice = {}) => {
  const P = path.join(tmp, name); fs.mkdirSync(path.join(P, 'script'), { recursive: true }); fs.mkdirSync(path.join(P, 'audio'), { recursive: true });
  fs.writeFileSync(path.join(P, 'script/script.json'), JSON.stringify({ title: 't', language: 'en', lines: script.lines, cast: script.cast }));
  fs.writeFileSync(path.join(P, 'audio/audio-plan.json'), JSON.stringify({ voice: { engine: 'kokoro', voice: 'am_michael', speed: 1, ...voice }, music: { bed: 'none' }, mode: 'narrated' })); return P;
};
const tts = (P) => { const r = run('node', [path.join(TK, 'tools/audio/build_tts_input.mjs'), P]); return { ...r, json: r.status ? null : JSON.parse(fs.readFileSync(path.join(P, 'data/tts.json'), 'utf8')) }; };
const L = (id, text, extra = {}) => ({ id, text, beat: 'step', ...extra });

// 1. casting rules
let r = tts(mk('ok', { cast: { MAYA: { gender: 'female', tone: 'warm' }, LEO: { gender: 'male', tone: 'playful' } }, lines: [L('L01', 'Did you hear that?', { speaker: 'MAYA', emotion: 'fear' }), L('L02', 'It was only the wind.', { speaker: 'LEO', emotion: 'calm' }), L('L03', 'Narration line.')] }));
assert.equal(r.status, 0, r.stderr);
const [a, b, c] = r.json.lines; assert.match(a.voice, /^[ab]f_/, 'a female role must get a female voice'); assert.match(b.voice, /^[ab]m_/, 'a male role must get a male voice');
assert.notEqual(a.voice, b.voice); assert.equal(c.voice, undefined, 'the narrator keeps the plan voice'); assert.equal(a.emotion, 'fear');
r = tts(mk('mismatch', { cast: { MAYA: { gender: 'female', voice: 'am_adam' } }, lines: [L('L01', 'Hi there.', { speaker: 'MAYA' })] })); assert.notEqual(r.status, 0, 'female role with a male voice must be refused'); assert.match(r.stderr, /female but voice am_adam is male/);
r = tts(mk('shared', { cast: { A: { gender: 'male', voice: 'am_adam' }, B: { gender: 'male', voice: 'am_adam' } }, lines: [L('L01', 'Hi.', { speaker: 'A' })] })); assert.notEqual(r.status, 0, 'two characters on one voice must be refused'); assert.match(r.stderr, /share voice/);
r = tts(mk('ghost', { cast: {}, lines: [L('L01', 'Hi there.', { speaker: 'NOBODY' })] })); assert.notEqual(r.status, 0, 'a speaker missing from cast must be refused');
console.log('casting rules: ok (gender match, unique voices, unknown speaker refused)');

// 2. real synthesis
if (full) {
  const P = mk('real', { cast: { MAYA: { gender: 'female', tone: 'warm' } }, lines: [L('L01', 'I never expected this to work.', { speaker: 'MAYA', emotion: 'happy' }), L('L02', 'I never expected this to work.', { speaker: 'MAYA', emotion: 'sad' }), L('L03', 'I never expected this to work.', { speaker: 'MAYA', emotion: 'whisper' }), L('L04', 'I never expected this to work.', { speaker: 'MAYA', emotion: 'shock' }), L('L05', 'I never expected this to work.', { speaker: 'MAYA' })] });
  tts(P); const v = run(PY, [path.join(TK, 'tools/audio/voice.py'), '.'], { cwd: P, env: { ...process.env, TTS_SCRIPT: 'data/tts.json' } }); assert.equal(v.status, 0, (v.stderr || v.stdout).slice(-500));
  const ls = JSON.parse(fs.readFileSync(path.join(P, 'data/lines.json'), 'utf8')).lines, dur = (i) => ls[i].end - ls[i].start;
  assert.ok(dur(1) > dur(0) * 1.12, `sad (${dur(1).toFixed(2)} s) should be slower than happy (${dur(0).toFixed(2)} s)`);
  assert.ok(ls.every((l) => /^af_/.test(l.voice)), 'every line of a female role is a female voice');
  assert.ok(ls[3].start - ls[2].end >= 0.4, 'a shock line is preceded by a beat of silence');
  const py = `import numpy as np,json,scipy.io.wavfile as w;sr,x=w.read('data/narration.wav');x=x/32768;L=json.load(open('data/lines.json'))['lines'];r=lambda i:float(np.sqrt(np.mean(x[int(L[i]['start']*sr):int(L[i]['end']*sr)]**2)));print(r(2)/r(4))`;
  const q = run(PY, ['-c', py], { cwd: P }); const ratio = Number(q.stdout.trim()); assert.ok(ratio < 0.8, `whisper should be quieter than neutral (level ratio ${ratio.toFixed(2)})`);
  console.log(`real voice: ok (sad/happy duration ${(dur(1) / dur(0)).toFixed(2)}x, whisper/neutral level ${ratio.toFixed(2)}, shock preceded by ${(ls[3].start - ls[2].end).toFixed(2)} s)`);
}
console.log('VOICE SELFTEST PASSED');
