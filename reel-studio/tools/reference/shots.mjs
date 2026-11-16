#!/usr/bin/env node
// Cut-by-cut analysis of a reference video (ffmpeg only): where the cuts are, how long each shot lasts, one frame per shot, a contact sheet.
//   node tools/reference/shots.mjs <video> <outDir> [--threshold 0.3]
// -> outDir/shots.json, outDir/shot_01.jpg ..., outDir/sheet.jpg. The agent then LOOKS at the sheet and writes down, per shot:
//    what is on screen, the camera, the typography, the overlay, the transition, the sound. Learn the technique, never copy the work.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import '../lib/pipeline.mjs';   // puts the installer's ffmpeg fallback on PATH

const a = process.argv.slice(2), [src, out] = a, th = a.includes('--threshold') ? +a[a.indexOf('--threshold') + 1] : 0.3;
if (!src || !out) { console.error('usage: shots.mjs <video> <outDir> [--threshold 0.3]'); process.exit(2); }
fs.mkdirSync(out, { recursive: true });
const dur = +spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', src], { encoding: 'utf8' }).stdout;
const log = spawnSync('ffmpeg', ['-hide_banner', '-i', src, '-vf', `select='gt(scene,${th})',showinfo`, '-an', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 1 << 27 }).stderr;
const cuts = [0, ...[...log.matchAll(/pts_time:([\d.]+)/g)].map((m) => +m[1]).filter((t) => t > 0.2 && t < dur - 0.2)].filter((t, i, v) => !i || t - v[i - 1] > 0.25);
const shots = cuts.map((s, i) => { const e = i + 1 < cuts.length ? cuts[i + 1] : dur, mid = s + Math.min(0.35, (e - s) / 2), file = `shot_${String(i + 1).padStart(2, '0')}.jpg`;
  spawnSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(mid), '-i', src, '-frames:v', '1', '-vf', 'scale=360:-2', '-q:v', '3', path.join(out, file)]); return { n: i + 1, start: +s.toFixed(2), end: +e.toFixed(2), seconds: +(e - s).toFixed(2), frame: file }; });
const cols = 8; spawnSync('ffmpeg', ['-v', 'error', '-y', '-framerate', '1', '-pattern_type', 'glob', '-i', path.join(out, 'shot_*.jpg'), '-vf', `scale=216:-2,tile=${cols}x${Math.ceil(shots.length / cols)}:padding=4:color=black`, '-frames:v', '1', '-q:v', '3', path.join(out, 'sheet.jpg')]);
const res = { video: path.basename(src), duration: +dur.toFixed(2), shots: shots.length, avg_shot_sec: +(dur / shots.length).toFixed(2), cuts_per_10s: +(shots.length / dur * 10).toFixed(2), list: shots };
fs.writeFileSync(path.join(out, 'shots.json'), JSON.stringify(res, null, 1)); console.log(`${shots.length} shots, avg ${res.avg_shot_sec}s, ${res.cuts_per_10s} cuts/10s -> ${out}/sheet.jpg (tile n = shot n, left to right)`);
