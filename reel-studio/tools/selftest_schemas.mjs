#!/usr/bin/env node
// v2 contracts: each new schema accepts a good fixture and rejects planted defects; every style pack still validates.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { check, loadSchema } from './validate.mjs';

const TK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const bad = [];
const must = (name, schema, v, ok, why) => { const e = check(loadSchema(schema), v); if (ok && e.length) bad.push(`${name}: should pass, got ${e[0]}`); if (!ok && !e.length) bad.push(`${name}: should fail (${why})`); };
const hex = ['#0D0C12', '#C8F848'];

const cam = { schema_version: 1, space: 'static_sprite_world', move_mix: { push: 0.5, orbit: 0.5 }, shot_len: { min: 1.2, median: 2.7, max: 5 }, never_static: true };
must('camera good', 'camera-language', cam, true);
must('camera bad space', 'camera-language', { ...cam, space: 'imax' }, false, 'unknown space');
must('camera extra field', 'camera-language', { ...cam, vibes: 1 }, false, 'unknown field');
must('camera tiny shot', 'camera-language', { ...cam, shot_len: { min: 0.01, median: 2, max: 3 } }, false, 'min below 0.2 s');

const cap = { schema_version: 1, font_stack: ['Inter'], size_px: 64, fill: '#FFFFFF', stroke: { w: 6, color: '#000000' }, position: { y_pct: 70 }, chunking: { max_words: 2, hide_until_spoken: true } };
must('caption good', 'caption-style', cap, true);
must('caption 8 words', 'caption-style', { ...cap, chunking: { max_words: 8 } }, false, 'chunk too long');
must('caption bad hex', 'caption-style', { ...cap, fill: 'white' }, false, 'fill not hex');
must('caption at top edge', 'caption-style', { ...cap, position: { y_pct: 2 } }, false, 'outside safe range');

const cast = { schema_version: 1, characters: [{ id: 'pip', rig: 'svg', radius: 0.35, facing_model: 'flipX', original: true }] };
must('cast good', 'cast', cast, true);
must('cast no radius', 'cast', { schema_version: 1, characters: [{ id: 'pip', rig: 'svg', facing_model: 'flipX', original: true }] }, false, 'radius missing');
must('cast unknown rig', 'cast', { schema_version: 1, characters: [{ ...cast.characters[0], rig: 'claymation' }] }, false, 'bad rig');

const world = { schema_version: 1, sets: [{ id: 'kitchen', type: 'painted', palette: ['#7FD1C0', '#F2E3C6'] }] };
must('world good', 'world', world, true);
must('world one colour', 'world', { schema_version: 1, sets: [{ id: 'k', type: 'painted', palette: ['#7FD1C0'] }] }, false, 'needs 2 colours');

const up = { schema_version: 1, style_id: 'sketchy-stickman', axes: { structure: { ref: 'one story', ours: 'two stories' }, opening: { ref: 'cold open', ours: 'question' }, signature_shot: { ref: 'wide orbit', ours: 'macro push' }, camera_path: { ref: 'steady', ours: 'handheld' }, score_shape: { ref: 'rising', ours: 'flat' }, ending: { ref: 'twist', ours: 'loop' } },  keep: ['one set per video, wide then face punch-in'], improve: ['richer face sprite set with more mouth shapes'], change: ['original characters and clothing colours', 'new set palette and props'] };
must('upgrade good', 'upgrade', up, true);
must('upgrade copy (no change)', 'upgrade', { ...up, change: ['one only here'] }, false, 'needs 2 changes');

const sc = { schema_version: 1, stages: [{ stage: 'storyboard', score: 90, weight: 25, pass_at: 85, round: 1, status: 'pass' }], overall: 90, status: 'pass' };
must('scorecard good', 'scorecard', sc, true);
must('scorecard score 140', 'scorecard', { ...sc, stages: [{ ...sc.stages[0], score: 140 }] }, false, 'score over 100');
must('scorecard round 9', 'scorecard', { ...sc, stages: [{ ...sc.stages[0], round: 9 }] }, false, 'too many rounds');

const dna = { schema_version: 1, meta: { src_hash: 'abcdef12', duration_s: 12.2, fps: 60, aspect: '9:16', n_shots: 6 }, structure: { beats: [{ t0: 0, t1: 2, type: 'hook' }] }, shots: [{ t0: 0, t1: 2, move: 'push', confidence: 0.7 }], camera: {}, captions: {}, palette: { dominant: hex }, motion: { cuts_per_10s: 4.9 }, audio: { lufs: -15.2 }, unmeasured: ['sfx by ear'] };
must('dna good', 'style-dna', dna, true);
must('dna no unmeasured field', 'style-dna', (({ unmeasured, ...r }) => r)(dna), false, 'unmeasured list is required');
must('dna confidence 3', 'style-dna', { ...dna, shots: [{ t0: 0, t1: 2, move: 'push', confidence: 3 }] }, false, 'confidence over 1');

must('audio-plan v2 fields', 'audio-plan', { voice: { engine: 'kokoro' }, music: { direction: 'tense bed' }, mix: { target_lufs: -14, true_peak_db: -1 }, music_by_beat: [{ beat_id: 'b1', mood: 'tense', energy: 0.6 }], voices: [{ character_id: 'pip', engine: 'kokoro', voice: 'af_heart' }], sfx_rules: [{ trigger: 'cut', role: 'whoosh', gain_db: -12 }] }, true);
must('audio-plan bad mood', 'audio-plan', { voice: { engine: 'kokoro' }, music: { direction: 'x' }, mix: { target_lufs: -14, true_peak_db: -1 }, music_by_beat: [{ beat_id: 'b1', mood: 'vibey', energy: 0.6 }] }, false, 'mood not in list');

const cdir = path.join(TK, 'foundation/camera'), cf = fs.readdirSync(cdir).filter((f) => f.endsWith('.json'));
if (cf.length < 9) bad.push(`expected 9 camera-language files, found ${cf.length}`);
for (const f of cf) { const d = JSON.parse(fs.readFileSync(path.join(cdir, f), 'utf8')), e = check(loadSchema('camera-language'), d); if (e.length) bad.push(`camera ${f}: ${e[0]}`); const sum = Object.values(d.move_mix).reduce((a, b) => a + b, 0); if (Math.abs(sum - 1) > 0.01) bad.push(`camera ${f}: move_mix sums to ${sum.toFixed(2)}`); const tsum = Object.values(d.transitions || {}).reduce((a, b) => a + b, 0); if (d.transitions && Math.abs(tsum - 1) > 0.01) bad.push(`camera ${f}: transitions sum to ${tsum.toFixed(2)}`); if (!(d.shot_len.min <= d.shot_len.median && d.shot_len.median <= d.shot_len.max)) bad.push(`camera ${f}: shot_len not ordered`); }
let n = 0;
for (const d of fs.readdirSync(path.join(TK, 'style-packs'))) {
  const f = path.join(TK, 'style-packs', d, 'style.json'); if (d.startsWith('_') || !fs.existsSync(f)) continue; n++;
  const e = check(loadSchema('style-pack'), JSON.parse(fs.readFileSync(f, 'utf8'))); if (e.length) bad.push(`pack ${d}: ${e[0]}`);
}
if (bad.length) { console.error('schema selftest failed:\n- ' + bad.join('\n- ')); process.exit(1); }
console.log(`v2 schemas ok: 8 new + 2 extended, planted defects rejected, ${cf.length} camera-language files, ${n} style packs still valid`);
