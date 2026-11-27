import os from 'node:os';
// Shared helpers so every tool builds, times and renders a project the same way (no copy-pasted shell).
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const TK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
// .env (see .env.example) fills only variables that are not already set; .bin (written by the installer) holds an ffmpeg/ffprobe fallback
try { for (const l of fs.readFileSync(path.join(TK, '.env'), 'utf8').split(/\r?\n/)) { const m = l.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/); if (m && !m[1].startsWith('#') && process.env[m[1]] === undefined && m[2]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ''); } } catch { /* no .env: fine */ }
if (fs.existsSync(path.join(TK, '.bin'))) process.env.PATH = path.join(TK, '.bin') + path.delimiter + process.env.PATH;
export const PY = process.env.REEL_PY || (fs.existsSync(path.join(TK, '.venv/bin/python')) ? path.join(TK, '.venv/bin/python') : fs.existsSync(path.join(TK, '.venv/Scripts/python.exe')) ? path.join(TK, '.venv/Scripts/python.exe') : 'python3');
/** the WebGL backend for Remotion: REMOTION_GL if set; else `swangle` on a Linux machine with no GPU device (headless boxes, CI, containers: software WebGL works only with it), else `angle` */
export const defaultGL = () => process.env.REMOTION_GL || (process.platform === 'linux' && !fs.existsSync('/dev/dri') && !fs.existsSync('/dev/nvidia0') ? 'swangle' : 'angle');
/** Chrome for Remotion: REEL_CHROME, else a headless shell or Chrome already on the machine (offline or proxied hosts cannot download one). Empty = let Remotion fetch its own. */
const chromeFound = () => {
  if (process.env.REEL_CHROME) return { exe: process.env.REEL_CHROME, shell: !/chrome$|google-chrome/.test(process.env.REEL_CHROME) };
  const roots = ['/opt/pw-browsers', path.join(os.homedir(), '.cache/ms-playwright')];
  for (const r of roots) { try { for (const d of fs.readdirSync(r).filter((x) => x.startsWith('chromium_headless_shell')).sort().reverse()) { for (const sub of fs.readdirSync(path.join(r, d))) { const f = path.join(r, d, sub, 'chrome-headless-shell'); if (fs.existsSync(f)) return { exe: f, shell: true }; } } } catch { /* next root */ } }
  for (const f of ['/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser']) if (fs.existsSync(f)) return { exe: f, shell: false };
  return null;
};
const CF = chromeFound();
export const BROWSER_OPTS = CF ? { browserExecutable: CF.exe, ...(CF.shell ? {} : { chromeMode: 'chrome-for-testing' }) } : {};
export const run = (cmd, args, opt = {}) => spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 1 << 28, shell: process.platform === 'win32' && /^(npm|npx)$/.test(cmd), ...opt });   // npm and npx are .cmd files on Windows: they need a shell
/** the finished film of a project: the NEWEST renders/*.mp4 that is not a raw/4K/segment file and not an --estimate preview (a stale preview must never be analysed as "the film") */
export function finalVideo(P) {
  const d = path.join(P, 'renders'); if (!fs.existsSync(d)) return null;
  const isPreview = (f) => { try { return !!JSON.parse(fs.readFileSync(path.join(d, f.replace(/\.mp4$/, '.qa.json')), 'utf8')).preview; } catch { return false; } };
  const c = fs.readdirSync(d).filter((f) => /\.mp4$/.test(f) && !/\.(raw|4k)\.mp4$|segments/.test(f)).map((f) => ({ f, t: fs.statSync(path.join(d, f)).mtimeMs, pv: isPreview(f) })).sort((a, b) => (a.pv - b.pv) || (b.t - a.t));
  return c[0] ? path.join('renders', c[0].f) : null;
}
export const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
export const log = (...m) => console.log(...m);

