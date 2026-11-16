#!/usr/bin/env node
// A small ACTUAL render: proves Remotion + Chrome + ffmpeg + the assembler work on this machine.
//   node tools/smoke_render.mjs [--keep]
// Takes the motion-graphics example, keeps its first two shots, builds an estimate-timing preview at quarter size, and checks that a decodable MP4 with
// the right shot count and a plausible length comes out. No voice model needed. About 1 to 3 minutes with software rendering.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { TK, run } from './lib/pipeline.mjs';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'reel-smoke-')), env = { ...process.env, REEL_TEST_MODE: '1', REMOTION_GL: process.env.REMOTION_GL || '' };
const sh = (args, o = {}) => spawnSync('node', ['--no-warnings', ...args], { encoding: 'utf8', env, ...o });
let r = sh([path.join(TK, 'tools/run_example.mjs'), 'motion-graphics', 'smoke', '--dir', tmp]); if (r.status) { console.error('run_example failed: ' + (r.stderr || r.stdout).slice(-300)); process.exit(1); }
const P = path.join(tmp, 'smoke'), rd = (f) => JSON.parse(fs.readFileSync(path.join(P, f), 'utf8')), wr = (f, v) => fs.writeFileSync(path.join(P, f), JSON.stringify(v, null, 1));
const sc = rd('script/script.json'), sb = rd('storyboard/storyboard.json');
sb.shots = sb.shots.slice(0, 2); const keep = new Set(sb.shots.flatMap((x) => x.line_ids)); sc.lines = sc.lines.filter((l) => keep.has(l.id)); wr('script/script.json', sc); wr('storyboard/storyboard.json', sb);
const t0 = Date.now(); r = sh([path.join(TK, 'tools/build_video.mjs'), P, '--estimate', '--scale', '0.25'], { timeout: 900000 });
const out = path.join(P, `renders/smoke.mp4`), qa = (() => { try { return rd('renders/smoke.qa.json'); } catch { return null; } })();
const fail = (m) => { console.error('SMOKE RENDER FAILED: ' + m + '\n' + (r.stdout + r.stderr).slice(-700)); process.exit(1); };
if (r.status || !fs.existsSync(out)) fail('build_video did not produce renders/smoke.mp4');
const dec = run('ffmpeg', ['-v', 'error', '-i', out, '-f', 'null', '-']); if (dec.status || (dec.stderr || '').trim()) fail('the MP4 does not decode cleanly: ' + dec.stderr.slice(-200));
if (!qa || qa.measured.duration < 1.5) fail('the MP4 is shorter than 1.5 s: ' + JSON.stringify(qa?.measured));
console.log(`SMOKE RENDER OK: ${sb.shots.length} shots, ${qa.measured.width}x${qa.measured.height}, ${qa.measured.duration.toFixed(1)} s, decodes cleanly, built in ${Math.round((Date.now() - t0) / 1000)} s (quarter-size estimate preview)`);
if (process.argv.includes('--keep')) console.log('kept: ' + P); else fs.rmSync(tmp, { recursive: true, force: true });
