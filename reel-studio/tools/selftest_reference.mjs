#!/usr/bin/env node
// Reference ingestion on material with KNOWN content (built with ffmpeg): MP4 and MOV files, an image, a screenshot, a website URL (local server),
// and, when the network allows, a GitHub repository page and a video URL via yt-dlp. Checks the measurements really find what is in the material.
//   node tools/selftest_reference.mjs
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { TK, PY } from './lib/pipeline.mjs';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'reel-ref-')), P = path.join(tmp, 'p'), skipped = [];
fs.mkdirSync(P, { recursive: true }); fs.writeFileSync(path.join(P, 'brief.json'), '{}');
let n = 0, fails = 0; const ok = (name, c, d = '') => { n++; if (!c) { fails++; console.error(`FAIL: ${name} ${d}`); } else console.log(`ok   ${name}`); };
const ff = (...a) => { const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...a], { encoding: 'utf8' }); if (r.status) throw new Error(r.stderr.slice(-200)); };
const ingest = (src, name, extra = []) => new Promise((res) => { const c = spawn('node', ['--no-warnings', path.join(TK, 'tools/reference/ingest.mjs'), P, src, '--name', name, ...extra]); let o = ''; c.stdout.on('data', (d) => (o += d)); c.stderr.on('data', (d) => (o += d)); const t = setTimeout(() => c.kill(), 240000); c.on('close', (code) => { clearTimeout(t); res({ status: code, out: o }); }); });
const A = (name) => JSON.parse(fs.readFileSync(path.join(P, 'references', name, 'analysis.json'), 'utf8'));

