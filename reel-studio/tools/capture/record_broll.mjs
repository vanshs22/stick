#!/usr/bin/env node
// Real B-roll of a REAL page: a deterministic, frame-stepped screen recording with a smooth cursor, eased scrolls, click ripples and a "director" zoom, at 30 fps, as an mp4.
//   node tools/capture/record_broll.mjs <url> --out <dir> [--script broll.json] [--viewport 1280x720] [--fps 30] [--seconds 6] [--expect "text that must be on the page"]... [--project <P>]
// broll.json is a list of beats (times in seconds): [{"at":0,"do":"wait"},{"at":0.6,"do":"scroll","to":700,"dur":1.6},{"at":2.4,"do":"move","to":"text=Pricing","dur":0.7},{"at":3.2,"do":"click","on":"text=Pricing"},
//    {"at":3.6,"do":"zoom","to":1.35,"on":"text=Free","dur":1.0},{"at":5,"do":"type","on":"input","text":"hello","cps":14}]
// Why frame-stepped and not a live screen recording: every output frame is a screenshot taken at an exact scripted time, so the clip is identical every run, never drops frames, shows
// the cursor and zoom we want, and the beats can be tied to spoken words later (the beat times are the anchors). It costs about 0.15 s per frame (a 6 s clip is about 30 s of work).
// Provenance: <dir>/<name>.mp4 + <name>.provenance.json (url, final url, status, title, date, viewport, beats, sha256, expectations). `--expect` fails the capture if the text is not on the page.
// Use in a storyboard with the `Footage` component: {"component":"Footage","props":{"src":"assets/broll/<name>.mp4","window":"browser","url":"<host>","source":"<host>, captured <date>"}}.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { TK, run } from '../lib/pipeline.mjs';

