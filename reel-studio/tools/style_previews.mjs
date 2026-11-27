#!/usr/bin/env node
// Renders REAL preview stills for every style pack with the real engine (not text, not mock-ups) into style-packs/<id>/preview/.
//   node tools/style_previews.mjs [--packs id,id] [--work <dir>]
// A 3D pack renders the shared test story (establishing, speaking, reaction); a 2D pack renders sample cards with its colours and type.
// Needs: node_modules for a Remotion project (REEL_NODE_MODULES=/path or it installs once into <work>/_shared), ffmpeg on PATH.
import fs from 'node:fs';
import path from 'node:path';
import { TK, PY, run, rd, syncProject, timing, stills, log } from './lib/pipeline.mjs';

const a = process.argv.slice(2), opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
const WORK = path.resolve(opt('work', process.env.REEL_WORK || path.join(TK, '.work')));
const SRC = {
  'voxel-explainer': { ex: 'experiment-voxel', shots: 'S01,S02,S05', status: 'stage3d' }, 'original-creatures': { ex: 'experiment-critter', shots: 'S01,S02,S05', status: 'stage3d' },
  'stylized-3d-presenter': { ex: 'experiment-presenter', shots: 'S01,S02,S05', status: 'stage3d' }, 'stickman-3d': { ex: 'experiment-stick', shots: 'S01,S02,S05', status: 'stage3d' },
  'roblox-inspired': { ex: 'experiment-roblox', shots: 'S01,S02,S05', status: 'stage3d' }, 'noir-3d': { ex: 'experiment-noir', shots: 'S01,S02,S05', status: 'stage3d' },
  'voxel-studio': { ex: 'voxel-howto', shots: 'S01,S02,S05', status: 'legacy-3d' },
};
const packs = (opt('packs') ? opt('packs').split(',') : fs.readdirSync(path.join(TK, 'style-packs')).filter((d) => fs.existsSync(path.join(TK, 'style-packs', d, 'style.json')) && d !== '_template'));
let nm = process.env.REEL_NODE_MODULES;
if (!nm) { const sh = path.join(WORK, '_shared/remotion'); fs.mkdirSync(sh, { recursive: true }); fs.copyFileSync(path.join(TK, 'remotion-template/package.json'), path.join(sh, 'package.json')); if (!fs.existsSync(path.join(sh, 'node_modules'))) { log('installing shared node_modules (once)...'); const r = run('npm', ['install', '--no-audit', '--no-fund', '--loglevel=error'], { cwd: sh }); if (r.status) { console.error(r.stderr); process.exit(1); } } nm = path.join(sh, 'node_modules'); }
let fail = 0;
for (const id of packs) {
  const pk = rd(path.join(TK, 'style-packs', id, 'style.json')), cb = pk.meta?.combined;
  const findExample = (pid) => { for (const d of fs.readdirSync(path.join(TK, 'examples'))) { try { if (rd(path.join(TK, 'examples', d, 'storyboard.json')).style_pack === pid && /^experiment-/.test(d)) return { ex: d, shots: 'S01,S03,S05', status: 'stage3d' }; } catch { /* not an example */ } } return null; };   // a new pack with an experiment-* example needs no entry above
  const S = cb ? { ...SRC[cb.character], status: 'combined', strip: true } : SRC[id] || findExample(id) || { ex: 'software-explainer', shots: 'S01,S04,S06', status: '2d' }, P = path.join(WORK, 'prev-' + id);
  fs.rmSync(P, { recursive: true, force: true });
  let r = run('node', [path.join(TK, 'tools/run_example.mjs'), S.ex, 'prev-' + id, '--dir', WORK]); if (r.status) { console.error(`${id}: ${r.stderr || r.stdout}`); fail++; continue; }
  if (S.strip) { const f = path.join(P, 'storyboard/storyboard.json'), sb = rd(f); for (const sh of sb.shots) if (sh.component === 'Stage3D') { delete sh.props.world; delete sh.props.worldOpts; delete sh.props.look; for (const c of sh.props.cast || []) delete c.look; } fs.writeFileSync(f, JSON.stringify(sb, null, 1)); }
  const b = rd(path.join(P, 'brief.json')); b.style_pack = id; fs.writeFileSync(path.join(P, 'brief.json'), JSON.stringify(b, null, 1));
  try { syncProject(P, { nodeModules: nm }); timing(P); } catch (e) { console.error(`${id}: ${e.message}`); fail++; continue; }
  const s = stills(P, S.shots); if (!s.ok) { console.error(`${id}: stills failed\n${s.out.slice(-500)}`); fail++; continue; }
  const out = path.join(TK, 'style-packs', id, 'preview'); fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
  S.shots.split(',').forEach((sh, i) => { const png = path.join(P, 'review/storyboard', sh + '.png'), jpg = path.join(out, `${String(i + 1).padStart(2, '0')}.jpg`); const f = run('ffmpeg', ['-y', '-v', 'error', '-i', png, '-vf', 'scale=540:-2', '-q:v', '3', jpg]); if (f.status) { console.error('ffmpeg is needed to make the preview jpgs: ' + f.stderr); fail++; } });
  fs.writeFileSync(path.join(out, 'index.json'), JSON.stringify({ pack: id, status: S.status, example: S.ex, shots: S.shots.split(','), rendered_at: new Date().toISOString() }, null, 1));
  log(`${id}: ${S.status}, ${S.shots}`);
}
process.exit(fail ? 1 : 0);
