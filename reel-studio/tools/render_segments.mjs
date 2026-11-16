#!/usr/bin/env node
// Render each shot as its own silent clip with the Remotion Node API, cached by content hash.
// Change one shot and only that shot (plus the shots whose captions/timing it moves) re-renders.
//   node tools/render_segments.mjs <project> [--scale 0.5] [--shots S02,S04] [--force]
// Output: renders/segments/<shot>-<hash>.mp4 + renders/segments/index.json.  Then: node tools/assemble.mjs <project>
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
const a = process.argv.slice(2), P = path.resolve(a[0] || '.'), opt = (k, d) => (a.includes(k) ? a[a.indexOf(k) + 1] : d);
const scale = Number(opt('--scale', 1)), only = opt('--shots', '')?.split(',').filter(Boolean), force = a.includes('--force');
const R = path.join(P, 'remotion'), req = createRequire(path.join(R, 'package.json'));
const { bundle } = req('@remotion/bundler'), { renderMedia, selectComposition } = req('@remotion/renderer');
const TL = JSON.parse(fs.readFileSync(path.join(P, 'data/timeline.json'), 'utf8')), fps = TL.fps, fr = (s) => Math.round(s * fps);
const walk = (d, f) => fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? (e.name === 'node_modules' ? [] : walk(path.join(d, e.name), f)) : [f(path.join(d, e.name))])) : [];
const h = (...x) => crypto.createHash('sha1').update(x.map((v) => (typeof v === 'string' ? v : JSON.stringify(v))).join('|')).digest('hex').slice(0, 10);
// everything that is not the timeline: components, engine, style/typography/caption data, public assets
const rel = (f) => path.relative(R, f).split(path.sep).join('/'), isRemocn = (f) => /^src\/remocn\//.test(rel(f)) || rel(f) === 'src/data/remocn-registry.ts';
const code = h(walk(path.join(R, 'src'), (f) => (f.endsWith('data/timeline.json') || isRemocn(f) ? '' : `${rel(f)}:${fs.readFileSync(f).length}:${h(fs.readFileSync(f, 'utf8'))}`)));   // installing a remocn component must not re-render shots that do not use it
const remocnCode = h(walk(path.join(R, 'src/remocn'), (f) => `${rel(f)}:${h(fs.readFileSync(f, 'utf8'))}`));
const pub = h(walk(path.join(R, 'public'), (f) => `${path.relative(R, f)}:${fs.statSync(f).size}`));
// times are hashed RELATIVE to the shot start: a shot that only moved in time (an earlier shot got longer) renders the same pictures and keeps its cache
const REL = new Set(['start', 'end', 't0', 't1', 't', 'at', 'from', 'to']);
const rebase = (x, o) => (Array.isArray(x) ? x.map((v) => rebase(v, o)) : x && typeof x === 'object' ? Object.fromEntries(Object.entries(x).map(([k, v]) => [k, typeof v === 'number' && REL.has(k) && v > 0.5 * 0 && Number.isFinite(v) && k !== 'from' && k !== 'to' ? +(v - o).toFixed(3) : rebase(v, o)])) : x);
const hashOf = (s, i) => {
  const t0 = s.start, t1 = s.end, chunks = (TL.captions?.chunks || []).filter((c) => c.t1 > t0 && c.t0 < t1), anchors = Object.fromEntries(Object.entries(s.anchors || {}).map(([k, v]) => [k, +(v - t0).toFixed(3)]));
  const shot = { ...rebase({ ...s, anchors: undefined, props: undefined }, t0), anchors, props: s.props }, uses = s.component === 'RemocnBlock' ? remocnCode : '';
  return h(shot, rebase(chunks, t0), code, uses, pub, scale, TL.width, TL.height, fps, i === TL.shots.length - 1 ? +(TL.duration - t0).toFixed(3) : +(t1 - t0).toFixed(3));
};
const dir = path.join(P, 'renders/segments'); fs.mkdirSync(dir, { recursive: true });
const plan = TL.shots.map((s, i) => ({ id: s.id, from: fr(s.start), to: (i === TL.shots.length - 1 ? fr(TL.duration) : fr(s.end)) - 1, hash: hashOf(s, i) })).map((p) => ({ ...p, file: path.join(dir, `${p.id}-${p.hash}.mp4`) }));
const todo = plan.filter((p) => (force || !fs.existsSync(p.file)) && (!only?.length || only.includes(p.id)));
if (a.includes('--dry')) { console.log(plan.map((p) => `${p.id} ${p.hash}`).join('\n')); process.exit(0); }
console.log(`${plan.length} shots, ${plan.length - todo.length} cached, ${todo.length} to render${todo.length ? ': ' + todo.map((p) => p.id).join(', ') : ''}`);
if (todo.length) {
  const t0 = Date.now(), serveUrl = await bundle({ entryPoint: path.join(R, 'src/index.ts'), publicDir: path.join(R, 'public'), onProgress: () => {} });
  const chromiumOptions = { gl: process.env.REMOTION_GL || undefined }, comp = await selectComposition({ serveUrl, id: 'Reel', inputProps: { captions: true, safeZones: false }, chromiumOptions });
  for (const p of todo) {
    const tmp = p.file + '.part.mp4';
    await renderMedia({ composition: comp, serveUrl, codec: 'h264', outputLocation: tmp, inputProps: { captions: true, safeZones: false }, frameRange: [p.from, p.to], muted: true, scale, concurrency: Number(process.env.REMOTION_CONCURRENCY || 4), timeoutInMilliseconds: 300000, chromiumOptions, overwrite: true });
    fs.renameSync(tmp, p.file); console.log(`  ${p.id}: frames ${p.from}-${p.to} -> ${path.basename(p.file)}`);
  }
  console.log(`rendered in ${Math.round((Date.now() - t0) / 1000)} s`);
}
// drop clips that no current shot uses
const keep = new Set(plan.map((p) => path.basename(p.file))); for (const f of fs.readdirSync(dir)) if (f.endsWith('.mp4') && !keep.has(f)) fs.rmSync(path.join(dir, f));
fs.writeFileSync(path.join(dir, 'index.json'), JSON.stringify({ scale, fps, shots: plan.map((p) => ({ id: p.id, from: p.from, to: p.to, file: path.basename(p.file), ready: fs.existsSync(p.file) })) }, null, 1));
