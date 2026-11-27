#!/usr/bin/env node
// Playwright evidence capture against a LOCAL page (no network needed): navigation, viewport, click, typing, scrolling, waiting for late content,
// screenshots, screen recording, provenance in the manifest, the "text must really be visible" check, and honest failure (no fake on error).
//   node tools/selftest_capture.mjs
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const TK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'reel-cap-')), cap = path.join(TK, 'tools/capture/capture_web.mjs');
let n = 0, fails = 0; const ok = (name, c, d = '') => { n++; if (!c) { fails++; console.error(`FAIL: ${name} ${d}`); } else console.log(`ok   ${name}`); };
const PAGE = `<!doctype html><meta charset=utf-8><title>Capture Probe Docs</title><style>body{margin:0;font:28px sans-serif;background:#fff}p{margin:40px}#late{display:none;background:#fde68a;margin:40px;padding:20px}#spacer{height:1400px}</style>
<h1 style="margin:40px">Rate limiting guide</h1><p>Intro paragraph about limits.</p><button id=b style="margin:40px;font-size:30px" onclick="document.getElementById('late').style.display='block'">Show details</button>
<div id=late>Limit: 100 requests per minute</div><input id=q placeholder=search style="margin:40px;font-size:28px"><div id=spacer></div><p id=bottom>Footer: see the changelog.</p>
<script>setTimeout(()=>{const d=document.createElement('p');d.id='slow';d.textContent='Loaded after a delay: Retry-After header';document.body.insertBefore(d,document.getElementById('spacer'))},900)</script>`;
const srv = http.createServer((q, s) => { if (q.url === '/404') { s.writeHead(404); s.end('nope'); } else { s.writeHead(200, { 'content-type': 'text/html' }); s.end(PAGE); } }).listen(0);
await new Promise((r) => srv.once('listening', r)); const base = `http://127.0.0.1:${srv.address().port}`;
// async on purpose: the test web server lives in THIS process, a blocking spawnSync would freeze it and every page load would time out
const run = (args, o = {}) => new Promise((res) => { const c = spawn('node', ['--no-warnings', cap, ...args], o); let so = '', se = ''; c.stdout.on('data', (d) => (so += d)); c.stderr.on('data', (d) => (se += d)); const t = setTimeout(() => c.kill(), 180000); c.on('close', (code) => { clearTimeout(t); res({ status: code, stdout: so, stderr: se }); }); });
const man = path.join(tmp, 'manifest.json');

