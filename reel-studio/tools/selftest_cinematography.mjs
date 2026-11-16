#!/usr/bin/env node
// The critic must REJECT bad direction. This builds a deliberately bad storyboard and asserts each defect is caught.
//   node tools/selftest_cinematography.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cine-'));
fs.mkdirSync(path.join(dir, 'storyboard'), { recursive: true });
const hero = { id: 'hero', kind: 'human', at: [0, 0], rotY: 0.3 };
const shot = (id, camera, extra = {}) => ({ id, line_ids: ['L01'], component: 'Stage3D', shot_type: 'character', props: { world: 'home-studio', cast: [hero], props3d: [], camera, ...extra }, transition_out: { type: 'cut' } });
const sb = { shots: [
  shot('S01', { framing: 'medium', angle: 'eye-level', subject: 'hero', movement: { type: 'dolly-push', why: 'to make it more dynamic and keep things moving along nicely', to: { framing: 'close-up' }, target: 'hero', duration: 2, profile: 'ease-in-out', curve: 'sine', focus: { target: 'hero' }, constraints: ['face stays in frame'] } }),
  shot('S02', { framing: 'medium', angle: 'eye-level', subject: 'hero', movement: { type: 'dolly-push', why: 'x', to: { framing: 'wide' }, duration: 2 } }),
  shot('S03', { framing: 'medium', angle: 'eye-level', subject: 'hero' }),
  shot('S04', { framing: 'medium', angle: 'three-quarter', az: 35, subject: 'hero' }, { cast: [{ ...hero, at: [2, 1] }] }),
  shot('S05', { framing: 'medium', angle: 'three-quarter', az: -35, subject: 'hero' }),
] };
fs.writeFileSync(path.join(dir, 'storyboard/storyboard.json'), JSON.stringify(sb));
const r = spawnSync('node', ['--no-warnings', path.join(HERE, 'check_cinematography.mjs'), dir], { encoding: 'utf8' }), out = r.stdout + r.stderr;
const want = ['justified only by', 'has no reason', 'does not get closer', 'jump cut', 'jumps to a different position', 'crosses the axis'];
const miss = want.filter((w) => !out.includes(w));
if (r.status !== 1 || miss.length) { console.error(`SELFTEST FAILED. exit ${r.status}; not caught: ${miss.join(' | ')}\n${out}`); process.exit(1); }
console.log(`ok: the cinematography critic caught all ${want.length} planted defects`);