const a = process.argv.slice(2), url = a[0], opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 && a[i + 1] ? a[i + 1] : d; }, all = (k) => a.flatMap((x, i) => (x === '--' + k ? [a[i + 1]] : []));
if (!url || url.startsWith('--')) { console.error(fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(1, 9).join('\n').replace(/^\/\/ ?/gm, '')); process.exit(2); }
const [VW, VH] = opt('viewport', '1280x720').split('x').map(Number), FPS = +opt('fps', 30), SEC = +opt('seconds', 6), out = path.resolve(opt('out', 'assets/broll')), name = opt('name', new URL(url.startsWith('http') ? url : 'file://' + path.resolve(url)).hostname.replace(/\W+/g, '-') || 'local');
const beats = opt('script') ? JSON.parse(fs.readFileSync(opt('script'), 'utf8')) : [{ at: 0.4, do: 'scroll', to: 500, dur: 2.2 }, { at: 3.4, do: 'scroll', to: 0, dur: 1.6 }];
const fail = (m) => { console.error('record_broll: ' + m); process.exit(1); };
const findChrome = () => { for (const f of [process.env.CHROME_PATH, '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', 'C:/Program Files/Google/Chrome/Application/chrome.exe']) if (f && fs.existsSync(f)) return f; const sh = path.join(TK, 'remotion-template/node_modules/.remotion/chrome-headless-shell'); try { const f = fs.readdirSync(sh, { recursive: true }).find((x) => /(^|[\\/])(chrome-headless-shell|headless_shell)(\.exe)?$/.test(x)); if (f) return path.join(sh, f); } catch { /* none */ } return undefined; };
const req = createRequire(path.join(TK, 'package.json')); let chromium; try { chromium = req('playwright-core').chromium; } catch { fail('playwright-core is missing: run `npm install` in the toolkit folder'); }
const ease = (t) => (t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t));
fs.mkdirSync(out, { recursive: true }); const frames = fs.mkdtempSync(path.join(out, '.f-'));
const browser = await chromium.launch({ executablePath: findChrome(), args: ['--no-sandbox'] }).catch((e) => fail(`no browser: ${e.message.split('\n')[0]} (set CHROME_PATH)`));
const ctx = await browser.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1 }), page = await ctx.newPage();
const resp = await page.goto(url.startsWith('http') || url.startsWith('file:') ? url : pathToFileURL(path.resolve(url)).href, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => page.goto(url, { waitUntil: 'load', timeout: 45000 }));
await page.addStyleTag({ content: '*{caret-color:#111} html{scroll-behavior:auto!important} ::-webkit-scrollbar{display:none}' }); await page.waitForTimeout(500);
for (const t of all('expect')) if (!(await page.locator(`text=${t}`).first().isVisible().catch(() => false)) && !(await page.content()).includes(t)) fail(`the page does not show "${t}" (the capture would not prove what you meant)`);
// the overlay (cursor, ripple, zoom) lives in the page so it is part of every screenshot
await page.evaluate(() => { const c = document.createElement('div'); c.id = '__cur'; c.style.cssText = 'position:fixed;z-index:2147483647;left:0;top:0;width:26px;height:30px;pointer-events:none;transform:translate(-100px,-100px);filter:drop-shadow(0 3px 5px rgba(0,0,0,.35))'; c.innerHTML = '<svg viewBox="0 0 30 36" width="26" height="30"><path d="M2 2 L2 28 L9 21 L14 33 L19 31 L14 19 L24 19Z" fill="#fff" stroke="#111" stroke-width="2.4" stroke-linejoin="round"/></svg>'; document.body.appendChild(c); const r = document.createElement('div'); r.id = '__rip'; r.style.cssText = 'position:fixed;z-index:2147483646;border:4px solid #E5322D;border-radius:50%;pointer-events:none;opacity:0;width:20px;height:20px'; document.body.appendChild(r); });
const box = async (sel) => { const b = await page.locator(sel).first().boundingBox().catch(() => null); if (!b) fail(`no element for "${sel}"`); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; };
let cur = { x: VW * 0.62, y: VH * 0.7 }, sc = { y: 0, from: 0, to: 0, at: -1, dur: 1 }, zoom = { z: 1, from: 1, to: 1, at: -1, dur: 1, ox: VW / 2, oy: VH / 2 }, mv = null, click = -9, typing = null;
const prepared = [];
for (const b of beats) { const p = { ...b }; if (b.do === 'move' || b.do === 'click') p.pt = typeof (b.to || b.on) === 'string' ? await box(b.to || b.on) : { x: (b.to || b.on)[0], y: (b.to || b.on)[1] }; if (b.do === 'zoom' && b.on) p.pt = await box(b.on); prepared.push(p); }
const maxY = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight); const total = Math.round((opt('seconds') ? SEC : Math.max(SEC, ...beats.map((b) => b.at + (b.dur || 0.8) + 0.8))) * FPS);
for (let f = 0; f < total; f++) {
  const t = f / FPS;
  for (const b of prepared) {
    if (b.do === 'scroll' && t >= b.at && sc.at !== b.at) sc = { at: b.at, from: sc.y, to: Math.min(maxY, b.to), dur: b.dur || 1.2, y: sc.y };
    if ((b.do === 'move' || b.do === 'click') && t >= b.at && (!mv || mv.at !== b.at)) mv = { at: b.at, from: { ...cur }, to: b.pt, dur: b.dur || 0.7 };
    if (b.do === 'click' && t >= b.at + (b.dur || 0.7) && click < b.at) { click = b.at + (b.dur || 0.7); if (b.on) await page.mouse.click(b.pt.x, b.pt.y).catch(() => {}); }
    if (b.do === 'zoom' && t >= b.at && zoom.at !== b.at) zoom = { at: b.at, from: zoom.z, to: b.to ?? 1.3, dur: b.dur || 1, z: zoom.z, ox: b.pt?.x ?? VW / 2, oy: b.pt?.y ?? VH / 2 };
    if (b.do === 'type' && t >= b.at && !typing?.[b.at]) { typing = { ...(typing || {}), [b.at]: true }; await page.locator(b.on).first().click().catch(() => {}); await page.keyboard.type(b.text, { delay: Math.round(1000 / (b.cps || 14)) }).catch(() => {}); }
  }
  if (sc.at >= 0) { sc.y = sc.from + (sc.to - sc.from) * ease((t - sc.at) / sc.dur); await page.evaluate((y) => window.scrollTo(0, y), Math.round(sc.y)); }
  if (mv) { const k = ease((t - mv.at) / mv.dur); cur = { x: mv.from.x + (mv.to.x - mv.from.x) * k, y: mv.from.y + (mv.to.y - mv.from.y) * k }; }
  zoom.z = zoom.at >= 0 ? zoom.from + (zoom.to - zoom.from) * ease((t - zoom.at) / zoom.dur) : 1;
  const ck = (t - click) / 0.45;
  await page.evaluate(([x, y, ck, z, ox, oy]) => { const c = document.getElementById('__cur'); c.style.transform = `translate(${x}px,${y}px)`; const r = document.getElementById('__rip'); r.style.opacity = ck > 0 && ck < 1 ? String(1 - ck) : '0'; r.style.width = r.style.height = 20 + ck * 80 + 'px'; r.style.left = x - (10 + ck * 40) + 'px'; r.style.top = y - (10 + ck * 40) + 'px'; document.documentElement.style.transformOrigin = `${ox}px ${oy + window.scrollY}px`; document.documentElement.style.transform = z > 1.001 ? `scale(${z})` : ''; }, [cur.x, cur.y, ck, zoom.z, zoom.ox, zoom.oy]);
  await page.screenshot({ path: path.join(frames, `f${String(f).padStart(5, '0')}.png`), type: 'png' });
}
const title = await page.title(), final = page.url(), status = resp?.status?.() ?? null; await browser.close();
const mp4 = path.join(out, name + '.mp4'), r = run('ffmpeg', ['-y', '-v', 'error', '-framerate', String(FPS), '-i', path.join(frames, 'f%05d.png'), '-c:v', 'libx264', '-crf', '17', '-pix_fmt', 'yuv420p', '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', mp4]); fs.rmSync(frames, { recursive: true, force: true }); if (r.status) fail(r.stderr);
fs.writeFileSync(path.join(out, name + '.provenance.json'), JSON.stringify({ url, final_url: final, status, title, captured_at: new Date().toISOString(), viewport: [VW, VH], fps: FPS, frames: total, seconds: +(total / FPS).toFixed(2), beats, expects: all('expect'), sha256: crypto.createHash('sha256').update(fs.readFileSync(mp4)).digest('hex'), note: 'frame-stepped screenshots of the live page with a scripted cursor and zoom' }, null, 1));
console.log(`${mp4}  (${(total / FPS).toFixed(1)} s, ${VW}x${VH}, ${title ? '"' + title.slice(0, 50) + '"' : 'no title'})`);
