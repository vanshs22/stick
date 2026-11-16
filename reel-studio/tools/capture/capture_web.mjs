#!/usr/bin/env node
// Real evidence: screenshots and recordings of REAL pages, with provenance and a check that the shot shows what you meant it to show.
//   node tools/capture/capture_web.mjs <url> --out <dir> [--actions actions.json] [--record] [--viewport 1080x1920] [--scale 2] [--manifest assets/manifest.json] [--id SRC1]
//       [--expect "text that must be on the page"]...  [--full]
// actions.json: [{"do":"goto","url":"..."},{"do":"click","selector":"text=Code"},{"do":"type","selector":"input","text":"hi"},{"do":"scroll","y":600},
//                {"do":"wait","ms":800},{"do":"expect","text":"MIT"},{"do":"highlight","selector":"#repo-stars","name":"stars"},{"do":"screenshot","name":"repo"}]
//   "highlight" records the element's box as a fraction of the picture (for ProofCard.highlight: {x,y,w,h}); "expect" fails the capture if the text is missing.
// Provenance written: url, final url, HTTP status, title, date, viewport, every action, sha256 of every file, the expectations that passed.
// If the page cannot be opened this exits 1 and says why. NEVER replace a failed capture with a drawn fake: ask the user; a labelled
// recreation needs their words (tools/capture/register_recreation.mjs).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL, fileURLToPath } from 'node:url';