fs.writeFileSync(path.join(tmp, 'actions.json'), JSON.stringify([{ do: 'goto', url: base }, { do: 'click', selector: 'text=Show details' }, { do: 'type', selector: '#q', text: 'limits' }, { do: 'wait', ms: 1300 }, { do: 'expect', text: 'Retry-After header' }, { do: 'expect', text: 'Limit: 100 requests per minute' }, { do: 'highlight', selector: '#late', name: 'limit' }, { do: 'screenshot', name: 'details' }, { do: 'scroll', y: 6000 }, { do: 'wait', ms: 900 }, { do: 'expect', text: 'Footer: see the changelog.' }, { do: 'screenshot', name: 'footer' }]));
let r = await run([base, '--out', path.join(tmp, 'c1'), '--actions', path.join(tmp, 'actions.json'), '--viewport', '480x900', '--manifest', man, '--id', 'SRC1'], { cwd: tmp });
ok('capture with navigation, click, typing, waiting, highlight and scrolling succeeds', r.status === 0, (r.stdout + r.stderr).slice(-400));
const d = path.join(tmp, 'c1'), files = fs.existsSync(d) ? fs.readdirSync(d) : [];
ok('two screenshots (details + footer) were written', files.filter((f) => /\.png$/.test(f)).length >= 2, files.join(','));
ok('a per-capture provenance file exists', files.some((f) => /capture\.json$/.test(f)), files.join(','));
const m = fs.existsSync(man) ? JSON.parse(fs.readFileSync(man, 'utf8')) : { assets: [] }, e = m.assets.find((x) => x.id.startsWith('SRC1'));
ok('manifest records provenance: URL, final URL, capture date, sha256, kind real', !!e && e.source_url === base && !!e.captured_at && /^[0-9a-f]{12,}/.test(e.sha256 || '') && e.kind === 'real', JSON.stringify(e || {}).slice(0, 200));
ok('manifest records the text expectation with a position rectangle', !!e?.verification?.expectations?.[0]?.passed && !!e.verification.expectations[0].rect, JSON.stringify(e?.verification || {}).slice(0, 200));
if (e) { const f = path.join(d, '..', e.path.replace(/^.*?\//, '')); const png = [path.join(tmp, 'c1', path.basename(e.path)), path.join(tmp, e.path)].find((x) => fs.existsSync(x)); const h = png ? crypto.createHash('sha256').update(fs.readFileSync(png)).digest('hex') : ''; ok('the recorded sha256 matches the file on disk', !!png && h.startsWith(e.sha256), `${e.sha256} vs ${h.slice(0, 16)}`); }

// text that is NOT on the page must fail the capture and leave no evidence behind
r = await run([base, '--out', path.join(tmp, 'c2'), '--manifest', man, '--id', 'SRC2', '--expect', 'This sentence is not on the page'], { cwd: tmp });
ok('a missing expected text FAILS the capture (exit 1) instead of passing a wrong picture', r.status === 1, `exit ${r.status} ${(r.stdout + r.stderr).slice(-200)}`);
ok('and writes nothing to the manifest for it', !(JSON.parse(fs.readFileSync(man, 'utf8')).assets || []).some((x) => x.id.startsWith('SRC2')));
// text below the fold is not "visible in the picture"
r = await run([base, '--out', path.join(tmp, 'c3'), '--manifest', man, '--id', 'SRC3', '--viewport', '480x486', '--expect', 'Footer: see the changelog.'], { cwd: tmp });
ok('text that exists on the page but is NOT visible in the screenshot fails too', r.status === 1, `exit ${r.status} ${(r.stdout + r.stderr).slice(-200)}`);
// HTTP error and unreachable host
r = await run([base + '/404', '--out', path.join(tmp, 'c4'), '--manifest', man, '--id', 'SRC4'], { cwd: tmp });
ok('an HTTP 404 is reported as a failed capture', r.status === 1 && /404/.test(r.stdout + r.stderr), `exit ${r.status} ${(r.stdout + r.stderr).slice(-200)}`);
r = await run(['http://127.0.0.1:9/', '--out', path.join(tmp, 'c5'), '--manifest', man, '--id', 'SRC5'], { cwd: tmp });
ok('an unreachable site fails with a reason (no drawn fake)', r.status === 1 && (r.stdout + r.stderr).length > 20, `exit ${r.status}`);
fs.writeFileSync(path.join(tmp, 'noshot.json'), JSON.stringify([{ do: 'goto', url: base }, { do: 'wait', ms: 200 }]));
r = await run([base, '--out', path.join(tmp, 'c7'), '--actions', path.join(tmp, 'noshot.json'), '--manifest', man, '--id', 'SRC7', '--expect', 'Rate limiting guide'], { cwd: tmp });
ok('actions without a screenshot step fail instead of claiming success with 0 files', r.status === 1 && /never took a screenshot/.test(r.stdout + r.stderr), `exit ${r.status} ${(r.stdout + r.stderr).slice(-160)}`);
// screen recording
r = await run([base, '--out', path.join(tmp, 'c6'), '--record', '--viewport', '480x900', '--actions', path.join(tmp, 'actions.json'), '--manifest', man, '--id', 'SRC6'], { cwd: tmp });
const vid = fs.existsSync(path.join(tmp, 'c6')) ? fs.readdirSync(path.join(tmp, 'c6')).find((f) => /\.(webm|mp4)$/.test(f)) : null;
ok('screen recording writes a video file', r.status === 0 && !!vid && fs.statSync(path.join(tmp, 'c6', vid)).size > 5000, `exit ${r.status} ${vid}`);

srv.close(); fs.rmSync(tmp, { recursive: true, force: true });
if (fails) { console.error(`${fails} of ${n} capture checks FAILED`); process.exit(1); } console.log(`CAPTURE SELFTEST PASSED: ${n} checks (local page, no network)`);
