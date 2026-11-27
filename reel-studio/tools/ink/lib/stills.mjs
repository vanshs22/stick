// Many stills of the inkbeat renderer in ONE browser. `remotion still` starts a browser and compiles every shader for each picture (about 55 s each with software GL);
// one shared browser and bundle make the 2nd and later stills about 6 s each (measured: 4 stills 29 s total against about 4 minutes).
//   const out = await renderStills([{ id: 'Story', frame: 90, out: 'a.jpg', inputProps: {} }, ...], { scale: 0.5, quality: 'fast', serveUrl })
import path from 'node:path';
import { createRequire } from 'node:module';
import { TK, defaultGL, BROWSER_OPTS } from '../../lib/pipeline.mjs';
const R = path.join(TK, 'renderers/inkbeat'), req = createRequire(path.join(R, 'package.json'));
let bundled = null;
/** the bundle is built once per process (plan.gen.ts and the look code are inside it, so build it after the plan is written) */
export const inkBundle = () => (bundled ||= req('@remotion/bundler').bundle({ entryPoint: path.join(R, 'src/index.ts'), publicDir: path.join(R, 'public'), onProgress: () => {} }));
export async function renderStills(jobs, { scale = 0.5, quality = 'fast', timeout = 300000 } = {}) {
  const { openBrowser, renderStill, selectComposition } = req('@remotion/renderer'), serveUrl = await inkBundle(), chromiumOptions = { gl: defaultGL() }, browser = await openBrowser('chrome', { chromiumOptions, ...BROWSER_OPTS });
  const done = [];
  try {
    for (const j of jobs) {
      const inputProps = { sub: false, quality, ...(j.inputProps || {}) }, composition = await selectComposition({ serveUrl, id: j.id, inputProps, puppeteerInstance: browser, chromiumOptions, ...BROWSER_OPTS });
      await renderStill({ composition, serveUrl, output: j.out, frame: j.frame ?? 0, scale: j.scale ?? scale, inputProps, puppeteerInstance: browser, chromiumOptions, ...BROWSER_OPTS, timeoutInMilliseconds: timeout, overwrite: true }); done.push(j.out);
    }
  } finally { await browser.close({ silent: true }); }
  return done;
}
