#!/usr/bin/env node
// Director: purposes and camera by purpose are drafted, the critic catches planted defects (wide hook, wide emotion, missing purpose, equal lengths).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { direct } from './direct_shots.mjs';
import { run } from './critics/director.mjs';

const TK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..'), bad = [], must = (n, ok, why) => { if (!ok) bad.push(`${n}: ${why}`); };
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dir-')), P = path.join(root, 'p');
fs.mkdirSync(path.join(P, 'storyboard'), { recursive: true }); fs.mkdirSync(path.join(P, 'script'), { recursive: true });
const lines = [['L01', 'He bent the loop out of shape and it cost him everything.', 'curious'], ['L02', 'The rival copied it bolt for bolt.', 'calm'], ['L03', 'But the cart was crawling at the top.', 'fear'], ['L04', 'And then it fell.', 'shock'], ['L05', 'The whole park went silent.', 'sad'], ['L06', 'Comment loop and I will send you the plans.', 'happy']].map(([id, text, emotion]) => ({ id, text, emotion }));
fs.writeFileSync(path.join(P, 'script/script.json'), JSON.stringify({ lines }));
const shot = (id, l, camera) => ({ id, line_ids: [l], visual_intent: 'x', shot_type: 'character', component: 'StickScene', camera });
fs.writeFileSync(path.join(P, 'storyboard/storyboard.json'), JSON.stringify({ style_pack: 'sketchy-stickman', shots: lines.map((l, i) => shot('S0' + (i + 1), l.id, { framing: 'close', movement: 'hold' })) }));
let rep = await run(P); must('no purposes is a major', rep.findings?.some((f) => f.severity === 'major' && /purpose/.test(f.problem)), JSON.stringify(rep.findings?.[0]));
const { rows } = direct(P); must('first is hook', rows[0].purpose === 'hook', rows[0].purpose); must('shock line becomes emotion shot', rows[3].purpose === 'emotion', rows[3].purpose); must('last is cta', rows[5].purpose === 'cta', rows[5].purpose);
execFileSync('node', [path.join(TK, 'tools/direct_shots.mjs'), P, '--write'], { stdio: 'pipe' });
const sb = JSON.parse(fs.readFileSync(path.join(P, 'storyboard/storyboard.json'), 'utf8')); must('purpose written', sb.shots.every((s) => s.purpose && s.why), 'missing purpose or why');
rep = await run(P); must('drafted storyboard has no major', !rep.findings?.some((f) => f.severity === 'major'), JSON.stringify(rep.findings?.filter((f) => f.severity === 'major')));
sb.shots[0].camera.framing = 'wide establishing'; sb.shots[3].camera.framing = 'wide'; fs.writeFileSync(path.join(P, 'storyboard/storyboard.json'), JSON.stringify(sb));
rep = await run(P); must('wide hook is a major', rep.findings?.some((f) => /hook opens on a wide/.test(f.problem)), 'not caught'); must('wide emotion is a major', rep.findings?.some((f) => /emotion beat is not a close-up/.test(f.problem)), 'not caught');
console.log(bad.length ? 'FAIL\n- ' + bad.join('\n- ') : 'director ok: purposes drafted, camera by purpose, wide hook and wide emotion caught, missing purpose caught');
process.exit(bad.length ? 1 : 0);
