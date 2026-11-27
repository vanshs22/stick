#!/usr/bin/env node
// The inkbeat engine through the SAME build as every other film: one silent clip per timeline shot, cached by content hash, in renders/segments/ with the same index.json,
// so tools/assemble.mjs (mix, loudness, 4K), final QA, the critics and the gates run unchanged.
//   node tools/ink/render_segments_ink.mjs <project> [--scale 0.5] [--shots S02,S04] [--force] [--fps-div 1] [--quality master|fast|draft] [--shard i/n]
// Needs: <project>/ink-plan.json, <project>/data/words.json (build_video makes the words), `npm install` in renderers/inkbeat (install.sh --with-inkbeat).
// Cost: software GL renders a 3D still in about 15 s at 1080x1920, so a 30 s film is hours without a GPU: iterate with --scale 0.25 and stills (tools/ink/stills.mjs), then render the master once. Shots are cached: an interrupted render resumes.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
import { TK, defaultGL, run, BROWSER_OPTS } from '../lib/pipeline.mjs';
const a = process.argv.slice(2), P = path.resolve(a[0] || '.'), opt = (k, d) => (a.includes(k) ? a[a.indexOf(k) + 1] : d), scale0 = Number(opt('--scale', 1)), only = (opt('--shots', '') || '').split(',').filter(Boolean), force = a.includes('--force'), div = Math.max(1, Math.min(4, Number(opt('--fps-div', 1)) || 1));   // --fps-div 2: render every 2nd frame and repeat it (animation on twos, 2x faster; the camera steps at 15 fps, so use it for drafts and drawn looks)
// the encoder needs whole-pixel sizes: snap the scale to the nearest hundredth whose 1080 and 1920 products are integers (0.667 gave 1279.97 px and failed after the render started)
const scale = [0, 0.01, -0.01, 0.02, -0.02, 0.03, -0.03, 0.04, -0.04, 0.05, -0.05].map((d) => Math.round((scale0 + d) * 100) / 100).find((x) => x > 0 && Number.isInteger(1080 * x) && Number.isInteger(1920 * x) && Number.isInteger(1920 * x / 2) ) ?? 1; if (scale !== scale0) console.log(`scale ${scale0} -> ${scale} (whole-pixel frame size)`);
const quality = opt('--quality', 'master'); if (!['master', 'fast', 'draft'].includes(quality)) { console.error('--quality master|fast|draft'); process.exit(2); } // passed to the renderer as an input prop (core/quality.ts)
const R = path.join(TK, 'renderers/inkbeat'), req = createRequire(path.join(R, 'package.json'));
if (!fs.existsSync(path.join(R, 'node_modules'))) { console.error(`run "npm install" in ${R} first (bash install.sh --with-inkbeat)`); process.exit(1); }
if (!fs.existsSync(path.join(P, 'ink-plan.json'))) { console.error('no ink-plan.json: node tools/ink/scaffold_plan.mjs <project>, then improve it'); process.exit(1); }
const tlDur = JSON.parse(fs.readFileSync(path.join(P, 'data/timeline.json'), 'utf8')).duration, pl = spawnSync('node', [path.join(TK, 'tools/ink/plan.mjs'), path.join(P, 'ink-plan.json'), path.join(P, 'data/words.json'), path.join(TK, 'renderers/inkbeat'), '--duration', String(tlDur)], { encoding: 'utf8' }); process.stdout.write(pl.stdout); if (pl.status) { console.error(pl.stderr); process.exit(1); }
const { bundle } = req('@remotion/bundler'), { renderMedia, selectComposition } = req('@remotion/renderer'), TL = JSON.parse(fs.readFileSync(path.join(P, 'data/timeline.json'), 'utf8')), PLAN = JSON.parse((s => s.slice(s.indexOf('{'), s.lastIndexOf('}') + 1))(fs.readFileSync(path.join(R, 'src/story/plan.gen.ts'), 'utf8'))), fps = PLAN.fps, fr = (s) => Math.round(s * fps);
const h = (...x) => crypto.createHash('sha1').update(x.map((v) => (typeof v === 'string' ? v : JSON.stringify(v))).join('|')).digest('hex').slice(0, 10);
const walk = (d) => fs.existsSync(d) ? fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? (e.name === 'node_modules' ? [] : walk(path.join(d, e.name))) : [path.join(d, e.name)]) : [];
const code = h(walk(path.join(R, 'src')).filter((f) => !/plan\.(gen|resolved)|captions\.srt/.test(f)).map((f) => `${path.relative(R, f)}:${h(fs.readFileSync(f, 'utf8'))}`));
const dir = path.join(P, 'renders/segments'); fs.mkdirSync(dir, { recursive: true });
const plan = TL.shots.map((s, i) => { const from = fr(s.start), to = Math.min(PLAN.duration - 1, (i === TL.shots.length - 1 ? fr(TL.duration) : fr(s.end)) - 1), inRange = PLAN.shots.filter((x) => x.end > s.start && x.t < s.end), words = PLAN.words.filter((w) => w[2] > s.start && w[1] < s.end); return { id: s.id, from, to, hash: h(code, PLAN.lookSpec ?? '', inRange, words, s.start - 0, scale, PLAN.size, fps, from, to, div, quality) }; }).map((p) => ({ ...p, file: path.join(dir, `${p.id}-${p.hash}.mp4`) }));
const [shI, shN] = (opt('--shard', '0/1') || '0/1').split('/').map(Number);   // --shard 1/3: this machine renders every 3rd shot (starting at the 2nd); run the others elsewhere, copy renders/segments together, then build_video assembles
const todo = plan.filter((p, i) => (force || !fs.existsSync(p.file)) && (!only.length || only.includes(p.id)) && i % shN === shI);
console.log(`${plan.length} shots, ${plan.length - todo.length} cached, ${todo.length} to render${todo.length ? ': ' + todo.map((p) => p.id).join(', ') : ''}`);
if (todo.length) {
  const t0 = Date.now(), serveUrl = await bundle({ entryPoint: path.join(R, 'src/index.ts'), publicDir: path.join(R, 'public'), onProgress: () => {} }), chromiumOptions = { gl: defaultGL() }, comp = await selectComposition({ serveUrl, id: 'Story', inputProps: { sub: false, quality }, chromiumOptions, ...BROWSER_OPTS });
  for (const p of todo) { const tmp = p.file + '.part.mp4'; const t1 = Date.now();
    await renderMedia({ composition: comp, serveUrl, codec: 'h264', outputLocation: tmp, inputProps: { sub: false, quality }, frameRange: [p.from, p.to], muted: true, scale, everyNthFrame: div, concurrency: Number(process.env.REMOTION_CONCURRENCY || Math.min(3, Math.max(2, os.cpus().length - 2))), timeoutInMilliseconds: 600000, chromiumOptions, ...BROWSER_OPTS, overwrite: true });
    if (div > 1) { const dup = p.file + '.dup.mp4', r = run('ffmpeg', ['-y', '-v', 'error', '-i', tmp, '-vf', `fps=${fps}`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '14', '-preset', 'fast', dup]); if (r.status) { console.error(r.stderr); process.exit(1); } fs.rmSync(tmp); fs.renameSync(dup, p.file); } else fs.renameSync(tmp, p.file); console.log(`  ${p.id}: frames ${p.from}-${p.to} -> ${path.basename(p.file)} (${((Date.now() - t1) / (p.to - p.from + 1) / 1000).toFixed(1)} s per frame)`); }
  console.log(`rendered in ${Math.round((Date.now() - t0) / 1000)} s`);
}
const keep = new Set(plan.map((p) => path.basename(p.file))); for (const f of fs.readdirSync(dir)) if (f.endsWith('.mp4') && !keep.has(f)) fs.rmSync(path.join(dir, f));
fs.writeFileSync(path.join(dir, 'index.json'), JSON.stringify({ scale, fps, shots: plan.map((p) => ({ id: p.id, from: p.from, to: p.to, file: path.basename(p.file), ready: fs.existsSync(p.file) })) }, null, 1));
