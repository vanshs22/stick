#!/usr/bin/env node
// Reference video -> style, in three commands.
//   node tools/ref.mjs analyse <video> [--out dna.json] [--no-ocr]    measure it: writes a style-dna.json (validated)
//   node tools/ref.mjs save <dna.json> <style-id>                      draft style pack from a DNA: style-packs/<id>-draft/{camera,captions,audio,dna}.json + pack stub (status draft, gaps listed)
//   node tools/ref.mjs compare <ref.dna.json> <ours.dna.json>          numeric diff + the fixes to try (exit 1 if any metric is off)
// Everything not measured stays listed under "unmeasured": never guessed. Needs: python3 with opencv, scenedetect, pytesseract (+ tesseract), librosa.
import fs from 'node:fs';
import path from 'node:path';
import { TK, PY, run } from './lib/pipeline.mjs';
import { check, loadSchema } from './validate.mjs';
import { compare } from './reference/dna_compare.mjs';

const [cmd, a, b, ...rest] = process.argv.slice(2), arg = (k) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : null; };
const die = (m) => { console.error(m); process.exit(2); };
const readDna = (f) => { const d = JSON.parse(fs.readFileSync(f, 'utf8')), e = check(loadSchema('style-dna'), d); if (e.length) die(`${f} is not a valid style-dna: ${e[0]}`); return d; };

if (cmd === 'analyse') {
  if (!a) die('usage: ref.mjs analyse <video> [--out dna.json] [--no-ocr]');
  const out = arg('out') || a.replace(/\.[^.]+$/, '') + '.dna.json', r = run(PY, [path.join(TK, 'tools/reference/dna.py'), a, '--out', out, ...(process.argv.includes('--no-ocr') ? ['--no-ocr'] : [])], { stdio: ['ignore', 'pipe', 'inherit'] });
  if (r.status) die('analysis failed'); process.stdout.write(r.stdout); readDna(out); console.log('valid style-dna.');
} else if (cmd === 'save') {
  if (!a || !b || !/^[a-z0-9-]+$/.test(b)) die('usage: ref.mjs save <dna.json> <style-id>');
  const dna = readDna(a), dir = path.join(TK, 'style-packs', `${b}-draft`); fs.mkdirSync(dir, { recursive: true });
  const cam = { schema_version: 1, space: dna.camera.space, move_mix: dna.camera.move_mix, shot_len: dna.camera.shot_len, never_static: dna.camera.never_static, beat_sync: { snap_to: 'word', tol_ms: 150 } };
  const cap = dna.captions?.y_pct != null ? { schema_version: 1, font_stack: ['Inter', 'sans-serif'], size_px: 64, fill: dna.captions.fill && /^#[0-9A-F]{6}$/i.test(dna.captions.fill) ? dna.captions.fill : '#FFFFFF', position: { y_pct: Math.min(95, Math.max(5, dna.captions.y_pct)) }, chunking: { max_words: Math.min(4, Math.max(1, Math.round(dna.captions.words_visible_median || 2))) } } : null;
  const aud = { music_by_beat: [], mix: { target_lufs: Math.round(dna.audio.lufs), true_peak_db: -1 }, tempo_hint_bpm: dna.audio.bpm ?? null };
  const files = { 'camera.json': cam, 'audio.json': aud, 'dna.json': dna, ...(cap ? { 'captions.json': cap } : {}) };
  for (const [f, v] of Object.entries(files)) fs.writeFileSync(path.join(dir, f), JSON.stringify(v, null, 1));
  const [bg, ac] = [dna.palette.bg, dna.palette.accent];
  fs.writeFileSync(path.join(dir, 'style.json'), JSON.stringify({ id: `${b}-draft`, name: `${b} (draft from a reference)`, family: '2d', description: `DRAFT made by ref.mjs save from a reference video (${dna.meta.aspect}, ${dna.meta.duration_s} s, ${dna.meta.n_shots} shots). Measured: pace, camera mix, palette, loudness${cap ? ', caption height' : ''}. NOT measured: ${dna.unmeasured.slice(0, 3).join('; ')}. Fill the look by hand, then add upgrade.json.`, status: 'draft', schema_version: 1, tokens: { colors: { bg, ink: dna.palette.dominant.at(-1) || '#111111', accent: ac }, fonts: { sans: 'Inter' }, safe_zone: { top: 180, bottom: 1380, caption_y: cap ? Math.round(1920 * cap.position.y_pct / 100) : 1440, right_margin: 120 } }, rules: ['Draft: pace and camera mix copied from the reference measurements in dna.json.', `Keep one accent colour (${ac}).`], cadence: dna.meta.aspect === '9:16' ? 'explainer-2d' : 'longform-calm', formats: [dna.meta.aspect] }, null, 1));
  console.log(`draft pack: ${path.relative(TK, dir)} (${Object.keys(files).length + 1} files). Gaps: ${dna.unmeasured.length} listed in dna.json "unmeasured". Next: fill the look, write upgrade.json, run tools/upgrade_check.mjs.`);
} else if (cmd === 'compare') {
  if (!a || !b) die('usage: ref.mjs compare <ref.dna.json> <ours.dna.json>'); void rest;
  const r = compare(readDna(a), readDna(b)); for (const x of r.rows) console.log(`${x.ok ? 'ok  ' : 'OFF '} ${x.metric.padEnd(34)} ref ${String(x.ref).padEnd(10)} ours ${String(x.ours).padEnd(10)} (${x.tol})`);
  if (r.fixes.length) console.log('\nTry:\n- ' + r.fixes.join('\n- ')); console.log(r.pass ? '\nMATCH' : '\nNOT YET'); process.exit(r.pass ? 0 : 1);
} else die('usage: ref.mjs analyse|save|compare ...');
