#!/usr/bin/env node
// Measures the REAL audio of a video or wav (not the plan): loudness, true peak, clipping risk, long silences.
//   node tools/qa/audio_check.mjs <file> [--lufs -14] [--tp -1.0]
import { spawnSync } from 'node:child_process';

const a = process.argv.slice(2), f = a[0], opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? +a[i + 1] : d; };
if (!f) { console.error('usage: audio_check.mjs <video|wav>'); process.exit(2); }
const ff = (args) => spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', f, ...args, '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 1 << 26 }).stderr;
const ln = ff(['-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json']), J = (() => { const m = ln.match(/\{[^{}]*"input_i"[^{}]*\}/s); return m ? JSON.parse(m[0]) : null; })();
const sil = [...ff(['-af', 'silencedetect=noise=-45dB:d=1.2']).matchAll(/silence_start: ([\d.]+)[\s\S]*?silence_duration: ([\d.]+)/g)].map((m) => ({ at: +m[1], seconds: +m[2] }));
const vol = ff(['-af', 'volumedetect']), maxv = +((vol.match(/max_volume: (-?[\d.]+) dB/) || [0, NaN])[1]);
if (!J) { console.error('no audio stream found'); process.exit(1); }
const lufs = +J.input_i, tp = +J.input_tp, issues = [];
if (Math.abs(lufs - opt('lufs', -14)) > 1.5) issues.push(`loudness ${lufs} LUFS (target ${opt('lufs', -14)} +/- 1.5)`); if (tp > opt('tp', -1.0)) issues.push(`true peak ${tp} dBTP is above ${opt('tp', -1.0)}`);
if (maxv > -0.1) issues.push(`samples reach ${maxv} dB: clipping risk`); sil.filter((s) => s.seconds > 1.5).forEach((s) => issues.push(`${s.seconds}s of near-silence at ${s.at}s`));
console.log(JSON.stringify({ lufs, true_peak_db: tp, lra: +J.input_lra, max_volume_db: maxv, silences: sil, pass: !issues.length, issues }, null, 1)); process.exit(issues.length ? 1 : 0);
