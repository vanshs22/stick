#!/usr/bin/env node
// One still per shot (taken at 70 percent of the shot, when entrances have landed) + a contact sheet, so the storyboard and the build can be LOOKED at.
//   node tools/preview_shots.mjs <projectDir> [--at 0.7] [--only S03,S04]
// Output: review/storyboard/S01.png ... and review/storyboard.jpg (tile order = shot order). Needs `npm install` in <projectDir>/remotion.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const a = process.argv.slice(2), P = a[0], opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
if (!P) { console.error('usage: preview_shots.mjs <projectDir> [--at 0.7] [--only S01,S02]'); process.exit(2); }
// stills are drawn from data/timeline.json: if the storyboard (or script, style overrides, style pack) is newer, rebuild first, or you would LOOK at a stale picture
{ const mt = (f) => { try { return fs.statSync(path.join(P, f)).mtimeMs; } catch { return 0; } }, tlm = mt('data/timeline.json');
  if (['storyboard/storyboard.json', 'script/script.json', 'style-overrides.json', 'brief.json'].some((f) => mt(f) > tlm)) { const sync = spawnSync('node', ['-e', `import('${pathToFileURL(path.join(path.dirname(fileURLToPath(import.meta.url)), 'lib/pipeline.mjs')).href}').then(m=>{m.syncProject(${JSON.stringify(P)});m.timing(${JSON.stringify(P)})})`], { encoding: 'utf8' }); console.log(sync.status ? `could not refresh the timeline: ${(sync.stderr || '').slice(-200)}` : 'storyboard or style changed since the last timeline: rebuilt it first'); } }
{ const brief = JSON.parse(fs.readFileSync(path.join(P, 'brief.json'), 'utf8')), TKd = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), eng = (() => { try { return JSON.parse(fs.readFileSync(path.join(TKd, 'style-packs', brief.style_pack, 'style.json'), 'utf8')).engine; } catch { return null; } })();
  if (eng === 'inkbeat') {   // the inkbeat engine draws its own stills: 15/50/90 percent of each shot; the 50 percent one is the frame the user approves
    if (!fs.existsSync(path.join(P, 'ink-plan.json'))) { console.error('no ink-plan.json yet: node tools/ink/scaffold_plan.mjs ' + P); process.exit(1); }
    const pl = spawnSync('node', [path.join(TKd, 'tools/ink/plan.mjs'), path.join(P, 'ink-plan.json'), path.join(P, 'data/words.json')], { encoding: 'utf8' }); if (pl.status) { console.error(pl.stderr); process.exit(1); } const o = path.join(P, 'review/ink'); fs.mkdirSync(o, { recursive: true });
    const r0 = spawnSync('node', [path.join(TKd, 'tools/ink/stills.mjs'), o, '--scale', '0.5', ...(a.includes('--only') ? ['--only', a[a.indexOf('--only') + 1]] : [])], { encoding: 'utf8', maxBuffer: 1 << 26 }); console.log(r0.stdout.trim().split('\n').slice(-2).join('\n')); if (r0.status) { console.error(r0.stderr.slice(-600)); process.exit(1); }
    const out0 = path.join(P, 'review/storyboard'); fs.mkdirSync(out0, { recursive: true }); const shots = JSON.parse(fs.readFileSync(path.join(P, 'data/timeline.json'), 'utf8')).shots;
    for (const s of shots) { const c = fs.readdirSync(o).filter((f) => f.startsWith(s.id + '_') && f.endsWith('.jpg')).sort(); const mid = c[Math.floor(c.length / 2)]; if (mid) spawnSync('ffmpeg', ['-y', '-v', 'error', '-i', path.join(o, mid), path.join(out0, s.id + '.png')]); }
    const cs0 = spawnSync('node', [path.join(TKd, 'tools/qa/contact_sheet.mjs'), out0, path.join(P, 'review/storyboard.jpg'), '--cols', '6', '--width', '270'], { encoding: 'utf8' }); console.log((cs0.stdout || cs0.stderr).trim()); process.exit(0); } }
const R = path.join(P, 'remotion'), tl = JSON.parse(fs.readFileSync(path.join(P, 'data/timeline.json'), 'utf8')), at = +opt('at', 0.7), only = opt('only') ? new Set(opt('only').split(',')) : null;
if (!fs.existsSync(path.join(R, 'node_modules'))) { console.error(`run "npm install" in ${R} first`); process.exit(1); }
let sbp = {}; try { sbp = Object.fromEntries(JSON.parse(fs.readFileSync(path.join(P, 'storyboard/storyboard.json'), 'utf8')).shots.map((x) => [x.id, x.preview_at])); } catch { /* no storyboard file: default time */ }   // preview_at: a shot may name the moment that shows its final state (e.g. after a zoom)
const out = path.join(P, 'review/storyboard'); fs.mkdirSync(out, { recursive: true }); let fail = 0;
const LATE = new Set(['FlowDiagram', 'KineticList', 'Timeline', 'Checklist', 'BigStat', 'NotebookPage', 'Typewriter', 'Terminal', 'Highlight', 'Stamp', 'BrowserWindow', 'ProofCard', 'RouteMap', 'EvidenceCard', 'Versus']);   // these build up over the shot: show the finished state, just before the exit fade
for (const s of tl.shots) {
  if (only && !only.has(s.id)) continue;
  const dur = s.end - s.start, t = sbp[s.id] != null ? s.start + dur * +sbp[s.id] : LATE.has(s.component) ? Math.max(s.start + 0.7 * dur, s.end - 0.5) : s.start + dur * at;
  const frame = Math.max(0, Math.min(Math.round(tl.duration * tl.fps) - 1, Math.round(t * tl.fps)));
  const r = spawnSync('npx', ['remotion', 'still', 'src/index.ts', 'Reel', path.resolve(out, `${s.id}.png`), `--frame=${frame}`], { cwd: R, encoding: 'utf8', shell: process.platform === 'win32' });
  if (r.status) { fail++; console.error(`${s.id} failed:\n${(r.stderr || r.stdout).slice(-600)}`); } else console.log(`${s.id} ${s.component} frame ${frame}`);
}
const TK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cs = spawnSync('node', [path.join(TK, 'tools/qa/contact_sheet.mjs'), out, path.join(P, 'review/storyboard.jpg'), '--cols', '6', '--width', '270'], { encoding: 'utf8' }); console.log((cs.stdout || cs.stderr).trim());
process.exit(fail ? 1 : 0);
