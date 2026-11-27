#!/usr/bin/env node
// Character sheet and the "faces are fixed" check: one locked character, every emotion, MEASURED.
//   node tools/character_sheet.mjs <characters/name.json | project-character.json> [--emotions calm,happy,...] [--out <dir>] [--pack stylized-3d-presenter] [--scale 0.5]
// 1. A throwaway project with one close-up shot per emotion (same camera, same light, same pose): only the face may change.
// 2. Stills of all shots in one browser session (tools/layout_probe.mjs), a labelled sheet (<out>/<name>-emotions.jpg).
// 3. The check: each emotion must differ from "calm" in the face region by a measurable amount, and two different emotions must not be near-identical. Fails (exit 1) otherwise: the character is not ready to act.
// The character file format is schemas/character.schema.json; the design rules are docs/CHARACTER-BIBLE.md. Works for kind human (3D rig faces: smile, brow, tilt, lid, look, open) in the Stage3D engine.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { PY, TK, syncProject, timing, run } from './lib/pipeline.mjs';

const a = process.argv.slice(2), opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 && a[i + 1] ? a[i + 1] : d; }, file = a[0];
if (!file || !fs.existsSync(file)) { console.error(fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(1, 7).join('\n').replace(/^\/\/ ?/gm, '')); process.exit(2); }
const C = JSON.parse(fs.readFileSync(file, 'utf8')), EM = (opt('emotions') || 'calm,happy,surprised,worried,sad,angry,smirk,scared,determined').split(','), out = path.resolve(opt('out', 'review/characters')), pack = opt('pack', 'stylized-3d-presenter'), scale = opt('scale', '0.5');
fs.mkdirSync(out, { recursive: true }); const P = path.join(out, `.sheet-${C.id}`); fs.rmSync(P, { recursive: true, force: true });
const wr = (f, o) => { fs.mkdirSync(path.dirname(path.join(P, f)), { recursive: true }); fs.writeFileSync(path.join(P, f), JSON.stringify(o, null, 1)); };
const lines = EM.map((e, i) => ({ id: `L${String(i + 1).padStart(2, '0')}`, beat: i === 0 ? 'hook' : i === EM.length - 1 ? 'cta' : 'step', text: `This is the ${e} face of ${C.name || C.id}.`, emotion: e, emphasis: [], visual_hint: '' }));
wr('script/script.json', { title: `${C.name || C.id} emotion sheet`, language: 'en', lines, est_seconds: EM.length * 2.5 });
wr('brief.json', { platform: 'instagram-reels', aspect: '9:16', language: 'en', audience: 'character check', goal: 'faces', voice: { engine: 'kokoro', voice: 'am_michael', speed: 1 }, music: { direction: 'light' }, captions: { preset: 'word-pop' }, research: { agent_reach: 'no' }, title: 'sheet', topic: 'faces', duration_sec: EM.length * 2.5, style_pack: pack });
wr('audio/audio-plan.json', { voice: { engine: 'kokoro', voice: 'am_michael', speed: 1, pronunciations: {} }, music: { direction: 'light', bed: 'none' }, mix: { target_lufs: -14, true_peak_db: -1.5 }, mode: 'narrated' });
wr('typography/captions.json', { preset: 'word-pop', position: { anchor: 'bottom', y: null }, scale: 1 });
wr('storyboard/storyboard.json', { style_pack: pack, shots: EM.map((e, i) => ({ id: `S${String(i + 1).padStart(2, '0')}`, line_ids: [lines[i].id], bg: 'paper', visual_intent: `${e} face`, shot_type: 'character', component: 'Stage3D', approach: 'character-3d', why_renderer: 'emotion sheet', props: { world: C.world || 'home-studio', worldOpts: {}, cast: [{ id: 'hero', kind: C.kind || 'human', look: C.look || {}, at: [0, 0], rotY: 0, pose: 'idle', mood: e, speaks: false, ...(C.scale ? { scale: C.scale } : {}) }], props3d: [], camera: { framing: 'close-up', angle: 'eye-level', subject: 'hero', offset: [0, 0] } }, anchors: [], overlays: [], sfx: [], transition_out: { type: 'cut', sound: 'none', why: 'sheet' }, presenter: { hidden: true } })) });
syncProject(P); timing(P);
const pr = spawnSync('node', ['--no-warnings', path.join(TK, 'tools/layout_probe.mjs'), P, '--at', '0.85', '--scale', scale], { encoding: 'utf8', maxBuffer: 1 << 26, timeout: 3000000 }); if (pr.status) { console.error((pr.stdout + pr.stderr).slice(-800)); process.exit(1); }
const py = `import sys, json, glob, os
import numpy as np
from PIL import Image, ImageDraw
d = sys.argv[1]; names = sys.argv[3].split(','); fs = [f'{d}/S{i+1:02d}_85.png' for i in range(len(names))]
ims = [Image.open(f).convert('RGB') for f in fs]; w, h = ims[0].size
# the face region: the middle band of a close-up of one character (where the head is)
box = (int(w*0.18), int(h*0.10), int(w*0.82), int(h*0.62)); crop = [np.asarray(im.crop(box)).astype('float32') for im in ims]
base = crop[names.index('calm')] if 'calm' in names else crop[0]; res = {}
for n, c in zip(names, crop): res[n] = float(np.abs(c - base).mean())
pair = []
for i in range(len(names)):
    for j in range(i+1, len(names)): pair.append((float(np.abs(crop[i]-crop[j]).mean()), names[i], names[j]))
pair.sort(); cols = min(5, len(ims)); rows = -(-len(ims)//cols); S = Image.new('RGB', (cols*w, rows*(h+26)), (22,22,28)); dr = ImageDraw.Draw(S)
for i, (n, im) in enumerate(zip(names, ims)):
    x, y = (i % cols)*w, (i // cols)*(h+26); S.paste(im, (x, y+26)); dr.text((x+6, y+6), f'{n}   diff vs calm {res[n]:.1f}', fill=(255,220,120))
S.save(sys.argv[2], quality=90); print(json.dumps({'vs_calm': res, 'closest_pair': pair[0]}))`;
const sheet = path.join(out, `${C.id}-emotions.jpg`), m = spawnSync(PY, ['-c', py, path.join(P, 'review/layout'), sheet, EM.join(',')], { encoding: 'utf8' }); if (m.status) { console.error(m.stderr.slice(-500)); process.exit(1); }
const r = JSON.parse(m.stdout.trim().split('\n').pop()), MIN = 1.2, bad = Object.entries(r.vs_calm).filter(([n, v]) => n !== 'calm' && v < MIN), [dd, ea, eb] = r.closest_pair, twin = dd < MIN * 0.8;
fs.writeFileSync(path.join(out, `${C.id}-emotions.json`), JSON.stringify({ character: C.id, ...r, min_diff: MIN, indistinguishable_from_calm: bad.map(([n]) => n), near_identical_pair: twin ? [ea, eb] : null, checked: new Date().toISOString() }, null, 1));
console.log(`sheet: ${sheet}\n${EM.map((e) => `  ${e.padEnd(11)} face differs from calm by ${r.vs_calm[e].toFixed(1)}`).join('\n')}\nclosest two emotions: ${ea} and ${eb} (${dd.toFixed(1)})`);
fs.rmSync(P, { recursive: true, force: true });
if (bad.length || twin) { console.error(`\nFAIL: ${bad.length ? bad.map(([n, v]) => `${n} looks like calm (${v.toFixed(1)} < ${MIN})`).join('; ') : ''}${twin ? ` ${ea} and ${eb} are near-identical` : ''}. Give those emotions bigger eye, brow and mouth differences (docs/CHARACTER-BIBLE.md, "Emotion table"), then run again. LOOK at the sheet too.`); process.exit(1); }
console.log('PASS: every emotion is visibly different from calm and from the others. Now LOOK at the sheet: the number says "different", your eyes say "right".');
