#!/usr/bin/env node
// Instant, cheap 4K export: Lanczos resampling (ffmpeg's own scaler) plus a light unsharp on luma. No AI model, no GPU, no download.
//   node tools/upscale.mjs <in.mp4> [out.mp4] [--long 3840] [--crf 16]      1080x1920 -> 2160x3840 (the long side becomes 3840 for any aspect)
// Honest limit: Lanczos adds no new detail. It gives sharp edges at the 4K frame size, which makes Instagram/TikTok/YouTube keep a higher bitrate tier.
// For crisp vector text at 4K, a 2D style can also be rendered natively at 4K: build_video.mjs --scale 2 (4x the render time).
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import './lib/pipeline.mjs';   // puts the installer's ffmpeg fallback on PATH

const a = process.argv.slice(2), opt = (k, d) => (a.includes('--' + k) ? a[a.indexOf('--' + k) + 1] : d), pos = a.filter((x, i) => !x.startsWith('--') && !(i && a[i - 1].startsWith('--')));
const inp = pos[0]; if (!inp || !fs.existsSync(inp)) { console.error('usage: upscale.mjs <in.mp4> [out.mp4] [--long 3840] [--crf 16]'); process.exit(2); }
const out = pos[1] || inp.replace(/\.mp4$/, '.4k.mp4'), LONG = Number(opt('long', 3840)), crf = opt('crf', '16');
const probe = spawnSync('ffmpeg', ['-hide_banner', '-i', inp], { encoding: 'utf8' }).stderr, m = probe.match(/Video:.*?, (\d{2,5})x(\d{2,5})/);
if (!m) { console.error('cannot read the video size of ' + inp); process.exit(1); }
const [w, h] = [Number(m[1]), Number(m[2])], k = LONG / Math.max(w, h), ow = Math.round(w * k / 2) * 2, oh = Math.round(h * k / 2) * 2;   // the long side becomes 3840 for any aspect
const args = ['-hide_banner', '-loglevel', 'error', '-y', '-i', inp, '-vf', `scale=${ow}:${oh}:flags=lanczos+accurate_rnd+full_chroma_int,unsharp=5:5:0.45:5:5:0.0,format=yuv420p`,
  '-c:v', 'libx264', '-preset', 'faster', '-crf', crf, '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-movflags', '+faststart', '-c:a', 'copy', out];
const t0 = Date.now(), r = spawnSync('ffmpeg', args, { encoding: 'utf8', maxBuffer: 1 << 26 }); if (r.status) { console.error(r.stderr); process.exit(1); }
const chk = spawnSync('ffmpeg', ['-v', 'error', '-i', out, '-f', 'null', '-'], { encoding: 'utf8' }); if (chk.stderr.trim()) { console.error('the 4K file has decode errors:\n' + chk.stderr.slice(0, 400)); process.exit(1); }
console.log(`${path.basename(out)}: ${w}x${h} -> ${ow}x${oh} (Lanczos + unsharp, crf ${crf}), ${(fs.statSync(out).size / 1e6).toFixed(1)} MB, ${Math.round((Date.now() - t0) / 1000)} s, decodes cleanly`);
