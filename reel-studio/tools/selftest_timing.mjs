#!/usr/bin/env node
// Overlay timing, music mood and the mouth check: a good plan passes; each planted defect is caught.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { run as overlays } from './critics/overlays.mjs';
import { run as mood } from './critics/mood.mjs';
import { run as logic } from './critics/logic.mjs';

const mk = (o) => {
  const P = fs.mkdtempSync(path.join(os.tmpdir(), 'timing-'));
  for (const [f, v] of Object.entries(o)) { fs.mkdirSync(path.dirname(path.join(P, f)), { recursive: true }); fs.writeFileSync(path.join(P, f), JSON.stringify(v)); }
  return P;
};
const quiet = async (fn, P) => { const log = console.log; console.log = () => {}; try { return await fn(P); } finally { console.log = log; } };
const has = (r, sev, re) => r.findings.some((f) => f.severity === sev && re.test(f.problem));
const bad = [], ok = (c, m) => { if (!c) bad.push(m); };

const script = { title: 't', lines: [{ id: 'L01', beat: 'hook', text: 'It costs four hundred dollars every month.', emotion: 'fear' }, { id: 'L02', beat: 'win', text: 'Now it is free forever.', emotion: 'happy' }] };
const shot = (o = {}) => ({ id: 'S01', line_ids: ['L01'], component: 'Card', anchors: [{ name: 'price', line: 'L01', word: 'four' }], overlays: [{ type: 'price-tag', anchor: 'price', text: '$400', dur: 1.6 }], ...o });
const tl = (anchors = { price: 1.2 }, end = 4) => ({ fps: 30, width: 1080, height: 1920, duration: end, shots: [{ id: 'S01', start: 0, end, component: 'Card', anchors }], captions: [], words: [] });

ok((await quiet(overlays, mk({ 'storyboard/storyboard.json': { shots: [shot()] }, 'script/script.json': script, 'data/timeline.json': tl() }))).verdict === 'pass', 'good overlay should pass');
ok(has(await quiet(overlays, mk({ 'storyboard/storyboard.json': { shots: [shot({ anchors: [] })] }, 'script/script.json': script })), 'blocker', /does not define/), 'overlay on a missing anchor not caught');
ok(has(await quiet(overlays, mk({ 'storyboard/storyboard.json': { shots: [shot()] }, 'script/script.json': script, 'data/timeline.json': tl({ price: 9 }) })), 'blocker', /outside its shot/), 'anchor outside the shot not caught');
ok(has(await quiet(overlays, mk({ 'storyboard/storyboard.json': { shots: [shot()] }, 'script/script.json': script, 'data/timeline.json': tl({ price: 3.8 }) })), 'major', /too short to read/), 'overlay with no time to read not caught');
ok(has(await quiet(overlays, mk({ 'storyboard/storyboard.json': { shots: [shot({ anchors: [{ name: 'price', line: 'L01', word: 'time' }] })] }, 'script/script.json': { ...script, lines: [{ ...script.lines[0], text: 'It takes a long time and it hurts.' }] }, 'data/timeline.json': tl() })), 'major', /not a number/), 'price tag on a non-number not caught');

const ap = (m) => ({ voice: { engine: 'kokoro' }, music: { direction: 'x' }, mix: { target_lufs: -14, true_peak_db: -1 }, music_by_beat: [{ beat_id: 'hook', mood: m, energy: 0.6 }, { beat_id: 'win', mood: 'playful', energy: 0.7 }] });
ok((await quiet(mood, mk({ 'audio/audio-plan.json': ap('tense'), 'script/script.json': script }))).verdict === 'pass', 'tense music under fear should pass');
ok(has(await quiet(mood, mk({ 'audio/audio-plan.json': ap('triumphant'), 'script/script.json': script })), 'major', /triumphant.*hook/), 'triumphant music under fear lines not caught');
ok((await quiet(mood, mk({ 'audio/audio-plan.json': { voice: { engine: 'kokoro' }, music: { direction: 'x' }, mix: { target_lufs: -14, true_peak_db: -1 }, notes: '' }, 'script/script.json': script }))).verdict === 'pass', 'no music_by_beat should be noted, not failed');

const st = (cast) => ({ shots: [{ id: 'S01', line_ids: ['L01'], component: 'Stage3D', props: { world: 'home-studio', cast, props3d: [] } }] });
const c1 = { id: 'hero', kind: 'human', at: [0, 0], rotY: 0, mood: 'scared' };
const dlg = { title: 't', lines: [{ id: 'L01', text: 'Run!', speaker: 'hero', emotion: 'fear' }] };
ok(has(await quiet(logic, mk({ 'storyboard/storyboard.json': st([c1]), 'script/script.json': dlg })), 'major', /nobody in S01 has speaks:true/), 'dialogue with nobody speaking not caught');
ok(!has(await quiet(logic, mk({ 'storyboard/storyboard.json': st([{ ...c1, speaks: true }]), 'script/script.json': dlg })), 'major', /speaks:true/), 'a speaking character should satisfy the mouth check');
ok(!(await quiet(logic, mk({ 'storyboard/storyboard.json': st([{ ...c1, speaks: true }]), 'script/script.json': { title: 't', lines: [{ id: 'L01', text: 'Run!', emotion: 'fear' }] } }))).findings.some((f) => /narrator|talks over/.test(f.problem)), 'a character voicing narration must be allowed');

if (bad.length) { console.error('TIMING SELFTEST FAILED:\n- ' + bad.join('\n- ')); process.exit(1); }
console.log('TIMING SELFTEST PASSED: overlay anchor, shot window, read time, number fit; music mood fit and missing plan; a named speaker needs a speaking character, a character may voice narration');