/** copy the Remotion template into <P>/remotion (code only; data stays), write the pack's style.json, link node_modules */
export function syncProject(P, { nodeModules = process.env.REEL_NODE_MODULES || path.join(TK, 'remotion-template/node_modules') } = {}) {
  const R = path.join(P, 'remotion'), T = path.join(TK, 'remotion-template');
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  for (const f of walk(path.join(T, 'src'))) { const rel = path.relative(T, f); if (rel.startsWith(path.join('src', 'data'))) continue; fs.mkdirSync(path.dirname(path.join(R, rel)), { recursive: true }); fs.copyFileSync(f, path.join(R, rel)); }
  for (const f of ['remotion.config.ts', 'tsconfig.json', 'package.json']) if (!fs.existsSync(path.join(R, f)) || f !== 'package.json') fs.copyFileSync(path.join(T, f), path.join(R, f));
  const brief = rd(path.join(P, 'brief.json')), pack = rd(path.join(TK, 'style-packs', brief.style_pack, 'style.json'));
  fs.mkdirSync(path.join(R, 'src/data'), { recursive: true });
  // <P>/style-overrides.json: deep-merged over the pack ({"colors":{"accent":"#FF3B6B"},"effects":{"grain":0.1},"safe_zone":{"caption_y":1400},"fonts":{...}}). The pack stays untouched: the AI restyles per project, using the pack as the base.
  const deep = (b, o) => (o && typeof o === 'object' && !Array.isArray(o) ? Object.fromEntries([...new Set([...Object.keys(b || {}), ...Object.keys(o)])].map((k) => [k, k in o ? deep(b?.[k], o[k]) : b[k]])) : o === undefined ? b : o);
  const ov = (() => { try { return JSON.parse(fs.readFileSync(path.join(P, 'style-overrides.json'), 'utf8')); } catch { return {}; } })();
  // the page colour of a shot is bgs.paper (the template reads it first): an override of colors.bg must move it too, or the override is silently ignored
  if (ov.colors?.bg && !ov.bgs?.paper && pack.tokens.bgs?.paper) ov.bgs = { ...(ov.bgs || {}), paper: ov.colors.bg };
  const merged = deep({ id: pack.id, ...pack.tokens, effects: pack.effects || {}, defaults: pack.defaults || {} }, ov);
  fs.writeFileSync(path.join(R, 'src/data/style.json'), JSON.stringify(merged, null, 1));
  for (const f of ['typography.json', 'captions.json']) { const src = path.join(P, 'typography', f); const dst = path.join(R, 'src/data', f); if (fs.existsSync(src)) fs.copyFileSync(src, dst); else if (!fs.existsSync(dst)) fs.copyFileSync(path.join(T, 'src/data', f), dst); }
  const nm = path.join(R, 'node_modules');
  if (!fs.existsSync(nm)) { if (nodeModules && fs.existsSync(nodeModules)) fs.symlinkSync(path.resolve(nodeModules), nm, 'junction'); else { log('npm install in ' + R + ' ...'); const r = run('npm', ['install', '--no-audit', '--no-fund', '--loglevel=error'], { cwd: R }); if (r.status) throw new Error('npm install failed:\n' + (r.stderr || r.stdout).slice(-600)); } }
  const vend = path.join(R, 'public/vendor'); fs.mkdirSync(vend, { recursive: true }); const gs = path.join(nm, 'gsap/dist/gsap.min.js'); if (fs.existsSync(gs)) fs.copyFileSync(gs, path.join(vend, 'gsap.min.js'));   // local GSAP for HyperFrames-style blocks (no CDN at render time)
  if (fs.existsSync(path.join(P, 'assets'))) fs.cpSync(path.join(P, 'assets'), path.join(R, 'public/assets'), { recursive: true });   // captures and recreations are referenced as image: "assets/<path>"
  { const rg = path.join(R, 'src/data/remocn-registry.ts'); if (!fs.existsSync(rg)) fs.copyFileSync(path.join(T, 'src/data/remocn-registry.ts'), rg); }   // filled by tools/remocn.mjs; never overwritten
  for (const f of ['hyperframes', 'fonts']) { const sd = path.join(T, 'public', f); if (fs.existsSync(sd)) fs.cpSync(sd, path.join(R, 'public', f), { recursive: true }); }
  return R;
}

