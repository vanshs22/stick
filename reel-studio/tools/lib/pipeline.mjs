// Shared helpers so every tool builds, times and renders a project the same way (no copy-pasted shell).
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const TK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const PY = process.env.REEL_PY || (fs.existsSync(path.join(TK, '.venv/bin/python')) ? path.join(TK, '.venv/bin/python') : fs.existsSync(path.join(TK, '.venv/Scripts/python.exe')) ? path.join(TK, '.venv/Scripts/python.exe') : 'python3');
export const run = (cmd, args, opt = {}) => spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 1 << 28, ...opt });
export const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
export const log = (...m) => console.log(...m);

/** copy the Remotion template into <P>/remotion (code only; data stays), write the pack's style.json, link node_modules */
export function syncProject(P, { nodeModules = process.env.REEL_NODE_MODULES } = {}) {
  const R = path.join(P, 'remotion'), T = path.join(TK, 'remotion-template');
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  for (const f of walk(path.join(T, 'src'))) { const rel = path.relative(T, f); if (rel.startsWith(path.join('src', 'data'))) continue; fs.mkdirSync(path.dirname(path.join(R, rel)), { recursive: true }); fs.copyFileSync(f, path.join(R, rel)); }
  for (const f of ['remotion.config.ts', 'tsconfig.json', 'package.json']) if (!fs.existsSync(path.join(R, f)) || f !== 'package.json') fs.copyFileSync(path.join(T, f), path.join(R, f));
  const brief = rd(path.join(P, 'brief.json')), pack = rd(path.join(TK, 'style-packs', brief.style_pack, 'style.json'));
  fs.mkdirSync(path.join(R, 'src/data'), { recursive: true });
  fs.writeFileSync(path.join(R, 'src/data/style.json'), JSON.stringify({ id: pack.id, ...pack.tokens, effects: pack.effects || {}, defaults: pack.defaults || {} }, null, 1));
  for (const f of ['typography.json', 'captions.json']) { const src = path.join(P, 'typography', f); const dst = path.join(R, 'src/data', f); if (fs.existsSync(src)) fs.copyFileSync(src, dst); else if (!fs.existsSync(dst)) fs.copyFileSync(path.join(T, 'src/data', f), dst); }
  const nm = path.join(R, 'node_modules');
  if (!fs.existsSync(nm)) { if (nodeModules && fs.existsSync(nodeModules)) fs.symlinkSync(path.resolve(nodeModules), nm, 'dir'); else { log('npm install in ' + R + ' ...'); const r = run('npm', ['install', '--no-audit', '--no-fund', '--loglevel=error'], { cwd: R }); if (r.status) throw new Error('npm install failed:\n' + (r.stderr || r.stdout).slice(-600)); } }
  const vend = path.join(R, 'public/vendor'); fs.mkdirSync(vend, { recursive: true }); const gs = path.join(nm, 'gsap/dist/gsap.min.js'); if (fs.existsSync(gs)) fs.copyFileSync(gs, path.join(vend, 'gsap.min.js'));   // local GSAP for HyperFrames-style blocks (no CDN at render time)
  for (const f of ['hyperframes']) { const sd = path.join(T, 'public', f); if (fs.existsSync(sd)) fs.cpSync(sd, path.join(R, 'public', f), { recursive: true }); }
  return R;
}

/** estimated timing (no voice) or real timing if narration exists; always rebuilds data/timeline.json */
export function timing(P, { preset } = {}) {
  const env = { ...process.env, TTS_SCRIPT: 'data/tts.json' };
  let r = run('node', [path.join(TK, 'tools/audio/build_tts_input.mjs'), P]); if (r.status) throw new Error(r.stderr);
  if (!fs.existsSync(path.join(P, 'data/words.json')) || !fs.existsSync(path.join(P, 'data/narration.wav'))) { r = run(PY, [path.join(TK, 'tools/audio/estimate.py'), '.'], { cwd: P, env }); if (r.status) throw new Error(r.stderr || r.stdout); }
  r = run('node', [path.join(TK, 'tools/timing/build_timeline.mjs'), P, ...(preset ? ['--preset', preset] : [])]); if (r.status) throw new Error(r.stderr || r.stdout);
  return r.stdout.trim();
}

/** one still per shot (or --only list) into <P>/review/storyboard */
export function stills(P, only, at = 0.7) {
  const args = [path.join(TK, 'tools/preview_shots.mjs'), P, '--at', String(at)]; if (only) args.push('--only', only);
  const r = run('node', args, { env: { ...process.env, REMOTION_GL: process.env.REMOTION_GL || 'angle' } }); return { ok: !r.status, out: (r.stdout + r.stderr).trim() };
}
export function copyPublic(P, files) { const d = path.join(P, 'remotion/public/gallery'); fs.mkdirSync(d, { recursive: true }); return files.map((f) => { const m = f.split(path.sep).join('/').match(/style-packs\/([^/]+)\/preview\/([^/]+)$/), n = m ? `${m[1]}-${m[2]}` : path.basename(f); fs.copyFileSync(f, path.join(d, n)); return `gallery/${n}`; }); }

/** a small jpg for sheets (ffmpeg); returns the jpg path (or the png if ffmpeg is missing) */
export function thumb(png, jpg, w = 540) { const r = run('ffmpeg', ['-y', '-v', 'error', '-i', png, '-vf', `scale=${w}:-2`, '-q:v', '3', jpg]); return r.status ? png : jpg; }
export function deepMerge(a, b) { if (b === null) return undefined; if (Array.isArray(b) || typeof b !== 'object') return b; const o = { ...(a && typeof a === 'object' && !Array.isArray(a) ? a : {}) }; for (const [k, v] of Object.entries(b)) { const m = deepMerge(o[k], v); if (m === undefined) delete o[k]; else o[k] = m; } return o; }
export function setPath(obj, p, v) { const ks = p.split('.'); let o = obj; ks.slice(0, -1).forEach((k) => { o = o[k] = o[k] ?? {}; }); o[ks.at(-1)] = v; }

/** find a helper binary: env override, the toolkit venv, then PATH */
export function bin(name, envVar) { const c = [process.env[envVar || name.toUpperCase().replace(/-/g, '_')], path.join(TK, '.venv/bin', name), path.join(TK, '.venv/Scripts', name + '.exe')].filter(Boolean); return c.find((f) => fs.existsSync(f)) || name; }
