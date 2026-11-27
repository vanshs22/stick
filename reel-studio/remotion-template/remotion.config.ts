import {Config} from '@remotion/cli/config';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
// each render worker is a browser: 4 is fine on 8 GB, use REMOTION_CONCURRENCY=2 on a small machine
Config.setConcurrency(Number(process.env.REMOTION_CONCURRENCY || 4));
// GPU when present, software (SwiftShader) otherwise; needed for the 3D shots
Config.setChromiumOpenGlRenderer((process.env.REMOTION_GL || 'angle') as 'angle'); // no GPU (CI, sandbox): REMOTION_GL=swangle

// Chrome already on the machine (REEL_CHROME, a Playwright headless shell, or system Chrome): Remotion otherwise tries to download its own, which offline or proxied hosts cannot do. Same search as tools/lib/pipeline.mjs.
const chrome = (() => {
  if (process.env.REEL_CHROME) return {exe: process.env.REEL_CHROME, shell: !/chrome$|google-chrome/.test(process.env.REEL_CHROME)};
  for (const r of ['/opt/pw-browsers', path.join(os.homedir(), '.cache/ms-playwright')]) { try { for (const d of fs.readdirSync(r).filter((x) => x.startsWith('chromium_headless_shell')).sort().reverse()) for (const sub of fs.readdirSync(path.join(r, d))) { const f = path.join(r, d, sub, 'chrome-headless-shell'); if (fs.existsSync(f)) return {exe: f, shell: true}; } } catch { /* next */ } }
  for (const f of ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser']) if (fs.existsSync(f)) return {exe: f, shell: false};
  return null;
})();
if (chrome) { Config.setBrowserExecutable(chrome.exe); if (!chrome.shell) Config.setChromeMode('chrome-for-testing'); }
