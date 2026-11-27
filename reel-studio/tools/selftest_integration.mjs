#!/usr/bin/env node
// Ideas taken from the external repos, each with a test: stagger helper, determinism lint, reads timing, dense-text reading time, originality axes.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { run as overlays } from './critics/overlays.mjs';
import { judge } from './upgrade_check.mjs';

const TK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..'), bad = [], ok = (c, m) => { if (!c) bad.push(m); };
ok(/export const stagger = \(i: number, each = 0\.04\)/.test(fs.readFileSync(path.join(TK, 'remotion-template/src/engine/anim.ts'), 'utf8')), 'stagger helper missing in anim.ts');
const T3 = path.join(TK, 'remotion-template/src/three'), hits = [];
for (const f of fs.readdirSync(T3).filter((x) => x.endsWith('.js'))) fs.readFileSync(path.join(T3, f), 'utf8').split('\n').forEach((l, i) => { if (!/^\s*\/\//.test(l) && /Math\.random\(|Date\.now\(|performance\.now\(/.test(l)) hits.push(`${f}:${i + 1}`); });
ok(!hits.length, 'non-deterministic calls in the 3D layer (frames must be identical in every process): ' + hits.join(', '));

const mk = (shots) => { const P = fs.mkdtempSync(path.join(os.tmpdir(), 'integ-')); fs.mkdirSync(path.join(P, 'storyboard')); fs.writeFileSync(path.join(P, 'storyboard/storyboard.json'), JSON.stringify({ shots })); return P; };
const quiet = async (P) => { const log = console.log; console.log = () => {}; try { return await overlays(P); } finally { console.log = log; } };
const has = (r, sev, re) => r.findings.some((f) => f.severity === sev && re.test(f.problem));
const sh = (o) => ({ id: 'S01', line_ids: ['L01'], component: 'Card', ...o });
ok((await quiet(mk([sh({ reads: [{ t0: 0, t1: 1.2, what: 'the price' }, { t0: 1.4, t1: 2.6, what: 'the discount' }] })]))).verdict === 'pass', 'good reads should pass');
ok(has(await quiet(mk([sh({ reads: [{ t0: 0, t1: 0.5, what: 'the price' }] })])), 'major', /held only/), 'a 0.5 s read not caught');
ok(has(await quiet(mk([sh({ reads: [{ t0: 0, t1: 2, what: 'the price' }, { t0: 1.5, t1: 3, what: 'the tax' }] })])), 'major', /overlap/), 'overlapping reads not caught');
ok(has(await quiet(mk([sh({ reads: [{ t0: 2, t1: 1, what: 'backwards' }] })])), 'blocker', /ends before it starts/), 'backwards read not caught');

const P2 = mk([sh({ anchors: [{ name: 'a', line: 'L01', word: 'x' }], overlays: [{ type: 'card', anchor: 'a', text: 'A long card that carries about fifty characters of text', dur: 4 }] })]);
fs.mkdirSync(path.join(P2, 'data')); fs.writeFileSync(path.join(P2, 'data/timeline.json'), JSON.stringify({ fps: 30, width: 1080, height: 1920, duration: 6, shots: [{ id: 'S01', start: 0, end: 6, component: 'Card', anchors: { a: 1 } }], captions: [], words: [] }));
const dense = await quiet(P2); ok(has(dense, 'minor', /characters is on screen/), 'dense text with too little time not noted: ' + dense.findings.map((f) => f.problem).join('; '));

const ax = (o = {}) => ({ structure: { ref: 'one fact story', ours: 'two rival stories' }, opening: { ref: 'cold open on the paradox', ours: 'a direct question' }, signature_shot: { ref: 'wide orbit of the bridge', ours: 'macro push on the hands' }, camera_path: { ref: 'steady glides', ours: 'handheld shake' }, score_shape: { ref: 'rising strings', ours: 'flat lofi bed' }, ending: { ref: 'ironic twist line', ours: 'loop to the first frame' }, ...o });
const up = (axes) => ({ schema_version: 1, style_id: 'x-style', keep: ['hold creep and glide timing'], improve: ['richer face sprite set'], change: ['original character', 'new palette and set'], axes });
ok(judge(up(ax())).ok, 'six differing axes should pass');
ok(!judge(up(ax({ structure: { ref: 'one fact story', ours: 'one fact story' }, opening: { ref: 'cold open on the paradox', ours: 'cold open on the paradox' }, ending: { ref: 'ironic twist line', ours: 'Ironic twist line!' } }))).ok, 'three copied axes should fail');
ok(!judge({ schema_version: 1 }).ok, 'an incomplete upgrade file should fail the schema');
if (bad.length) { console.error('INTEGRATION SELFTEST FAILED:\n- ' + bad.join('\n- ')); process.exit(1); }
console.log('INTEGRATION SELFTEST PASSED: stagger helper, no Math.random in the 3D layer, reads timing, dense-text reading time, originality axes (4 of 6 must differ)');
