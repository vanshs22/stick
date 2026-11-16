#!/usr/bin/env node
// The approval workflow must refuse shortcuts. This tries every shortcut and asserts it is refused.
//   node tools/selftest_state.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const S = path.join(path.dirname(fileURLToPath(import.meta.url)), 'state.mjs'), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'st-'));
const run = (...a) => spawnSync('node', [S, ...a], { encoding: 'utf8' });
let fails = 0; const expect = (name, r, ok) => { const pass = ok ? r.status === 0 : r.status !== 0; if (!pass) { fails++; console.error(`FAIL: ${name}\n${r.stdout}${r.stderr}`); } else console.log(`ok   ${name}`); };
expect('init a real project', run('init', dir), true);
expect('--test is refused without REEL_TEST_MODE', run('init', path.join(dir, 'x'), '--test'), false);
expect('approve without a request is refused', run('approve', dir, 'intake', '--quote', 'yes'), false);
expect('request fails while the brief file does not exist', run('request', dir, 'intake'), false);
fs.writeFileSync(path.join(dir, 'brief.json'), '{"title":"x"}');
expect('request works once the file exists', run('request', dir, 'intake'), true);
expect('approve without a quote is refused', run('approve', dir, 'intake'), false);
expect('approve with the user quote works', run('approve', dir, 'intake', '--quote', 'yes, go ahead'), true);
fs.writeFileSync(path.join(dir, 'brief.json'), '{"title":"changed after approval"}');
expect('a later stage is BLOCKED because the approved file changed (stale)', run('check', dir, 'style'), false);
expect('request again after the change', run('request', dir, 'intake'), true);
expect('approve again', run('approve', dir, 'intake', '--quote', 'ok that version'), true);
expect('the next stage is open now', run('check', dir, 'style'), true);
expect('later gates stay closed (script needs style, topic, research)', run('check', dir, 'script'), false);
fs.mkdirSync(path.join(dir, 'storyboard'), { recursive: true }); fs.writeFileSync(path.join(dir, 'storyboard/storyboard.json'), JSON.stringify({ shots: [{ id: 'S01' }, { id: 'S02' }] }));
run('request', dir, 'storyboard'); expect('storyboard cannot be approved while frames are open', run('approve', dir, 'storyboard', '--quote', 'all good'), false);
run('frame', dir, 'S01', 'approve'); run('frame', dir, 'S02', 'reject', '--note', 'wrong angle'); expect('a rejected frame reopens the storyboard', run('approve', dir, 'storyboard', '--quote', 'all good'), false);
expect('delegation is refused for the storyboard (the user must look themselves)', run('approve', dir, 'storyboard', '--quote', 'run through everything', '--delegated'), false);
expect('delegation is refused for the final', run('approve', dir, 'final', '--quote', 'run through everything', '--delegated'), false);
expect('seal refuses an unapproved project', run('seal', dir, path.join(dir, 'v.mp4')), false);
if (fails) { console.error(`${fails} shortcut(s) were NOT refused`); process.exit(1); } console.log('SELFTEST PASSED: every shortcut is refused');
