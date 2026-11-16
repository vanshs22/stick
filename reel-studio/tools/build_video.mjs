#!/usr/bin/env node
// One command from an approved storyboard + audio plan to a finished MP4: voice, word timing, timeline, sound cues, mix, per-shot render (cached), assemble, loudness QA.
//   node tools/build_video.mjs <project> [--scale 0.5] [--estimate] [--shots S02,S05] [--name <file>]
//   --scale 0.5   half-size preview (4x faster). Default 1 (1080x1920).
//   --estimate    no voice: estimated timing and no narration (fast test of the picture)
//   --shots       re-render only these shots (everything else comes from the cache), then assemble
// Safe to re-run: the voice is only regenerated when the script or the voice choice changed (delete data/narration.wav to force).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { TK, PY, run, rd } from './lib/pipeline.mjs';

const a = process.argv.slice(2), P = path.resolve(a[0] || ''), opt = (k, d) => (a.includes('--' + k) ? a[a.indexOf('--' + k) + 1] : d);
if (!a[0] || !fs.existsSync(path.join(P, 'storyboard/storyboard.json'))) { console.error('usage: build_video.mjs <project> [--scale 0.5] [--estimate] [--shots S02,S05] [--name file]'); process.exit(2); }
const name = opt('name', path.basename(P)), env = { ...process.env, TTS_SCRIPT: 'data/tts.json', REMOTION_GL: process.env.REMOTION_GL || 'angle' };
const step = (label, cmd, args, o = {}) => { process.stdout.write(`== ${label}\n`); const r = run(cmd, args, { cwd: P, env, ...o }); const out = ((r.stdout || '') + (r.stderr || '')).trim().split('\n').filter((x) => !/requires glibc/.test(x)).slice(-3).join('\n'); /* Remotion's glibc notice is harmless (it still renders) */ if (out) console.log(out); if (r.status) { console.error(`FAILED: ${label}`); process.exit(1); } return r; };
const gates = run('node', [path.join(TK, 'tools/state.mjs'), 'check', P, 'build']);
if (gates.status) { console.error((gates.stderr || gates.stdout).trim()); process.exit(1); }   // earlier gates must be validly approved (test projects pass)
const s0 = rd(path.join(P, 'storyboard/storyboard.json')); if (!fs.existsSync(path.join(P, 'audio/audio-plan.json'))) { console.error('no audio/audio-plan.json: choose voice and music first (tools/choose.mjs <P> voice ...)'); process.exit(1); }
step('sync project (template, assets, style)', 'node', ['-e', `import('${path.join(TK, 'tools/lib/pipeline.mjs').split(path.sep).join('/')}').then(m=>m.syncProject(${JSON.stringify(P)}))`]);
step('check storyboard', 'node', [path.join(TK, 'tools/check_storyboard.mjs'), P]);
step('narration input', 'node', [path.join(TK, 'tools/audio/build_tts_input.mjs'), P]);
const ttsHash = crypto.createHash('sha1').update(fs.readFileSync(path.join(P, 'data/tts.json'))).digest('hex'), hf = path.join(P, 'data/.voice.hash');
const needVoice = !a.includes('--estimate') && (!fs.existsSync(path.join(P, 'data/narration.wav')) || !fs.existsSync(hf) || fs.readFileSync(hf, 'utf8') !== ttsHash);   // same text + voice + pronunciations = same narration
if (a.includes('--estimate')) fs.writeFileSync(path.join(P, 'data/.estimate'), 'estimate build: no narration, NOT a delivery render\n'); else fs.rmSync(path.join(P, 'data/.estimate'), { force: true });
if (a.includes('--estimate')) step('estimated timing (no voice)', PY, [path.join(TK, 'tools/audio/estimate.py'), '.']);
else if (needVoice) { step('voice (Kokoro, local)', PY, [path.join(TK, 'tools/audio/voice.py'), '.']); const wr = step('word timing (Whisper, local)', PY, [path.join(TK, 'tools/audio/words.py'), '.']); if (/spreading words|spread inside/.test((wr.stdout || '') + (wr.stderr || ''))) console.error('\nWARNING: Whisper was not available, so caption and anchor times are SPREAD inside each line (about 0.1-0.2 s off). Fix: install it (bash install.sh) and delete data/narration.wav, then rebuild.\n'); fs.writeFileSync(hf, ttsHash); }
else console.log('== voice: unchanged, reusing data/narration.wav');
step('timeline', 'node', [path.join(TK, 'tools/timing/build_timeline.mjs'), P]);
step('sound cues (each tied to an event)', 'node', [path.join(TK, 'tools/audio/build_cues.mjs'), P]);
step('mix (voice + music + sound)', PY, [path.join(TK, 'tools/audio/mix.py'), '.']);
step('timeline (final)', 'node', [path.join(TK, 'tools/timing/build_timeline.mjs'), P]);
const scale = opt('scale', '1'), seg = ['--scale', scale, ...(opt('shots') ? ['--shots', opt('shots')] : [])];
step('render shots (cached per shot)', 'node', [path.join(TK, 'tools/render_segments.mjs'), P, ...seg], { timeout: 7200000 });
step('assemble + loudness', 'node', [path.join(TK, 'tools/assemble.mjs'), P, name]);
const out = path.join(P, `renders/${name}.mp4`); const qa = (() => { try { return rd(path.join(P, `renders/${name}.qa.json`)); } catch { return null; } })();
console.log(`\nDONE ${path.relative(process.cwd(), out)}${qa ? '  QA: ' + ((qa.checks || []).filter((c) => !c.ok).map((c) => `${c.level === 'warn' ? 'warn' : 'FAIL'} ${c.name}`).join(', ') || 'all checks ok') + (qa.preview ? '  (PREVIEW: not a delivery render)' : '') : ''}\nnext: node ${path.join(TK, 'tools/critique.mjs')} ${P} all   then   node ${path.join(TK, 'tools/qa/contact_sheet.mjs')} ${out} ${P}/review/final.jpg --every 1   and LOOK at it`);
