#!/usr/bin/env node
// Preview galleries for the style gate: the user CHOOSES by looking, not by reading names.
//   node tools/gallery.mjs <projectDir> --kind typography|captions|styles
// Output: review/gallery/<kind>-<variant>.png and review/gallery-<kind>.jpg (contact sheet). Needs `npm install` in <projectDir>/remotion.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const a = process.argv.slice(2), P = a[0], kind = a.includes('--kind') ? a[a.indexOf('--kind') + 1] : 'typography';
if (!P) { console.error('usage: gallery.mjs <projectDir> --kind typography|captions|styles'); process.exit(2); }
const TK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), R = path.join(P, 'remotion'), out = path.join(P, 'review/gallery'); fs.mkdirSync(out, { recursive: true });
if (!fs.existsSync(path.join(R, 'node_modules'))) { console.error(`run "npm install" in ${R} first`); process.exit(1); }
const jobs = kind === 'typography' ? ['cinematic', 'editorial', 'modern-ui', 'terminal', 'typewriter'].map((v) => ({ id: v, props: { kind: 'typography', variant: v } }))
  : kind === 'captions' ? ['word-pop', 'one-word', 'boxed', 'phrase', 'typewriter', 'karaoke'].map((v) => ({ id: v, props: { kind: 'captions', variant: v } }))
  : fs.readdirSync(path.join(TK, 'style-packs')).filter((d) => fs.existsSync(path.join(TK, 'style-packs', d, 'style.json')) && d !== '_template').map((d) => ({ id: d, props: { kind: 'style', variant: d, pack: JSON.parse(fs.readFileSync(path.join(TK, 'style-packs', d, 'style.json'), 'utf8')) } }));
let fail = 0;
for (const j of jobs) { const f = path.resolve(out, `${kind}-${j.id}.png`), r = spawnSync('npx', ['remotion', 'still', 'src/index.ts', 'Gallery', f, '--frame=60', `--props=${JSON.stringify(j.props)}`], { cwd: R, encoding: 'utf8' }); if (r.status) { fail++; console.error(`${j.id} failed: ${(r.stderr || r.stdout).slice(-300)}`); } else console.log(`${kind}-${j.id}.png`); }
const dir = path.join(out, `_${kind}`); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true }); jobs.forEach((j, i) => fs.existsSync(path.join(out, `${kind}-${j.id}.png`)) && fs.copyFileSync(path.join(out, `${kind}-${j.id}.png`), path.join(dir, `${String(i).padStart(2, '0')}-${j.id}.png`)));
const cs = spawnSync('node', [path.join(TK, 'tools/qa/contact_sheet.mjs'), dir, path.join(P, `review/gallery-${kind}.jpg`), '--cols', '3', '--width', '300'], { encoding: 'utf8' }); console.log((cs.stdout || cs.stderr).trim() + `  (order: ${jobs.map((j) => j.id).join(', ')})`);
process.exit(fail ? 1 : 0);