// known material: 2 s moving pattern | 1 s black | 3 s STATIC bars (frozen) | 2 s moving pattern, with a tone
const seg = (f, d, i) => ['-f', 'lavfi', '-t', String(d), '-i', f];
const mp4 = path.join(tmp, 'known.mp4'), mov = path.join(tmp, 'known.mov');
ff(...seg('testsrc2=s=360x640:r=30', 2), ...seg('color=c=black:s=360x640:r=30', 1), ...seg('smptebars=s=360x640:r=30', 3), ...seg('rgbtestsrc=s=360x640:r=30', 2), '-f', 'lavfi', '-t', '8', '-i', 'sine=f=330',
  '-filter_complex', '[0][1][2][3]concat=n=4:v=1:a=0,format=yuv420p[v]', '-map', '[v]', '-map', '4:a', '-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'aac', '-shortest', mp4);
ff('-i', mp4, '-c', 'copy', mov);

let r = await ingest(mp4, 'mp4');
ok('MP4 is ingested', r.status === 0, r.out.slice(-300));
const a = A('mp4');
ok('metadata: size, fps, duration are right', a.size[0] === 360 && a.size[1] === 640 && Math.abs(a.fps - 30) < 0.5 && Math.abs(a.duration - 8) < 0.3, JSON.stringify([a.size, a.fps, a.duration]));
ok('scene boundaries: the cuts between the 4 segments are found (3 to 5 shots)', a.shots.length >= 3 && a.shots.length <= 5, `shots ${a.shots.length}`);
ok('black frames are reported', (a.qa.black_frames || []).length >= 1, JSON.stringify(a.qa));
ok('the frozen (static) stretch is reported', (a.qa.frozen || []).length >= 1, JSON.stringify(a.qa));
ok('audio is extracted and measured (loudness, onsets)', a.audio?.present === true && isFinite(a.audio.loudness_lufs) && fs.existsSync(path.join(P, 'references/mp4/a.wav')), JSON.stringify(a.audio).slice(0, 160));
ok('a contact sheet and key frames are written for the agent to LOOK at', fs.existsSync(path.join(P, 'references/mp4/contact_sheet.jpg')) && fs.readdirSync(path.join(P, 'references/mp4/keyframes')).length >= 3);
ok('vision is pending (never pre-filled): the analysis admits nobody has looked yet', a.vision?.status === 'pending' && (a.vision.look_at || []).length >= 1, JSON.stringify(a.vision).slice(0, 120));
r = await ingest(mov, 'mov'); ok('MOV is ingested the same way', r.status === 0 && A('mov').shots.length === a.shots.length, r.out.slice(-200));
// image and screenshot
const png = path.join(tmp, 'shot.png'); ff('-f', 'lavfi', '-i', 'testsrc2=s=540x960:d=0.1', '-frames:v', '1', png);
r = await ingest(png, 'img'); ok('an image / screenshot is ingested (kind image, no fake motion data)', r.status === 0 && A('img').kind === 'image', r.out.slice(-200));
// vision honesty
const v = spawnSync('node', [path.join(TK, 'tools/reference/vision.mjs'), P, 'mp4', '--validate'], { encoding: 'utf8' }); ok('the vision block cannot be validated until it is really filled in', v.status !== 0, v.stdout + v.stderr);
const rep = spawnSync('node', [path.join(TK, 'tools/reference/report.mjs'), P, 'mp4'], { encoding: 'utf8' }); const rp = path.join(P, 'references/mp4/reference-report.md');
ok('the report states what was NOT looked at instead of inventing it', rep.status === 0 && fs.existsSync(rp) && /not looked|pending|unavailable|NOT/i.test(fs.readFileSync(rp, 'utf8')), rep.stdout + rep.stderr);
// website URL (local server, async so the page can answer)
const srv = http.createServer((q, s) => { s.writeHead(200, { 'content-type': 'text/html' }); s.end('<title>Local Reference</title><h1 style="font:60px sans-serif">A website to learn from</h1>'); }).listen(0); await new Promise((x) => srv.once('listening', x));
r = await ingest(`http://127.0.0.1:${srv.address().port}/`, 'web'); srv.close();
ok('a website URL is captured as an image reference with provenance', r.status === 0 && A('web').kind === 'image' && JSON.parse(fs.readFileSync(path.join(P, 'references/web/source.json'), 'utf8')).capture?.http_status === 200, r.out.slice(-250));
// network: GitHub repository page and a video URL
const online = await fetch('https://api.github.com/', { signal: AbortSignal.timeout(8000) }).then((x) => x.status < 500).catch(() => false);
if (!online) skipped.push('GitHub repository URL and video URL (no network)');
else {
  r = await ingest('https://github.com/vanshs22/stick', 'gh'); const sj = fs.existsSync(path.join(P, 'references/gh/source.json')) ? JSON.parse(fs.readFileSync(path.join(P, 'references/gh/source.json'), 'utf8')) : {};
  ok('a GitHub repository URL is ingested (repo metadata + page capture)', r.status === 0 && sj.type === 'repository' && /vanshs22\/stick/i.test(sj.repo || ''), r.out.slice(-250));
  r = await ingest('https://www.youtube.com/watch?v=jNQXAC9IVRw', 'yt');
  if (r.status === 0) ok('a YouTube URL is downloaded with yt-dlp and analysed (source recorded)', A('yt').kind === 'video' && JSON.parse(fs.readFileSync(path.join(P, 'references/yt/source.json'), 'utf8')).extractor, r.out.slice(-200));
  else { skipped.push(`YouTube URL via yt-dlp (${r.out.trim().split('\n').pop().slice(0, 140)})`); console.log('SKIP YouTube: ' + r.out.trim().split('\n').pop().slice(0, 200)); }
}
fs.rmSync(tmp, { recursive: true, force: true });
if (skipped.length) console.log(`\nNOT TESTED (reported, not faked): ${skipped.join('; ')}`);
if (fails) { console.error(`${fails} of ${n} reference checks FAILED`); process.exit(1); } console.log(`REFERENCE SELFTEST PASSED: ${n} checks${skipped.length ? ` (${skipped.length} not tested)` : ''}`);
