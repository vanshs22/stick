#!/usr/bin/env node
// Footage clips become a JPEG frame sequence, so the Footage component plays them on ANY machine (Remotion's video decoder needs glibc 2.35+; frames need nothing) and the picture is exact per frame.
//   node tools/footage_frames.mjs ensure <project>         for every Footage shot of the storyboard: assets/<src>.frames/f00001.jpg ... + meta.json {fps,count,width,height}, copied to remotion/public (build_video does this)
//   node tools/footage_frames.mjs extract <video.mp4> [--fps 30] [--width 1280]
import fs from 'node:fs';
import path from 'node:path';
import { run, rd } from './lib/pipeline.mjs';
const a = process.argv.slice(2), cmd = a[0], opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 && a[i + 1] ? a[i + 1] : d; };
function extract(mp4, fps = 30, width = 1280) {
  const dir = mp4 + '.frames'; if (fs.existsSync(path.join(dir, 'meta.json')) && fs.statSync(path.join(dir, 'meta.json')).mtimeMs >= fs.statSync(mp4).mtimeMs) return dir;
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const r = run('ffmpeg', ['-y', '-v', 'error', '-i', mp4, '-vf', `fps=${fps},scale='min(${width},iw)':-2`, '-q:v', '3', path.join(dir, 'f%05d.jpg')]); if (r.status) throw new Error(`ffmpeg could not read ${mp4}: ${(r.stderr || '').slice(-200)}`);
  const n = fs.readdirSync(dir).filter((f) => f.endsWith('.jpg')).length; fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify({ fps, count: n, src: path.basename(mp4) })); return dir;
}
if (cmd === 'extract') { const d = extract(path.resolve(a[1]), +opt('fps', 30), +opt('width', 1280)); console.log(d); }
else if (cmd === 'ensure') {
  const P = path.resolve(a[1] || '.'), sb = path.join(P, 'storyboard/storyboard.json'); if (!fs.existsSync(sb)) process.exit(0); let n = 0;
  for (const s of rd(sb).shots) if (s.component === 'Footage' && /\.(mp4|mov|webm)$/i.test(s.props?.src || '')) { const f = path.join(P, s.props.src); if (!fs.existsSync(f)) { console.error(`${s.id}: footage ${s.props.src} is missing (record it: tools/capture/record_broll.mjs)`); process.exit(1); } const d = extract(f), pub = path.join(P, 'remotion/public', s.props.src + '.frames'); if (fs.existsSync(path.join(P, 'remotion'))) { fs.mkdirSync(pub, { recursive: true }); fs.cpSync(d, pub, { recursive: true }); } n++; }
  if (n) console.log(`footage: ${n} clip(s) as frame sequences`);
} else { console.error('usage: footage_frames.mjs ensure <project> | extract <video>'); process.exit(2); }
