#!/usr/bin/env node
// Seconds per frame of the inkbeat renderer for each quality tier, on the machine you have (software GL is slow, a GPU is not).
//   node tools/ink/bench.mjs [--frames 18] [--from 120] [--scale 0.65] [--tiers master,fast,draft]   (needs a plan: renderers/inkbeat/src/story/plan.gen.ts, made by tools/ink/plan.mjs)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { TK, defaultGL } from '../lib/pipeline.mjs';
const a = process.argv.slice(2), opt = (k, d) => (a.includes('--' + k) ? a[a.indexOf('--' + k) + 1] : d), N = +opt('frames', 18), from = +opt('from', 120), scale = +opt('scale', 0.65), tiers = opt('tiers', 'master,fast,draft').split(',');
const R = path.join(TK, 'renderers/inkbeat'), req = createRequire(path.join(R, 'package.json')), { bundle } = req('@remotion/bundler'), { renderMedia, selectComposition } = req('@remotion/renderer');
const conc = Number(process.env.REMOTION_CONCURRENCY || Math.min(3, Math.max(2, os.cpus().length - 2))), out = [];
const serveUrl = await bundle({ entryPoint: path.join(R, 'src/index.ts'), publicDir: path.join(R, 'public'), onProgress: () => {} }), chromiumOptions = { gl: defaultGL() };
for (const q of tiers) {
  const comp = await selectComposition({ serveUrl, id: 'Story', inputProps: { sub: false, quality: q }, chromiumOptions });
  const f = path.join(os.tmpdir(), `bench-${q}.mp4`), t0 = Date.now(); await renderMedia({ composition: comp, serveUrl, codec: 'h264', outputLocation: f, inputProps: { sub: false, quality: q }, frameRange: [from, from + N - 1], muted: true, scale, concurrency: conc, chromiumOptions, overwrite: true, timeoutInMilliseconds: 600000, onBrowserLog: (l) => { if (String(l.text).startsWith('PROF')) console.log(l.text); } });
  const s = (Date.now() - t0) / 1000; out.push({ quality: q, s_per_frame: +(s / N).toFixed(2), frames: N, concurrency: conc, scale }); console.log(`${q}: ${(s / N).toFixed(2)} s per frame (${N} frames, ${s.toFixed(0)} s, concurrency ${conc})`); fs.copyFileSync(f, path.join(process.cwd(), `bench-${q}.mp4`));
}
