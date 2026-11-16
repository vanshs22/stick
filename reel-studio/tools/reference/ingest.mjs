#!/usr/bin/env node
// Bring a reference into the project and measure it: local video/image, a video URL (yt-dlp), a website or a repository page (Playwright).
//   node tools/reference/ingest.mjs <P> <file|url> [--name ref1] [--cookies cookies.txt | --cookies-from-browser chrome]
// -> <P>/references/<name>/{source.json, source.mp4|image, analysis.json, contact_sheet.jpg, keyframes/}
// A reference is for LEARNING technique (pace, framing, type, sound). Nothing here republishes it: source.json records the url, date and
// "analysis only". If a URL cannot be fetched (bot checks, private, geo), the reason is shown and nothing is invented.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { TK, PY, run, rd, bin } from '../lib/pipeline.mjs';

const a = process.argv.slice(2), P = path.resolve(a[0] || ''), src = a[1], opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
if (!a[0] || !src) { console.error('usage: ingest.mjs <projectDir> <file|url> [--name n] [--cookies f]'); process.exit(2); }
const refs = path.join(P, 'references'); fs.mkdirSync(refs, { recursive: true });
const name = opt('name', 'ref' + (fs.readdirSync(refs).filter((d) => fs.statSync(path.join(refs, d)).isDirectory()).length + 1)), dir = path.join(refs, name); fs.mkdirSync(dir, { recursive: true });
const meta = { name, source: src, retrieved_at: new Date().toISOString(), notice: 'Reference for analysis only. Learn structure and technique; produce original scripts, characters, shots and sound.' };
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex').slice(0, 16), isUrl = /^https?:/.test(src), host = isUrl ? new URL(src).hostname.replace(/^www\./, '') : '';
const VIDEO_HOSTS = /(youtube\.com|youtu\.be|tiktok\.com|instagram\.com|vimeo\.com|twitter\.com|x\.com|facebook\.com|fb\.watch|bilibili\.com|reddit\.com|twitch\.tv|dailymotion\.com|streamable\.com)/;
let media = null, kind = 'file';
if (!isUrl) { if (!fs.existsSync(src)) { console.error(`no such file: ${src}`); process.exit(1); } const ext = path.extname(src).toLowerCase(); media = path.join(dir, 'source' + ext); fs.copyFileSync(src, media); kind = /\.(png|jpe?g|webp|bmp)$/.test(ext) ? 'image' : 'video'; meta.original_path = path.resolve(src); }
else if (/\.(mp4|mov|webm|m4v)(\?|#|$)/i.test(src)) { kind = 'video'; const res = await fetch(src, { headers: { 'User-Agent': 'reel-studio' } }); if (!res.ok) { console.error(`cannot fetch ${src}: HTTP ${res.status}`); process.exit(1); } media = path.join(dir, 'source' + path.extname(new URL(src).pathname)); fs.writeFileSync(media, Buffer.from(await res.arrayBuffer())); Object.assign(meta, { type: 'video-url', license: 'not stated: analysis only' }); }
else if (VIDEO_HOSTS.test(host)) {
  kind = 'video'; const yt = bin('yt-dlp', 'YTDLP'), auth = opt('cookies') ? ['--cookies', opt('cookies')] : opt('cookies-from-browser') ? ['--cookies-from-browser', opt('cookies-from-browser')] : [];
  let r = run(yt, ['--skip-download', '--no-warnings', '--dump-single-json', ...auth, src]);
  if (r.status || r.error) { const e = r.error ? 'command not found' : (r.stderr || '').toLowerCase(), why = /sign in|bot|confirm you/.test(e) ? 'the site asks this computer to sign in / prove it is not a bot (common on cloud servers and VPNs)' : /private|unavailable|removed/.test(e) ? 'the video is private, removed or unavailable' : /geo|country|region/.test(e) ? 'the video is blocked in this region' : /unsupported url/.test(e) ? 'yt-dlp does not support this URL' : /not found|command/.test(e) ? 'yt-dlp is not installed (run the installer)' : 'yt-dlp could not read it'; fs.writeFileSync(path.join(dir, 'source.json'), JSON.stringify({ ...meta, status: 'blocked', reason: why, stderr: (r.stderr || '').slice(-400) }, null, 1)); console.error(`cannot fetch ${src}: ${why}.\nOptions: (1) give me the video file you downloaded yourself, (2) pass --cookies <cookies.txt> exported from YOUR browser, (3) use --cookies-from-browser chrome on your own machine. I will not guess what is in it.`); process.exit(1); }
  const j = JSON.parse(r.stdout); Object.assign(meta, { type: 'video-url', title: j.title, uploader: j.uploader, duration: j.duration, upload_date: j.upload_date, view_count: j.view_count, like_count: j.like_count, license: j.license || 'not stated: analysis only', webpage_url: j.webpage_url, extractor: j.extractor, yt_dlp: run(yt, ['--version']).stdout.trim() });
  r = run(yt, ['-f', 'bv*[height<=1080]+ba/b[height<=1080]/b', '--merge-output-format', 'mp4', '-o', path.join(dir, 'source.%(ext)s'), '--no-warnings', ...auth, src]); if (r.status) { console.error('download failed: ' + (r.stderr || '').slice(-300)); process.exit(1); } media = fs.readdirSync(dir).map((f) => path.join(dir, f)).find((f) => /source\.(mp4|mkv|webm|mov)$/.test(f));
} else {
  kind = 'image'; const shot = path.join(dir, 'page'); const gh = src.match(/^https?:\/\/github\.com\/([^/]+)\/([^/#?]+)/);
  if (gh) { try { const res = await fetch(`https://api.github.com/repos/${gh[1]}/${gh[2]}`, { headers: { 'User-Agent': 'reel-studio' } }); if (res.ok) { const j = await res.json(); Object.assign(meta, { type: 'repository', repo: j.full_name, description: j.description, stars: j.stargazers_count, forks: j.forks_count, license: j.license?.spdx_id, language: j.language, pushed_at: j.pushed_at, api: 'api.github.com (public)' }); } } catch { /* offline */ } }
  const r = run('node', [path.join(TK, 'tools/capture/capture_web.mjs'), src, '--out', shot, '--viewport', '1080x1920']); if (r.status) { console.error(r.stderr || r.stdout); process.exit(1); } media = path.join(shot, 'page.png'); Object.assign(meta, { type: meta.type || 'web-page', capture: rd(path.join(shot, 'capture.json')) });
}
meta.file = path.relative(dir, media); meta.sha256 = sha(media); meta.kind = kind; fs.writeFileSync(path.join(dir, 'source.json'), JSON.stringify(meta, null, 1));
const r = run(PY, [path.join(TK, 'tools/reference/analyze.py'), media, '--out', dir]); if (r.status) { console.error(r.stderr.slice(-600)); process.exit(1); }
console.log(r.stdout.trim() + `\nreference "${name}" ready: ${path.relative(P, dir)}\nNEXT: look at ${path.join(dir, 'contact_sheet.jpg')} and the key frames, then fill the vision block: node tools/reference/vision.mjs ${P} ${name} --template`);
