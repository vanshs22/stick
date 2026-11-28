#!/usr/bin/env node
// Story craft + choreography proofs: the lint rejects AI-sounding and too-long scripts and passes the Pull short; the choreography checker catches every planted logic defect and passes a correct one.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { checkChoreo, compileStage, posAt } from './lib/choreo.mjs';
import { planScenes, checkLedger } from './lib/scene_planner.mjs';
const TK = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..'), run = (args) => spawnSync('node', ['--no-warnings', ...args], { encoding: 'utf8' });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'story-')), w = (name, o) => { const f = path.join(tmp, name); fs.writeFileSync(f, JSON.stringify(o)); return f; };
// lint
const good = path.join(TK, 'examples/stickman-pull-story/script.json'); if (run([path.join(TK, 'tools/script_lint.mjs'), good]).status) throw new Error('lint rejects the Pull short');
const bad = w('bad.json', { title: 'x', lines: [{ id: 'L01', text: "Today we're going to delve into the ever-evolving journey of shortcuts — and why it matters — for you.", beat: 'hook', emotion: 'neutral' }, { id: 'L02', text: 'Shortcuts are important. Shortcuts are useful. Shortcuts are great.', beat: 'step' }, { id: 'L03', text: 'Like and subscribe.', beat: 'cta' }] });
const r = run([path.join(TK, 'tools/script_lint.mjs'), bad]); if (!r.status || !/ai-phrase/.test(r.stdout) || !/cta-generic|cta /.test(r.stdout) || !/hook-setup/.test(r.stdout)) throw new Error('lint missed planted defects: ' + r.stdout);
// choreography: a correct pull-door scene passes
const door = { id: 'door', kind: 'shopdoor', at: [-7.72, 0], face: 1, swing: 'out', hinge: 'far' }, mk = () => ({ id: 'S1', props: { world: 'city-street', cast: [{ id: 'a', at: [-6.3, 0.4], pose: [[0, 'idle']] }], props3d: [{ ...door }] } });
const okShot = mk(); okShot.props.cast[0].pose.push([0.5, 'reach']); okShot.props.props3d[0].open = [1.0, 0.8]; okShot.props.cast[0].path = [[0, -6.3, 0.4], [1.2, -6.3, 0.4], [1.5, -5.4, 0.4]];
if (checkChoreo(okShot, 4, { roadHalf: 4.5 }).length) throw new Error('a correct choreography was rejected: ' + checkChoreo(okShot, 4, { roadHalf: 4.5 }).join('; '));
const planted = [['no reach before open', (s) => { s.props.cast[0].pose = [[0, 'idle']]; }, /handle/], ['person inside the swing', (s) => { s.props.cast[0].path = [[0, -7.2, 0.0], [4, -7.2, 0.0]]; s.props.cast[0].at = [-7.2, 0]; }, /swing/], ['walks through before open', (s) => { s.props.cast[0].path = [[0, -6.3, 0.4], [0.3, -6.3, 0.4], [0.8, -8.2, 0.4]]; }, /before it is open/], ['two overlap', (s) => { s.props.cast.push({ id: 'b', at: [-6.2, 0.45] }); }, /overlap/], ['walks into a hydrant', (s) => { s.props.props3d.push({ id: 'h', kind: 'hydrant', at: [-6.3, 0.4] }); }, /walks into/], ['stands on the road', (s) => { s.props.cast[0].path = null; s.props.cast[0].at = [0.5, 0.4]; }, /road/]];
for (const [name, mutate, re] of planted) { const s = mk(); s.props.cast[0].pose.push([0.5, 'reach']); s.props.props3d[0].open = [1.0, 0.8]; mutate(s); const out = checkChoreo(s, 4, { roadHalf: 4.5 }).join(' | '); if (!re.test(out)) throw new Error(`choreography missed "${name}": ${out}`); }
// compile: walk + pose + open become keys
const cast = [{ id: 'a', at: [-5, 2], pose: [[0, 'idle']], mood: [[0, 'neutral']] }], pr = [{ id: 'd', kind: 'shopdoor', at: [-7.72, 0], face: 1 }]; compileStage({ actions: [{ who: 'a', do: 'walk', to: [-6, 0.4], at: 0.1, dur: 0.4 }, { who: 'a', do: 'pose', pose: 'reach', at: 0.5 }, { prop: 'd', do: 'open', at: 0.6, dur: 0.2 }] }, cast, pr, 4);
if (cast[0].path.length < 3 || !cast[0].pose.some((k) => k[1] === 'reach') || !pr[0].open) throw new Error('compileStage did not produce paths, poses and the door timing'); const mid = posAt(cast[0], 2); if (!(mid[0] < -5)) throw new Error('posAt does not follow the path');
// planner: ledger passes for the Pull short and the camera never sits in traffic
const sc = JSON.parse(fs.readFileSync(good, 'utf8')), { shots, ledger, choreo } = planScenes(sc, { ink: 0.8 }); if (choreo.length || checkLedger(ledger).length) throw new Error('planner reported problems for the Pull short: ' + [...choreo, ...checkLedger(ledger)].join('; '));
if (!shots.every((s) => s.props.camera.movement.type === 'take' && s.props.camera.movement.keys.length >= 2)) throw new Error('every shot should be a keyed take');
// voice direction runs
if (run([path.join(TK, 'tools/voice_direction.mjs'), good, path.join(tmp, 'vd.json')]).status) throw new Error('voice_direction failed'); const vd = JSON.parse(fs.readFileSync(path.join(tmp, 'vd.json'), 'utf8')); if (vd.lines.length !== 5 || !(vd.lines[3].delivery.pause_before > vd.lines[1].delivery.pause_before)) throw new Error('the pause before the twist should be longer');
console.log('ok: story lint, choreography proofs (6 planted defects caught), compile, planner ledger and voice direction');
