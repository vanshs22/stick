#!/usr/bin/env node
// One still per shot (taken at 70 percent of the shot, when entrances have landed) + a contact sheet, so the storyboard and the build can be LOOKED at.
//   node tools/preview_shots.mjs <projectDir> [--at 0.7] [--only S03,S04]
// Output: review/storyboard/S01.png ... and review/storyboard.jpg (tile order = shot order). Needs `npm install` in <projectDir>/remotion.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const a = process.argv.slice(2), P = a[0], opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
if (!P) { console.error('usage: preview_shots.mjs <projectDir> [--at 0.7] [--only S01,S02]'); process.exit(2); }
const R = path.join(P, 'remotion'), tl = JSON.parse(fs.readFileSync(path.join(P, 'data/timeline.json'), 'utf8')), at = +opt('at', 0.7), only = opt('only') ? new Set(opt('only').split(',')) : null;
if (!fs.existsSync(path.join(R, 'node_modules'))) { console.error(`run "npm install" in ${R} first`); process.exit(1); }
const out = path.join(P, 'review/storyboard'); fs.mkdirSync(out, { recursive: true }); let fail = 0;
for (const s of tl.shots) {
  if (only && !only.has(s.id)) continue;
  const frame = Math.max(0, Math.min(Math.round(tl.duration * tl.fps) - 1, Math.round((s.start + (s.end - s.start) * at) * tl.fps)));
  const r = spawnSync('npx', ['remotion', 'still', 'src/index.ts', 'Reel', path.resolve(out, `${s.id}.png`), `--frame=${frame}`], { cwd: R, encoding: 'utf8' });
  if (r.status) { fail++; console.error(`${s.id} failed:\n${(r.stderr || r.stdout).slice(-600)}`); } else console.log(`${s.id} ${s.component} frame ${frame}`);
}
const TK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cs = spawnSync('node', [path.join(TK, 'tools/qa/contact_sheet.mjs'), out, path.join(P, 'review/storyboard.jpg'), '--cols', '6', '--width', '270'], { encoding: 'utf8' }); console.log((cs.stdout || cs.stderr).trim());
process.exit(fail ? 1 : 0);
