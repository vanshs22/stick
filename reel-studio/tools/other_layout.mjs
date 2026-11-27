#!/usr/bin/env node
// Look at a project in the OTHER layout before committing to one: stills of its shots as 16:9 (or 9:16), made in a throwaway copy.
//   node tools/other_layout.mjs <projectDir> [--aspect 16:9|9:16] [--only S01,S03]    -> <projectDir>/review/layout-16x9/ (stills + storyboard.jpg)
// The project itself is not touched. Every style pack works in both layouts; what changes is the frame, the safe zones, the presenter side and the camera lens (see skills/camera-grammar).
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { syncProject, TK } from './lib/pipeline.mjs';
const a = process.argv.slice(2), P = path.resolve(a[0] || ''), opt = (k, d) => { const i = a.indexOf('--' + k); return i >= 0 ? a[i + 1] : d; };
if (!a[0] || !fs.existsSync(path.join(P, 'brief.json'))) { console.error('usage: other_layout.mjs <projectDir> [--aspect 16:9|9:16] [--only S01,S03]'); process.exit(2); }
const brief = JSON.parse(fs.readFileSync(path.join(P, 'brief.json'), 'utf8')), cur = brief.aspect || brief.delivery?.aspect || (['youtube', 'linkedin', 'x'].includes(brief.platform) ? '16:9' : '9:16'), want = opt('aspect', cur === '16:9' ? '9:16' : '16:9');
const tmp = path.join(P, `.layout-${want.replace(':', 'x')}`), out = path.join(P, 'review', `layout-${want.replace(':', 'x')}`);
fs.rmSync(tmp, { recursive: true, force: true }); fs.mkdirSync(tmp, { recursive: true });
for (const f of fs.readdirSync(P)) if (!['renders', 'review', 'remotion'].includes(f) && !f.startsWith('.layout-')) fs.cpSync(path.join(P, f), path.join(tmp, f), { recursive: true });
fs.mkdirSync(path.join(tmp, 'remotion'), { recursive: true }); if (fs.existsSync(path.join(P, 'remotion/node_modules'))) fs.symlinkSync(path.join(P, 'remotion/node_modules'), path.join(tmp, 'remotion/node_modules'), 'junction');
fs.writeFileSync(path.join(tmp, 'brief.json'), JSON.stringify({ ...brief, aspect: want, delivery: { ...(brief.delivery || {}), aspect: want, width: undefined, height: undefined } }, null, 1));
syncProject(tmp);
const run = (s, args) => spawnSync('node', [path.join(TK, s), tmp, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
let r = run('tools/timing/build_timeline.mjs', []); if (r.status) { console.error((r.stdout + r.stderr).slice(-600)); process.exit(1); }
r = run('tools/preview_shots.mjs', opt('only') ? ['--only', opt('only')] : []); console.log(r.stdout.trim().split('\n').slice(-3).join('\n')); if (r.status) { console.error(r.stderr.slice(-600)); process.exit(1); }
fs.rmSync(out, { recursive: true, force: true }); fs.cpSync(path.join(tmp, 'review'), out, { recursive: true }); fs.rmSync(tmp, { recursive: true, force: true });
console.log(`${want} stills: ${out}`);
