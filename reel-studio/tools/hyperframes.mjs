#!/usr/bin/env node
// HyperFrames registry blocks (Apache-2.0, https://hyperframes.heygen.com) as ready-made HTML/GSAP motion you can drop into a shot.
// They are NOT a second renderer: the block's paused GSAP timeline is seeked by the Remotion frame (components/HtmlBlock.tsx).
//   node tools/hyperframes.mjs search <words> [--tag social] [--max 10]     (needs network; npx hyperframes catalog)
//   node tools/hyperframes.mjs add <block> --project <P>                    installs into <P>/assets/hyperframes/<block>.html (the build copies assets/ into the render)
//   node tools/hyperframes.mjs list --project <P>                           what is installed, with each block's size, duration and variables
// Use in a storyboard shot: { "component": "HtmlBlock", "props": { "src": "assets/hyperframes/<block>.html", "vars": {...}, "fit": "cover" } }
// Blocks that need WebGPU shaders or a runtime-only API will not render in headless Chrome without a GPU: `add` warns for the tag webgpu.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { TK } from './lib/pipeline.mjs';

const VERSION = '0.9.58';   // pinned: the registry format is verified against this CLI version
const a = process.argv.slice(2), cmd = a[0], opt = (k, d) => (a.includes('--' + k) ? a[a.indexOf('--' + k) + 1] : d);
const HOME = process.env.REEL_HOME || process.env.REEL_STUDIO_HOME || path.join(os.homedir(), '.reel-studio');
const writable = (d) => { try { fs.mkdirSync(d, { recursive: true }); fs.accessSync(d, fs.constants.W_OK); return true; } catch { return false; } };
const HFHOME = [os.homedir(), HOME].find((d) => writable(path.join(d, '.hyperframes-probe')) && true) || HOME;   // the CLI wants to write ~/.hyperframes (telemetry config); use a writable home
const hf = (args, cwd) => spawnSync('npx', ['--yes', `hyperframes@${VERSION}`, ...args], { cwd, encoding: 'utf8', env: { ...process.env, HOME: HFHOME, HYPERFRAMES_TELEMETRY: 'off' }, timeout: 180000, shell: process.platform === 'win32' });
const proj = () => { const P = path.resolve(opt('project', '.')); if (!fs.existsSync(path.join(P, 'brief.json')) && !fs.existsSync(path.join(P, 'state.json'))) { console.error('not a project folder: run tools/new_project.mjs first'); process.exit(2); } return P; };
const info = (f) => { const h = fs.readFileSync(f, 'utf8'); const g = (k) => (h.match(new RegExp(`data-${k}="([^"]+)"`)) || [])[1]; let vars = []; try { vars = JSON.parse((h.match(/data-composition-variables='([^']+)'/s) || [])[1] || '[]').map((v) => v.id); } catch { /* none */ } return { w: +g('width') || null, h: +g('height') || null, duration: +g('duration') || null, vars, webgpu: /webgpu|navigator\.gpu/i.test(h), usesRandomOrClock: /Math\.random|Date\.now|performance\.now/.test(h) }; };
if (cmd === 'search') {
  const r = hf(['catalog', '--json', ...(opt('tag') ? ['--tag', opt('tag')] : []), ...a.slice(1).filter((x, i, arr) => !x.startsWith('--') && !['--tag', '--max'].includes(arr[i - 1]))], os.tmpdir());
  if (r.status) { console.error('HyperFrames catalog needs network and npm: ' + (r.stderr || '').trim().split('\n').pop()); process.exit(1); }
  let items = []; try { items = JSON.parse(r.stdout.slice(r.stdout.indexOf('['))); } catch { console.log(r.stdout.slice(0, 3000)); process.exit(0); }
  for (const i of items.slice(0, +opt('max', 10))) console.log(`${String(i.name).padEnd(28)} ${String(i.type).padEnd(9)} ${(i.description || '').slice(0, 110)}`);
} else if (cmd === 'add') {
  const name = a[1], P = proj(); if (!name || name.startsWith('--')) { console.error('usage: hyperframes.mjs add <block> --project <P>'); process.exit(2); }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-')), r = hf(['add', name, '--no-clipboard', '--json'], tmp);
  const src = path.join(tmp, 'compositions', `${name}.html`);
  if (r.status || !fs.existsSync(src)) { console.error(`could not install "${name}": ${((r.stderr || '') + (r.stdout || '')).trim().split('\n').slice(-3).join(' | ')}\nOffline? Use a hand-written block like remotion-template/public/hyperframes/lower-third.html.`); process.exit(1); }
  fs.mkdirSync(path.join(P, 'assets/hyperframes'), { recursive: true }); fs.copyFileSync(src, path.join(P, 'assets/hyperframes', `${name}.html`));
  const i = info(src); console.log(`installed ${name}: ${i.w}x${i.h}, ${i.duration} s, variables: ${i.vars.join(', ') || '(none)'}\nuse: {"component":"HtmlBlock","props":{"src":"assets/hyperframes/${name}.html","fit":"${i.w > i.h ? 'cover' : 'contain'}","vars":{}}}`);
  if (i.webgpu) console.log('WARNING: this block uses WebGPU: it will not render in headless Chrome without a GPU. Pick another block.');
  if (i.usesRandomOrClock) console.log('WARNING: this block reads Math.random/Date.now/performance.now: frames may not be deterministic. Check with tools/selftest_hyperframes.mjs <block>.');
  fs.rmSync(tmp, { recursive: true, force: true });
} else if (cmd === 'list') {
  const d = path.join(proj(), 'assets/hyperframes'); for (const f of fs.existsSync(d) ? fs.readdirSync(d).filter((x) => x.endsWith('.html')) : []) { const i = info(path.join(d, f)); console.log(`${f.padEnd(34)} ${i.w}x${i.h} ${i.duration}s vars: ${i.vars.join(',') || '-'}${i.webgpu ? '  [WEBGPU]' : ''}`); }
} else { console.error('commands: search <words> | add <block> --project P | list --project P'); process.exit(2); }
