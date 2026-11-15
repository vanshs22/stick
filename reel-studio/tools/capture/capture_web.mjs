#!/usr/bin/env node
// Real evidence: screenshots and screen recordings of real pages, with the source recorded. Needs Playwright:  npm i -D playwright && npx playwright install chromium
//   node tools/capture/capture_web.mjs <url> --out <dir> [--actions actions.json] [--record] [--viewport 1080x1920] [--manifest projects/x/assets/manifest.json] [--id SRC1]
// actions.json: [{"do":"goto","url":"..."},{"do":"click","selector":"text=Code"},{"do":"type","selector":"input","text":"hello"},{"do":"scroll","y":600},{"do":"wait","ms":800},{"do":"screenshot","name":"repo"}]
// If the page cannot be opened, this exits 1 and says why. NEVER replace a failed capture with a drawn fake: tell the user and ask.
import fs from 'node:fs';
import path from 'node:path';

const a = process.argv.slice(2), url = a.find((x) => /^https?:/.test(x)), opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
if (!url) { console.error('usage: capture_web.mjs <url> --out <dir> [--actions file] [--record] [--viewport WxH] [--manifest file] [--id SRC1]'); process.exit(2); }
let pw; try { pw = await import('playwright'); } catch { console.error('Playwright is not installed: npm i -D playwright && npx playwright install chromium'); process.exit(3); }
const out = path.resolve(opt('out', 'assets/capture')), [w, h] = opt('viewport', '1080x1920').split('x').map(Number), rec = a.includes('--record'); fs.mkdirSync(out, { recursive: true });
const actions = opt('actions') ? JSON.parse(fs.readFileSync(opt('actions'), 'utf8')) : [{ do: 'screenshot', name: 'page' }], files = [];
const browser = await pw.chromium.launch(), ctx = await browser.newContext({ viewport: { width: w, height: h }, ...(rec ? { recordVideo: { dir: out, size: { width: w, height: h } } } : {}) }), page = await ctx.newPage();
try {
  const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }); if (resp && resp.status() >= 400) throw new Error(`HTTP ${resp.status()}`); await page.waitForTimeout(1200);
  for (const s of actions) {
    if (s.do === 'goto') await page.goto(s.url, { waitUntil: 'domcontentloaded' }); else if (s.do === 'click') await page.click(s.selector, { timeout: 8000 }); else if (s.do === 'type') await page.fill(s.selector, s.text);
    else if (s.do === 'scroll') await page.mouse.wheel(0, s.y || 600); else if (s.do === 'wait') await page.waitForTimeout(s.ms || 600);
    else if (s.do === 'screenshot') { const f = path.join(out, `${s.name || 'shot' + files.length}.png`); await page.screenshot({ path: f }); files.push(f); }
  }
} catch (e) { console.error(`capture failed: ${e.message}. Tell the user; do not draw a fake of this page.`); await browser.close(); process.exit(1); }
const title = await page.title(); await ctx.close(); await browser.close();
if (rec) fs.readdirSync(out).filter((f) => f.endsWith('.webm')).forEach((f) => files.push(path.join(out, f)));
const meta = { url, title, captured_at: new Date().toISOString(), files, viewport: [w, h] }; fs.writeFileSync(path.join(out, 'capture.json'), JSON.stringify(meta, null, 1));
if (opt('manifest')) { const mf = opt('manifest'), m = fs.existsSync(mf) ? JSON.parse(fs.readFileSync(mf, 'utf8')) : { assets: [] };
  files.forEach((f, i) => m.assets.push({ id: `${opt('id', 'CAP')}-${m.assets.length + 1}`, type: f.endsWith('.webm') ? 'recording' : 'screenshot', path: path.relative(path.dirname(mf), f), source_url: url, license: 'third-party page: show as quoted evidence, credit the source', captured_at: meta.captured_at, original: false, notes: title })); fs.writeFileSync(mf, JSON.stringify(m, null, 1)); }
console.log(`captured ${files.length} file(s) from ${url} -> ${out}`);
