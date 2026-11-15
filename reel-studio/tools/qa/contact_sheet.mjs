#!/usr/bin/env node
// A contact sheet the agent (and you) can LOOK at: one tile every N seconds, left to right, top to bottom.
//   node tools/qa/contact_sheet.mjs <video.mp4 | folder> <out.jpg> [--every 0.5] [--cols 8] [--width 216]
// Writes <out>.json with the time of every tile, so a problem on tile 17 can be traced to a timestamp.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

const a = process.argv.slice(2), opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? +a[i + 1] : d; }, pos = a.filter((x, i) => !x.startsWith('--') && !(i && a[i - 1].startsWith('--')));
const [src, out] = pos; if (!src || !out) { console.error('usage: contact_sheet.mjs <video|folder> <out.jpg> [--every 0.5] [--cols 8] [--width 216]'); process.exit(2); }
const cols = opt('cols', 8), width = opt('width', 216), every = opt('every', 0.5); let n, vf, input;
if (fs.statSync(src).isDirectory()) { const files = fs.readdirSync(src).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort(); n = files.length; input = ['-pattern_type', 'glob', '-framerate', '1', '-i', `${src}/*.${/\.png$/i.test(files[0] || '') ? 'png' : 'jpg'}`]; vf = `scale=${width}:-2,tile=${cols}x${Math.ceil(n / cols)}:padding=4:color=black`; }
else { const d = +spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', src], { encoding: 'utf8' }).stdout; n = Math.floor(d / every); input = ['-i', src]; vf = `fps=1/${every},scale=${width}:-2,tile=${cols}x${Math.ceil(n / cols)}:padding=4:color=black`; }
const r = spawnSync('ffmpeg', ['-v', 'error', '-y', ...input, '-vf', vf, '-frames:v', '1', '-q:v', '3', out], { encoding: 'utf8' }); if (r.status) { console.error(r.stderr); process.exit(1); }
fs.writeFileSync(out.replace(/\.\w+$/, '') + '.json', JSON.stringify({ tiles: n, every_sec: every, cols, times: Array.from({ length: n }, (_, i) => +(every / 2 + i * every).toFixed(2)) })); console.log(`${out}: ${n} tiles, one per ${every} s, ${cols} per row`);
