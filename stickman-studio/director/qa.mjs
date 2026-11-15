#!/usr/bin/env node
// Final pass on a rendered video: measure loudness, normalise to -14 LUFS (two-pass loudnorm, video stream copied untouched),
// then check the result for black frames, frozen stretches, clipping, duration and size. Writes qa.json next to the video.
//   node qa.mjs raw.mp4 final.mp4
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

const [src, dst] = process.argv.slice(2), ff = (args) => spawnSync('ffmpeg', ['-hide_banner', '-nostats', ...args], { encoding: 'utf8', maxBuffer: 1 << 26 });
const json = (t) => { const m = t.match(/\{[^{}]*"input_i"[^{}]*\}/s); return m ? JSON.parse(m[0]) : null; };
const m1 = json(ff(['-i', src, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-']).stderr);
const af = m1 ? `loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=${m1.input_i}:measured_TP=${m1.input_tp}:measured_LRA=${m1.input_lra}:measured_thresh=${m1.input_thresh}:offset=${m1.target_offset}:linear=true` : 'loudnorm=I=-14:TP=-1.5:LRA=11';
const r = ff(['-y', '-i', src, '-c:v', 'copy', '-af', af, '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', dst]); if (r.status) { console.error(r.stderr.slice(-400)); process.exit(1); }
const m2 = json(ff(['-i', dst, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-']).stderr);
const bl = (ff(['-i', dst, '-vf', 'blackdetect=d=0.5:pix_th=0.04', '-an', '-f', 'null', '-']).stderr.match(/black_start/g) || []).length;
const fz = (ff(['-i', dst, '-vf', 'freezedetect=n=-55dB:d=2.2', '-an', '-f', 'null', '-']).stderr.match(/freeze_start/g) || []).length;
const dur = parseFloat((ff(['-i', dst]).stderr.match(/Duration: (\d+):(\d+):([\d.]+)/) || []).slice(1).reduce((a, v, i) => a + (+v) * [3600, 60, 1][i], 0));
const size = fs.statSync(dst).size / 1e6, checks = [
  ['loudness', m2 ? Math.abs(+m2.input_i + 14) <= 1.5 : false, m2 ? `${(+m2.input_i).toFixed(1)} LUFS (target -14)` : 'unmeasured'],
  ['true peak', m2 ? +m2.input_tp <= -1 : false, m2 ? `${(+m2.input_tp).toFixed(1)} dBTP` : ''], ['no black frames', bl === 0, `${bl} black stretch(es)`], ['no frozen picture', fz === 0, `${fz} frozen stretch(es) > 2.2 s`],
  ['length 15-60 s', dur >= 15 && dur <= 60, `${dur.toFixed(1)} s`], ['upload size < 50 MB', size < 50, `${size.toFixed(1)} MB`]];
const out = { pass: checks.every((c) => c[1]), checks: checks.map(([name, ok, note]) => ({ name, ok, note })), loudness_before: m1 && +m1.input_i };
fs.writeFileSync(dst.replace(/\.mp4$/, '.qa.json'), JSON.stringify(out, null, 1));
console.log(out.pass ? 'QA PASS' : 'QA WARN'); checks.forEach(([n, ok, note]) => console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${n}: ${note}`));