/** estimated timing (no voice) or real timing if narration exists; always rebuilds data/timeline.json */
export function timing(P, { preset } = {}) {
  const env = { ...process.env, TTS_SCRIPT: 'data/tts.json' };
  let r = run('node', [path.join(TK, 'tools/audio/build_tts_input.mjs'), P]); if (r.status) throw new Error(r.stderr);
  { const hf = path.join(P, 'data/.voice.hash'), tf = path.join(P, 'data/tts.json'); if (fs.existsSync(tf) && fs.existsSync(hf) && fs.readFileSync(hf, 'utf8') !== crypto.createHash('sha1').update(fs.readFileSync(tf)).digest('hex')) for (const f of ['data/lines.json', 'data/words.json']) fs.rmSync(path.join(P, f), { force: true }); }   // the script or voice changed: the old line/word times are stale
  if (!fs.existsSync(path.join(P, 'data/words.json')) || !fs.existsSync(path.join(P, 'data/narration.wav'))) { r = run(PY, [path.join(TK, 'tools/audio/estimate.py'), '.'], { cwd: P, env }); if (r.status) throw new Error(r.stderr || r.stdout); }
  r = run('node', [path.join(TK, 'tools/timing/build_timeline.mjs'), P, ...(preset ? ['--preset', preset] : [])]); if (r.status) throw new Error(r.stderr || r.stdout);
  return r.stdout.trim();
}

/** one still per shot (or --only list) into <P>/review/storyboard */
export function stills(P, only, at = 0.7) {
  const args = [path.join(TK, 'tools/preview_shots.mjs'), P, '--at', String(at)]; if (only) args.push('--only', only);
  const r = run('node', args, { env: { ...process.env, REMOTION_GL: defaultGL() } }); return { ok: !r.status, out: (r.stdout + r.stderr).trim() };
}
export function copyPublic(P, files) { const d = path.join(P, 'remotion/public/gallery'); fs.mkdirSync(d, { recursive: true }); return files.map((f) => { const m = f.split(path.sep).join('/').match(/style-packs\/([^/]+)\/preview\/([^/]+)$/), n = m ? `${m[1]}-${m[2]}` : path.basename(f); fs.copyFileSync(f, path.join(d, n)); return `gallery/${n}`; }); }

/** a small jpg for sheets (ffmpeg); returns the jpg path (or the png if ffmpeg is missing) */
export function thumb(png, jpg, w = 540) { const r = run('ffmpeg', ['-y', '-v', 'error', '-i', png, '-vf', `scale=${w}:-2`, '-q:v', '3', jpg]); return r.status ? png : jpg; }
export function deepMerge(a, b) { if (b === null) return undefined; if (Array.isArray(b) || typeof b !== 'object') return b; const o = { ...(a && typeof a === 'object' && !Array.isArray(a) ? a : {}) }; for (const [k, v] of Object.entries(b)) { const m = deepMerge(o[k], v); if (m === undefined) delete o[k]; else o[k] = m; } return o; }
export function setPath(obj, p, v) { const ks = p.split('.'); let o = obj; ks.slice(0, -1).forEach((k) => { o = o[k] = o[k] ?? {}; }); o[ks.at(-1)] = v; }

/** find a helper binary: env override, the toolkit venv, then PATH */
export function bin(name, envVar) { const c = [process.env[envVar || name.toUpperCase().replace(/-/g, '_')], path.join(TK, '.venv/bin', name), path.join(TK, '.venv/Scripts', name + '.exe')].filter(Boolean); return c.find((f) => fs.existsSync(f)) || name; }
