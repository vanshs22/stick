#!/usr/bin/env node
// Join the cached shot clips, lay the mix under them, normalise loudness.  node tools/assemble.mjs <project> [name]
// Needs renders/segments/index.json with every clip ready (tools/render_segments.mjs) and data/mix.wav.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const P = path.resolve(process.argv[2] || '.'), name = process.argv[3] || path.basename(P), seg = path.join(P, 'renders/segments');
const idx = JSON.parse(fs.readFileSync(path.join(seg, 'index.json'), 'utf8')), miss = idx.shots.filter((s) => !s.ready);
if (miss.length) { console.error(`clips missing for ${miss.map((s) => s.id).join(', ')}: run tools/render_segments.mjs first`); process.exit(1); }
const mix = path.join(P, 'data/mix.wav'), hasMix = fs.existsSync(mix), frames = idx.shots.at(-1).to + 1;
fs.writeFileSync(path.join(seg, 'list.txt'), idx.shots.map((s) => `file '${path.join(seg, s.file).replace(/'/g, "'\\''")}'`).join('\n'));
const raw = path.join(P, `renders/${name}.raw.mp4`), out = path.join(P, `renders/${name}.mp4`);
const ff = (args) => { const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { encoding: 'utf8' }); if (r.status) { console.error(r.stderr); process.exit(1); } };
ff(['-f', 'concat', '-safe', '0', '-i', path.join(seg, 'list.txt'), ...(hasMix ? ['-i', mix] : []), '-map', '0:v', ...(hasMix ? ['-map', '1:a', '-c:a', 'aac', '-b:a', '192k'] : []), '-c:v', 'copy', '-t', String(frames / idx.fps), raw]);
const qa = spawnSync('node', [path.join(path.dirname(fileURLToPath(import.meta.url)), 'qa/final_qa.mjs'), raw, out], { stdio: 'inherit' });
console.log(`assembled ${idx.shots.length} clips (${frames} frames) -> ${path.relative(P, out)}`); process.exit(qa.status || 0);
