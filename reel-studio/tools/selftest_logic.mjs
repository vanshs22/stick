#!/usr/bin/env node
// Logic critic: a clean scene passes; every planted defect (overlap, inside furniture, back turned, wrong emotion, costume change) is caught.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { run } from './critics/logic.mjs';

const mk = (name, shots, lines) => {
  const P = fs.mkdtempSync(path.join(os.tmpdir(), `logic-${name}-`)); fs.mkdirSync(path.join(P, 'storyboard'), { recursive: true }); fs.mkdirSync(path.join(P, 'script'), { recursive: true });
  fs.writeFileSync(path.join(P, 'storyboard/storyboard.json'), JSON.stringify({ shots })); fs.writeFileSync(path.join(P, 'script/script.json'), JSON.stringify({ title: 't', lines }));
  return P;
};
const shot = (id, line, cast, props3d = []) => ({ id, line_ids: [line], component: 'Stage3D', props: { world: 'home-studio', cast, props3d } });
const hero = (o = {}) => ({ id: 'hero', kind: 'human', at: [-1, 0.5], rotY: Math.PI / 2, speaks: true, mood: 'happy', ...o });
const pal = (o = {}) => ({ id: 'pal', kind: 'human', at: [0, 0.5], rotY: -Math.PI / 2, mood: 'curious', ...o });
const LINES = [{ id: 'L01', text: 'x', emotion: 'happy' }, { id: 'L02', text: 'y', emotion: 'sad' }];
const quiet = async (P) => { const log = console.log; console.log = () => {}; try { return await run(P); } finally { console.log = log; } };
const has = (r, sev, re) => r.findings.some((f) => f.severity === sev && re.test(f.problem));
const bad = [];
const expect = (ok, msg) => { if (!ok) bad.push(msg); };

const good = await quiet(mk('good', [shot('S01', 'L01', [hero(), pal()])], LINES));
expect(good.verdict === 'pass', `clean scene should pass, got ${good.findings.map((f) => f.problem).join('; ')}`);

expect(has(await quiet(mk('overlap', [shot('S01', 'L01', [hero({ at: [0, 0.5] }), pal()])], LINES)), 'blocker', /inside each other/), 'two characters on the same spot not caught');
expect(has(await quiet(mk('close', [shot('S01', 'L01', [hero({ at: [-0.45, 0.5] }), pal()])], LINES)), 'major', /overlap/), 'two characters 0.45 m apart not caught');
expect((await quiet(mk('hug', [shot('S01', 'L01', [hero({ at: [-0.1, 0.5], contact: true }), pal()])], LINES))).verdict === 'pass', 'contact:true should allow a hug');
expect(has(await quiet(mk('furniture', [shot('S01', 'L01', [hero({ at: [1.7, -2.45], rotY: 0 })])], LINES)), 'blocker', /stands inside desk/), 'character inside the desk not caught');
expect(has(await quiet(mk('prop', [shot('S01', 'L01', [hero({ at: [0.5, 0.5] })], [{ id: 'table', kind: 'sidetable', at: [0.5, 0, 0.5] }])], LINES)), 'blocker', /stands inside table/), 'character inside a prop not caught');
expect((await quiet(mk('seated', [shot('S01', 'L01', [hero({ at: [0.5, 0.5], y: 0.5 })], [{ id: 'table', kind: 'sidetable', at: [0.5, 0, 0.5] }])], LINES))).verdict === 'pass', 'a character raised on a prop (cast.y) should pass');
expect(has(await quiet(mk('back', [shot('S01', 'L01', [hero({ rotY: -Math.PI / 2 }), pal({ rotY: Math.PI / 2 })])], LINES)), 'major', /back to everyone/), 'speaker with its back to the listener not caught');
expect(has(await quiet(mk('look', [shot('S01', 'L01', [hero({ lookAt: 'pal', rotY: -Math.PI / 2, speaks: false }), pal()])], LINES)), 'major', /back to pal/), 'looking at something with the body turned away not caught');
expect(has(await quiet(mk('emotion', [shot('S01', 'L02', [hero({ mood: 'happy' }), pal()])], LINES)), 'major', /"sad" line/), 'happy face on a sad line not caught');
expect(has(await quiet(mk('nomood', [shot('S01', 'L02', [hero({ mood: undefined }), pal()])], LINES)), 'minor', /no mood/), 'missing mood on an emotional line not noted');
expect(has(await quiet(mk('costume', [shot('S01', 'L01', [hero({ look: { shirt: 'red' } }), pal()]), shot('S02', 'L02', [hero({ look: { shirt: 'blue' }, mood: 'sad' }), pal()])], LINES)), 'major', /changes between S01 and S02/), 'costume change across shots not caught');

if (bad.length) { console.error('LOGIC SELFTEST FAILED:\n- ' + bad.join('\n- ')); process.exit(1); }
console.log('LOGIC SELFTEST PASSED: clean scene passes; overlap, inside furniture, inside a prop, back turned, wrong look-at, wrong emotion, missing mood and costume change are all caught; hug and raised-on-prop are allowed');
