#!/usr/bin/env node
// Numbers about a set of frames (JPG/PNG): brightness and contrast. A cheap, objective check next to the agent's own eyes.
//   node tools/qa/frame_stats.mjs <folder-or-image> [more...] [--min-luma 48] [--dark-share 0.34] [--min-contrast 60]
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import '../lib/pipeline.mjs';   // puts the installer's ffmpeg fallback on PATH

const a = process.argv.slice(2), opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? +a[i + 1] : d; }, args = a.filter((x, i) => !x.startsWith('--') && !(i && a[i - 1].startsWith('--')));
const files = args.flatMap((p) => (fs.statSync(p).isDirectory() ? fs.readdirSync(p).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort().map((f) => path.join(p, f)) : [p]));
if (!files.length) { console.error('usage: frame_stats.mjs <folder|image...>'); process.exit(2); }
const rows = files.map((f) => { const r = spawnSync('ffmpeg', ['-v', 'error', '-i', f, '-vf', 'signalstats,metadata=print:file=-', '-f', 'null', '-'], { encoding: 'utf8' }), g = (k) => +((r.stdout + r.stderr).match(new RegExp(`${k}=([\\d.]+)`)) || [0, NaN])[1]; return { file: f, luma: g('YAVG'), low: g('YLOW'), high: g('YHIGH') }; });
const med = (v) => [...v].sort((x, y) => x - y)[Math.floor(v.length / 2)], luma = med(rows.map((r) => r.luma)), dark = rows.filter((r) => r.luma < 45).length / rows.length, contrast = med(rows.map((r) => r.high - r.low));
const issues = []; if (luma < opt('min-luma', 48)) issues.push(`too dark: median luma ${luma.toFixed(0)}`); if (dark > opt('dark-share', 0.34)) issues.push(`${(dark * 100).toFixed(0)}% of frames are very dark`); if (contrast < opt('min-contrast', 60)) issues.push(`low contrast (${contrast}): looks flat or washed out`);
console.log(JSON.stringify({ frames: rows.length, median_luma: +luma.toFixed(1), dark_share: +dark.toFixed(2), contrast, pass: !issues.length, issues, per_frame: rows.map((r) => ({ file: path.basename(r.file), luma: +r.luma.toFixed(1) })) }, null, 1)); process.exit(issues.length ? 1 : 0);
