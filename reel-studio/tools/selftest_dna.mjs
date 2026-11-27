#!/usr/bin/env node
// Style DNA analyser on synthetic video with KNOWN content: 3 shots (static, push-in, pan) cut at 3 s and 6 s with a quiet sine, and a caption at 75 percent height.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { run, PY, TK } from './lib/pipeline.mjs';
import { check, loadSchema } from './validate.mjs';
import { compare } from './reference/dna_compare.mjs';

const T = fs.mkdtempSync(path.join(os.tmpdir(), 'dna-')), bad = [], ok = (c, m) => { if (!c) bad.push(m); };
const ff = (args) => { const r = run('ffmpeg', ['-y', '-v', 'error', ...args]); if (r.status) throw new Error(r.stderr.slice(-300)); };
const clip = path.join(T, 'clip.mp4'), cap = path.join(T, 'cap.mp4');
ff(['-f', 'lavfi', '-i', 'testsrc2=size=360x640:rate=30:duration=3', '-f', 'lavfi', '-i', "testsrc2=size=720x1280:rate=30:duration=3,zoompan=z='min(1+0.012*on,1.5)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=360x640:fps=30,hue=h=150", '-f', 'lavfi', '-i', "testsrc=size=720x640:rate=30:duration=3,crop=360:640:'(iw-ow)*t/3':0", '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=44100:duration=9', '-filter_complex', '[0:v][1:v][2:v]concat=n=3:v=1:a=0[v]', '-map', '[v]', '-map', '3:a', '-pix_fmt', 'yuv420p', '-shortest', clip]);
ff(['-f', 'lavfi', '-i', "color=c=black:size=360x640:rate=30:duration=4,drawtext=font='DejaVu Sans':text='HELLO WORLD':fontsize=56:fontcolor=white:x=(w-text_w)/2:y=h*0.75", '-pix_fmt', 'yuv420p', cap]);

const dna = (v, extra = []) => { const out = path.join(T, path.basename(v) + '.dna.json'), r = run(PY, [path.join(TK, 'tools/reference/dna.py'), v, '--out', out, ...extra]); if (r.status) throw new Error('dna.py failed: ' + (r.stderr || '').slice(-400)); return JSON.parse(fs.readFileSync(out, 'utf8')); };
const d = dna(clip, ['--no-ocr']);
ok(!check(loadSchema('style-dna'), d).length, 'dna does not match the schema: ' + check(loadSchema('style-dna'), d)[0]);
ok(d.meta.n_shots === 3 && d.meta.aspect === '9:16', `expected 3 shots at 9:16, got ${d.meta.n_shots} ${d.meta.aspect}`);
ok(d.shots.length === 3 && Math.abs(d.shots[1].t0 - 3) < 0.25 && Math.abs(d.shots[2].t0 - 6) < 0.25, 'cuts not found near 3 s and 6 s: ' + d.shots.map((s) => s.t0).join(', '));
ok(d.shots[0].move === 'static', `first shot should be static, got ${d.shots[0].move}`);
ok(d.shots[1].move === 'push', `second shot should be a push-in, got ${d.shots[1].move} (mag ${d.shots[1].move_mag})`);
ok(d.shots[2].move === 'pan', `third shot should be a pan, got ${d.shots[2].move} (mag ${d.shots[2].move_mag})`);
ok(d.audio.lufs < -14 && d.audio.lufs > -32, `loudness of a quiet sine out of range: ${d.audio.lufs}`);
ok(Math.abs(d.motion.cuts_per_10s - 3.33) < 0.3, `cuts per 10 s should be 3.3, got ${d.motion.cuts_per_10s}`);
ok(d.unmeasured.length >= 5 && d.unmeasured.some((x) => /vision/.test(x)), 'unmeasured list must be honest and non-trivial');

const c = dna(cap);
ok(c.captions.y_pct != null && Math.abs(c.captions.y_pct - 77) <= 8, `caption should be found near 77 percent, got ${JSON.stringify(c.captions)}`);
ok(c.captions.case === 'upper', 'caption case should be upper');

ok(compare(d, d).pass, 'a DNA must match itself');
const off = compare(d, { ...d, motion: { ...d.motion, cuts_per_10s: 8 }, audio: { ...d.audio, lufs: -10 } });
ok(!off.pass && off.fixes.length >= 2 && off.fixes.some((f) => /shot lengths/.test(f)) && off.fixes.some((f) => /loudness|mix/.test(f)), 'a mismatch must fail and say what to change');

const id = 'selftest-dna', dir = path.join(TK, 'style-packs', `${id}-draft`);
try {
  const r = run('node', [path.join(TK, 'tools/ref.mjs'), 'save', path.join(T, 'clip.mp4.dna.json'), id]);
  ok(!r.status && fs.existsSync(path.join(dir, 'style.json')) && fs.existsSync(path.join(dir, 'camera.json')), 'ref save did not write a draft pack: ' + r.stderr);
  ok(!check(loadSchema('camera-language'), JSON.parse(fs.readFileSync(path.join(dir, 'camera.json'), 'utf8'))).length, 'saved camera.json does not match camera-language');
  ok(!check(loadSchema('style-pack'), JSON.parse(fs.readFileSync(path.join(dir, 'style.json'), 'utf8'))).length, 'saved style.json does not match style-pack');
} finally { fs.rmSync(dir, { recursive: true, force: true }); }

if (bad.length) { console.error('DNA SELFTEST FAILED:\n- ' + bad.join('\n- ')); process.exit(1); }
console.log('DNA SELFTEST PASSED: 3 shots with cuts at 3 s and 6 s, static / push / pan told apart, loudness, caption at 77%, schema-valid, compare passes itself and fails a mismatch with fixes, save writes a valid draft pack');
