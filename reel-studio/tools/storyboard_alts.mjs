#!/usr/bin/env node
// Alternative compositions for ONE shot, rendered as frames next to the current one, so the user can pick by looking.
//   node tools/storyboard_alts.mjs <P> <shotId> [--n 3] [--alts file.json]
// Stage3D shots: a library of camera variants (tighter, wider, low/high angle, profile, over-the-shoulder), each checked by the
// cinematography critic against its neighbours; only variants that pass are shown. Other shots: pass --alts with prop patches.
// Output: review/alternatives/<shot>-A..D.png, <shot>.json (the patches), <shot>-alts.jpg (the sheet). Apply one with storyboard_edit.mjs --alt B.
import fs from 'node:fs';
import path from 'node:path';
import { TK, run, rd, syncProject, timing, stills, thumb, deepMerge, defaultGL } from './lib/pipeline.mjs';

const a = process.argv.slice(2), P = path.resolve(a[0] || ''), shotId = a[1], opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
if (!a[0] || !shotId) { console.error('usage: storyboard_alts.mjs <projectDir> <shotId> [--n 3] [--alts file.json]'); process.exit(2); }
const script = rd(path.join(P, 'script/script.json')), N = +opt('n', 3), R = path.join(P, 'remotion'), sbFile = path.join(P, 'storyboard/storyboard.json'), sb = rd(sbFile), shot = sb.shots.find((s) => s.id === shotId); if (!shot) { console.error(`no shot ${shotId}`); process.exit(1); }
syncProject(P); timing(P);
const ORDER = ['extreme-wide', 'wide', 'medium-wide', 'medium', 'medium-close-up', 'close-up'];
const cam0 = shot.props?.camera, cands = [];
if (opt('alts')) rd(opt('alts')).forEach((p, i) => cands.push({ name: p.name || `Option ${i + 1}`, patch: p.patch || p }));
else if (shot.component === 'Stage3D' && cam0) {
  const i = ORDER.indexOf(cam0.framing), mv = { movement: { type: 'static' } }, cast = (shot.props.cast || []).map((c) => c.id), obj = (shot.props.props3d || []).map((p) => p.id);
  if (i >= 0 && i < ORDER.length - 1) cands.push({ name: `Tighter (${ORDER[i + 1]})`, patch: { props: { camera: { framing: ORDER[i + 1], ...mv } } } });
  if (i > 0) cands.push({ name: `Wider (${ORDER[i - 1]})`, patch: { props: { camera: { framing: ORDER[i - 1], ...mv } } } });
  cands.push({ name: 'Low angle (heroic)', patch: { props: { camera: { angle: 'low-angle', ...mv } } } });
  cands.push({ name: 'High angle (small, exposed)', patch: { props: { camera: { angle: 'high-angle', ...mv } } } });
  if (cast[0] && obj[0]) cands.push({ name: 'Over the shoulder', patch: { props: { camera: { framing: 'over-the-shoulder', subject: cast[0], target: obj[0], back: 1.9, shoulderOffset: 0.8, lift: 0.5, fov: 34, angle: 'eye-level', az: null, ...mv } } } });
  cands.push({ name: 'Profile', patch: { props: { camera: { angle: 'profile', az: cam0.az != null && cam0.az < 0 ? -90 : 90, ...mv } } } });
  if (cam0.movement?.type && cam0.movement.type !== 'static') cands.push({ name: 'Locked off (no move)', patch: { props: { camera: { movement: { type: 'static' } } } } });
} else { console.error('this shot is not Stage3D: pass --alts file.json with [{"name":"...","patch":{...props patch...}}]'); process.exit(1); }
// keep only variants the critic accepts in the context of the neighbours
const tmp = path.join(P, '_alts'); fs.mkdirSync(tmp, { recursive: true });
const good = []; for (const c of cands) { if (good.length >= N) break; const t = JSON.parse(JSON.stringify(sb)), s = t.shots.find((x) => x.id === shotId); Object.assign(s, deepMerge(s, c.patch)); fs.mkdirSync(path.join(tmp, 'storyboard'), { recursive: true }); fs.writeFileSync(path.join(tmp, 'storyboard/storyboard.json'), JSON.stringify(t)); fs.mkdirSync(path.join(tmp, 'data'), { recursive: true }); if (fs.existsSync(path.join(P, 'data/timeline.json'))) fs.copyFileSync(path.join(P, 'data/timeline.json'), path.join(tmp, 'data/timeline.json')); const r = run('node', ['--no-warnings', path.join(TK, 'tools/check_cinematography.mjs'), tmp, '--out', path.join(tmp, 'c.json')]); const rep = rd(path.join(tmp, 'c.json')), mine = rep.findings.filter((f) => f.shot_id === shotId && f.severity !== 'minor'); if (!mine.length) good.push(c); else console.log(`skipped "${c.name}": ${mine[0].problem}`); }
fs.rmSync(tmp, { recursive: true, force: true });
if (!good.length) { console.error('no alternative passes the cinematography critic for this shot'); process.exit(1); }
const out = path.join(P, 'review/alternatives'); fs.mkdirSync(out, { recursive: true });
const tlFile = path.join(R, 'src/data/timeline.json'), tl0 = fs.readFileSync(tlFile, 'utf8'), tl = JSON.parse(tl0), letters = 'ABCD'; const all = [{ name: 'Current', patch: {} }, ...good]; const items = [];
try {
  for (let i = 0; i < all.length; i++) { const t = JSON.parse(tl0), s = t.shots.find((x) => x.id === shotId); Object.assign(s, deepMerge(s, all[i].patch)); fs.writeFileSync(tlFile, JSON.stringify(t)); const r = stills(P, shotId); if (!r.ok) throw new Error(r.out.slice(-400)); const png = path.join(out, `${shotId}-${letters[i]}.png`); fs.copyFileSync(path.join(P, 'review/storyboard', shotId + '.png'), png); const j = thumb(png, png.replace('.png', '.jpg')); fs.mkdirSync(path.join(R, 'public/gallery'), { recursive: true }); fs.copyFileSync(j, path.join(R, 'public/gallery', `alt-${shotId}-${letters[i]}.jpg`)); const c = deepMerge(shot.props?.camera || {}, all[i].patch.props?.camera || {}); items.push({ letter: letters[i], name: all[i].name, img: `gallery/alt-${shotId}-${letters[i]}.jpg`, cam: all[i].name === 'Current' ? `${c.framing} / ${c.angle || 'eye-level'}` : `${c.framing} / ${c.angle || 'eye-level'}${c.az != null ? ' az ' + c.az : ''}` }); }
} finally { fs.writeFileSync(tlFile, tl0); }
fs.writeFileSync(path.join(out, `${shotId}.json`), JSON.stringify(all.map((x, i) => ({ letter: letters[i], ...x })), null, 1));
const f = path.join(out, `_props-${shotId}.json`); fs.writeFileSync(f, JSON.stringify({ kind: 'alts', title: `${shotId}: pick a composition`, subtitle: `"${(shot.line_ids || []).map((l) => script.lines.find((x) => x.id === l)?.text || l).join(' ')}" - A is the current frame`, items }));
const png = path.join(out, `${shotId}-alts.png`), r = run('npx', ['remotion', 'still', 'src/index.ts', 'Sheet', png, `--props=${f}`], { cwd: R, env: { ...process.env, REMOTION_GL: defaultGL() } }); if (r.status) { console.error(r.stderr.slice(-400)); process.exit(1); }
console.log(thumb(png, png.replace('.png', '.jpg'), 1080) + `\nchoices: ${items.map((i) => `${i.letter}=${i.name}`).join(' | ')}\napply: node tools/storyboard_edit.mjs ${P} ${shotId} --alt B`);
