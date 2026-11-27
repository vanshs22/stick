#!/usr/bin/env node
// Layout probe: renders a few real frames of every shot with the Remotion Node API and collects where text, cards and captions LANDED (the Reel's LayoutProbe logs them from the browser).
//   node tools/layout_probe.mjs <projectDir> [--at 0.35,0.7,0.95] [--scale 0.5] [--shots S01,S02]   -> <projectDir>/review/layout/probe.json (+ the stills)
// Works for every engine/style and both layouts: the critic (tools/critics/layout.mjs) turns this into findings.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { BROWSER_OPTS } from './lib/pipeline.mjs';
const a = process.argv.slice(2), P = path.resolve(a[0] || '.'), opt = (k, d) => (a.includes('--' + k) ? a[a.indexOf('--' + k) + 1] : d);
const R = path.join(P, 'remotion'), req = createRequire(path.join(R, 'package.json')), { bundle } = req('@remotion/bundler'), { renderStill, selectComposition } = req('@remotion/renderer');
const TL = JSON.parse(fs.readFileSync(path.join(P, 'data/timeline.json'), 'utf8')), at = opt('at', '0.35,0.7,0.95').split(',').map(Number), only = opt('shots', '').split(',').filter(Boolean), scale = +opt('scale', 0.5);
const out = path.join(P, 'review/layout'); fs.mkdirSync(out, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.join(R, 'src/index.ts'), publicDir: path.join(R, 'public'), onProgress: () => {} });
const chromiumOptions = { gl: process.env.REMOTION_GL || undefined }, logs = [], inputProps = { captions: true, safeZones: false, probe: true };
const comp = await selectComposition({ serveUrl, id: 'Reel', inputProps, chromiumOptions, ...BROWSER_OPTS });
const res = [];
for (const s of TL.shots) { if (only.length && !only.includes(s.id)) continue;
  for (const u of at) { const t = s.start + (s.end - s.start) * u, frame = Math.max(0, Math.min(comp.durationInFrames - 1, Math.round(t * TL.fps))); logs.length = 0;
    await renderStill({ composition: comp, serveUrl, output: path.join(out, `${s.id}_${Math.round(u * 100)}.png`), frame, inputProps, scale, chromiumOptions, ...BROWSER_OPTS, onBrowserLog: (l) => { if (l.text?.startsWith('__LAYOUT__')) logs.push(l.text.slice(10)); } });
    const last = logs.at(-1); if (last) res.push({ shot: s.id, component: s.component, u, t: +t.toFixed(2), ...JSON.parse(last) }); else res.push({ shot: s.id, component: s.component, u, t: +t.toFixed(2), error: 'no probe output' }); } }
fs.writeFileSync(path.join(out, 'probe.json'), JSON.stringify({ width: TL.width, height: TL.height, frames: res }, null, 1)); console.log(`probed ${res.length} frames -> ${path.join(out, 'probe.json')}`);