const TK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const a = process.argv.slice(2), url = a.find((x) => /^https?:/.test(x)), opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; }, all = (k) => a.flatMap((x, i) => (x === '--' + k ? [a[i + 1]] : []));
if (!url) { console.error('usage: capture_web.mjs <url> --out <dir> [--actions file] [--record] [--viewport WxH] [--manifest file] [--id SRC1] [--expect text] [--full]'); process.exit(2); }
async function loadPlaywright() {
  const tries = [process.env.REEL_NODE_MODULES && path.join(process.env.REEL_NODE_MODULES, 'playwright-core/index.mjs'), path.join(TK, 'node_modules/playwright-core/index.mjs'), path.join(process.cwd(), 'node_modules/playwright-core/index.mjs')].filter(Boolean);
  for (const f of tries) if (fs.existsSync(f)) return import(pathToFileURL(f).href);
  try { return await import('playwright-core'); } catch { /* fall through */ }
  console.error('playwright-core is not installed. Run: node scripts/install.mjs   (or: cd reel-studio && npm install)'); process.exit(3);
}
/** which Chrome to drive: CHROME_PATH, Remotion's own headless shell (always present after `npm install` in a project), a system Chrome, else Playwright's download */
function findChrome() {
  if (process.env.CHROME_PATH && fs.existsSync(process.env.CHROME_PATH)) return process.env.CHROME_PATH;
  const roots = [process.env.REEL_NODE_MODULES, path.join(process.cwd(), 'node_modules'), path.join(process.cwd(), 'remotion/node_modules'), path.join(TK, 'node_modules'), path.join(TK, 'remotion-template/node_modules')].filter(Boolean);
  for (const r of roots) { const d = path.join(r, '.remotion'); if (!fs.existsSync(d)) continue; const walk = (p, depth = 0) => { for (const e of fs.readdirSync(p, { withFileTypes: true })) { const f = path.join(p, e.name); if (e.isFile() && /^(headless_shell|chrome-headless-shell|chrome|Chromium)(\.exe)?$/.test(e.name)) return f; if (e.isDirectory() && depth < 4) { const x = walk(f, depth + 1); if (x) return x; } } return null; }; const f = walk(d); if (f) return f; }
  for (const f of ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', 'C:/Program Files/Google/Chrome/Application/chrome.exe']) if (fs.existsSync(f)) return f;
  return undefined;
}
const pw = await loadPlaywright(), chromium = (pw.chromium || pw.default?.chromium);
const out = path.resolve(opt('out', 'assets/capture')), [w, h] = opt('viewport', '1080x1920').split('x').map(Number), rec = a.includes('--record'); fs.mkdirSync(out, { recursive: true });
const actions = opt('actions') ? JSON.parse(fs.readFileSync(opt('actions'), 'utf8')) : [{ do: 'screenshot', name: 'page' }], files = [], log = [], expects = all('expect').map((t) => ({ do: 'expect', text: t })), highlights = {};
const fail = (msg) => { fs.writeFileSync(path.join(out, 'capture-failed.json'), JSON.stringify({ url, reason: msg, at: new Date().toISOString() }, null, 1)); console.error(`capture failed: ${msg}\nTell the user. Do not draw a fake of this page. Options: try another URL, a local copy the user provides, or (only with the user's explicit OK) a clearly labelled recreation via tools/capture/register_recreation.mjs.`); process.exit(1); };
let browser; try { browser = await chromium.launch({ executablePath: findChrome(), args: ['--no-sandbox'] }); } catch (e) { fail(`no browser could be started (${e.message.split('\n')[0]}). Set CHROME_PATH or run npm install in a project.`); }
const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: +opt('scale', 1) || 1, ...(rec ? { recordVideo: { dir: out, size: { width: w, height: h } } } : {}) }), page = await ctx.newPage(); let status = null;
try {
  const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 }); status = resp?.status() ?? null; if (resp && status >= 400) throw new Error(`HTTP ${status}`); await page.waitForLoadState('load', { timeout: 15000 }).catch(() => {}); await page.waitForTimeout(1200);
  for (const s of [...actions, ...expects]) {
    log.push(s);
    if (s.do === 'goto') await page.goto(s.url, { waitUntil: 'domcontentloaded' }); else if (s.do === 'click') await page.click(s.selector, { timeout: 8000 }); else if (s.do === 'type') await page.fill(s.selector, s.text);
    else if (s.do === 'scroll') await page.mouse.wheel(0, s.y || 600); else if (s.do === 'wait') await page.waitForTimeout(s.ms || 600);
    else if (s.do === 'expect') { const found = s.selector ? (await page.locator(s.selector).first().innerText({ timeout: 5000 }).catch(() => '')).includes(s.text) : (await page.locator('body').innerText()).includes(s.text); s.passed = found; if (!found) throw new Error(`expected text not on the page: "${s.text}"`); }
    else if (s.do === 'highlight') { const el = page.locator(s.selector).first(); await el.scrollIntoViewIfNeeded(); const bb = await el.boundingBox(); if (!bb) throw new Error(`no box for ${s.selector}`); highlights[s.name || s.selector] = { x: +(bb.x / w).toFixed(4), y: +(bb.y / h).toFixed(4), w: +(bb.width / w).toFixed(4), h: +(bb.height / h).toFixed(4) }; }
    else if (s.do === 'screenshot') { const f = path.join(out, `${s.name || 'shot' + files.length}.png`); await page.screenshot({ path: f, fullPage: a.includes('--full') || !!s.full }); files.push(f); }
  }
} catch (e) { await browser.close(); fail(e.message); }
const title = await page.title(), finalUrl = page.url(), ua = await page.evaluate(() => navigator.userAgent); await ctx.close(); await browser.close();
if (rec) fs.readdirSync(out).filter((f) => f.endsWith('.webm')).forEach((f) => files.push(path.join(out, f)));
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex').slice(0, 16);
const meta = { kind: 'real', url, final_url: finalUrl, http_status: status, title, captured_at: new Date().toISOString(), viewport: [w, h], user_agent: ua, actions: log, files: files.map((f) => ({ file: path.basename(f), sha256: sha(f) })), verification: { expectations: log.filter((x) => x.do === 'expect').map((x) => ({ text: x.text, passed: !!x.passed })), all_passed: log.filter((x) => x.do === 'expect').every((x) => x.passed) }, highlights };
fs.writeFileSync(path.join(out, 'capture.json'), JSON.stringify(meta, null, 1));
if (opt('manifest')) { const mf = path.resolve(opt('manifest')), m = fs.existsSync(mf) ? JSON.parse(fs.readFileSync(mf, 'utf8')) : { assets: [] };
  files.forEach((f) => m.assets.push({ id: `${opt('id', 'CAP')}-${m.assets.length + 1}`, type: f.endsWith('.webm') ? 'recording' : 'screenshot', kind: 'real', path: path.relative(path.dirname(mf), f), source_url: url, final_url: finalUrl, page_title: title, license: 'third-party page: shown as quoted evidence, credit the source', captured_at: meta.captured_at, original: false, sha256: sha(f), verification: meta.verification, highlights, notes: title })); fs.mkdirSync(path.dirname(mf), { recursive: true }); fs.writeFileSync(mf, JSON.stringify(m, null, 1)); }
console.log(`captured ${files.length} file(s) from ${url} (HTTP ${status}, "${title}"), ${meta.verification.expectations.length} expectation(s) ${meta.verification.all_passed ? 'passed' : 'FAILED'} -> ${out}`);
