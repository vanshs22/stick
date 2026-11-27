#!/usr/bin/env node
// Per-style motion preview + sample film, made from a REAL render of that style (never a mock-up).
//   node tools/style_samples.mjs --pack <style-id> --from <film.mp4> [--at 1.0] [--len 3]
//   writes style-packs/<id>/preview/motion.mp4 (a 3 s clip, 540x960, silent) and preview/sample.mp4 (the whole film with sound, 540x960, small) and records both in preview/index.json.
// Make the film first (any example of that style): node tools/acceptance.mjs <example> --stage all [--scale 0.5]
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { TK } from './lib/pipeline.mjs';
const a = process.argv.slice(2), opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
const id = opt('pack'), src = opt('from'); if (!id || !src || !fs.existsSync(src) || !fs.existsSync(path.join(TK, 'style-packs', id, 'style.json'))) { console.error('usage: style_samples.mjs --pack <style-id> --from <film.mp4> [--at 1.0] [--len 3]'); process.exit(2); }
const dir = path.join(TK, 'style-packs', id, 'preview'); fs.mkdirSync(dir, { recursive: true });
const ff = (args) => { const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { encoding: 'utf8' }); if (r.status) { console.error(r.stderr); process.exit(1); } };
const vf = 'scale=540:960:flags=lanczos,format=yuv420p', enc = ['-c:v', 'libx264', '-preset', 'medium', '-crf', '26', '-movflags', '+faststart'];
ff(['-ss', opt('at', '1.0'), '-t', opt('len', '3'), '-i', src, '-vf', vf, '-an', ...enc, path.join(dir, 'motion.mp4')]);
ff(['-i', src, '-vf', vf, ...enc, '-c:a', 'aac', '-b:a', '96k', path.join(dir, 'sample.mp4')]);
const f = path.join(dir, 'index.json'); let j = {}; try { j = JSON.parse(fs.readFileSync(f, 'utf8')); } catch { /* new */ }
j.pack = id; j.motion = 'motion.mp4'; j.sample = 'sample.mp4'; j.sample_source = path.basename(src); j.sample_made_at = new Date().toISOString(); fs.writeFileSync(f, JSON.stringify(j, null, 1));
const kb = (n) => Math.round(fs.statSync(path.join(dir, n)).size / 1024); console.log(`${id}: motion.mp4 ${kb('motion.mp4')} KB, sample.mp4 ${kb('sample.mp4')} KB`);
