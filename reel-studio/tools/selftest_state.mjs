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
const put = (d, f, o) => { fs.mkdirSync(path.dirname(path.join(d, f)), { recursive: true }); fs.writeFileSync(path.join(d, f), typeof o === 'string' ? o : JSON.stringify(o)); };
const crit = (d, n, findings = []) => put(d, `review/critics/${n}.json`, { critic: n, verdict: findings.length ? 'revise' : 'pass', findings });
const directionFiles = (d) => { put(d, 'style-selection.json', { pack: 'editorial-sticker' }); put(d, 'topic/topic.json', { chosen: 't' }); put(d, 'research/research.json', { topic: 't' }); crit(d, 'research'); };
let fails = 0; const expect = (name, r, ok) => { const pass = ok ? r.status === 0 : r.status !== 0; if (!pass) { fails++; console.error(`FAIL: ${name}\n${r.stdout}${r.stderr}`); } else console.log(`ok   ${name}`); };
expect('init a real project', run('init', dir), true);
expect('--test is refused without REEL_TEST_MODE', run('init', path.join(dir, 'x'), '--test'), false);
expect('approve without a request is refused', run('approve', dir, 'direction', '--quote', 'yes'), false);
expect('request fails while the brief file does not exist', run('request', dir, 'direction'), false);
fs.writeFileSync(path.join(dir, 'brief.json'), '{"title":"x","topic":"t","platform":"tiktok","duration_sec":15,"style_pack":"editorial-sticker","language":"en"}');
expect('the direction gate needs the style, topic and research too (one question, not four)', run('request', dir, 'direction'), false);
directionFiles(dir); expect('request works once the files exist', run('request', dir, 'direction'), true);
crit(dir, 'research', [{ severity: 'major', problem: 'x' }]); expect('a research critic with a MAJOR finding stops the question being asked (tools refuse what tools can judge)', run('request', dir, 'direction'), false); crit(dir, 'research'); run('request', dir, 'direction');
expect('approve without a quote is refused', run('approve', dir, 'direction'), false);
expect('approve with the user quote works', run('approve', dir, 'direction', '--quote', 'yes, go ahead'), true);
fs.writeFileSync(path.join(dir, 'brief.json'), '{"title":"changed after approval","topic":"t","platform":"tiktok","duration_sec":15,"style_pack":"editorial-sticker","language":"en"}');
expect('a later stage is BLOCKED because the approved file changed (stale)', run('check', dir, 'script'), false);
expect('request again after the change', run('request', dir, 'direction'), true);
expect('approve again', run('approve', dir, 'direction', '--quote', 'ok that version'), true);
expect('the next stage is open now', run('check', dir, 'script'), true);
expect('later gates stay closed (the storyboard needs the script approved)', run('check', dir, 'assets'), false);
put(dir, 'storyboard/storyboard.json', { shots: [{ id: 'S01' }, { id: 'S02' }] }); put(dir, 'storyboard/visual-concept.json', { status: 'ready' }); put(dir, 'assets/asset-selection.json', { items: [{ id: 'a' }], problems: [] }); put(dir, 'review/assets-sheet.jpg', 'x'); put(dir, 'review/storyboard-sheets/sheet-1.jpg', 'x'); put(dir, 'review/storyboard/S01.png', 'x'); put(dir, 'review/storyboard/S02.png', 'x'); crit(dir, 'storyboard'); crit(dir, 'visual');
expect('the storyboard gate can be requested once stills, sheets, assets and critics exist', run('request', dir, 'storyboard_review'), true); expect('storyboard cannot be approved while frames are open', run('approve', dir, 'storyboard_review', '--quote', 'all good'), false);
run('frame', dir, 'S01', 'approve'); run('frame', dir, 'S02', 'reject', '--note', 'wrong angle'); expect('a rejected frame reopens the storyboard', run('approve', dir, 'storyboard_review', '--quote', 'all good'), false);
expect('delegation is refused for the storyboard (the user must look themselves)', run('approve', dir, 'storyboard_review', '--quote', 'run through everything', '--delegated'), false);
expect('the sound gate refuses a background-music film with no music', (() => { put(dir, 'audio/audio-plan.json', { status: 'chosen', mode: 'narrated_music', music: { bed: 'none' }, voice: {} }); put(dir, 'audio/voice-choice.json', { sfx: 'soft' }); put(dir, 'typography/typography.json', {}); put(dir, 'typography/captions.json', {}); return run('request', dir, 'sound_review'); })(), false);
expect('the sound gate refuses switching sound effects off with no reason', (() => { put(dir, 'audio/audio-plan.json', { status: 'chosen', mode: 'narrated_music', music: { bed: 'upbeat' }, voice: {} }); put(dir, 'audio/voice-choice.json', { sfx: 'none' }); return run('request', dir, 'sound_review'); })(), false);
expect('the sound gate opens with music and sound effects', (() => { put(dir, 'audio/voice-choice.json', { sfx: 'soft' }); return run('request', dir, 'sound_review'); })(), true);
expect('bundle: the blueprint (frames + sound) is requested as ONE question', run('bundle', dir, 'request'), true);
expect('bundle: a rejected frame still blocks the blueprint approval', run('bundle', dir, 'approve', '--quote', 'looks good'), false);
expect('bundle: one answer from the user approves both gates (each recorded with their words)', run('bundle', dir, 'approve', '--quote', 'yes, build it', '--all-frames'), true);
expect('bundle: the same answer cannot be used twice', run('bundle', dir, 'approve', '--quote', 'again', '--all-frames'), false);
expect('delegation is refused for the final', run('approve', dir, 'final', '--quote', 'run through everything', '--delegated'), false);
expect('seal refuses an unapproved project', run('seal', dir, path.join(dir, 'v.mp4')), false);
// hand-edited approvals (found by a fresh agent): setting "approved" in state.json must NOT open the gate; the real approve path must
{ const d2 = fs.mkdtempSync(path.join(os.tmpdir(), 'st2-')); run('init', d2); fs.writeFileSync(path.join(d2, 'brief.json'), JSON.stringify({ title: 'x' }));
  expect('an invalid brief.json cannot be put in front of the user', run('request', d2, 'direction'), false);
  const good = JSON.parse(fs.readFileSync(path.join(path.dirname(S), '..', 'examples/accept-roblox-explainer/brief.json'), 'utf8')); fs.writeFileSync(path.join(d2, 'brief.json'), JSON.stringify(good));
  directionFiles(d2); expect('a valid brief can be requested', run('request', d2, 'direction'), true);
  const st = JSON.parse(fs.readFileSync(path.join(d2, 'state.json'), 'utf8')); st.stages.direction = { ...st.stages.direction, status: 'approved', by: 'user', quote: 'user said yes', at: new Date().toISOString() }; fs.writeFileSync(path.join(d2, 'state.json'), JSON.stringify(st));
  expect('a hand-edited approval does not open the gate', run('check', d2, 'script'), false);
  run('reject', d2, 'direction', '--note', 'redo'); run('request', d2, 'direction'); expect('the real approve path opens the gate', run('approve', d2, 'direction', '--quote', 'looks right, go on'), true);
  expect('the gate is open after a real approval', run('check', d2, 'script'), true);
  const again = run('approve', d2, 'direction', '--quote', 'again'); expect('approving twice is refused', again, false); if (!/already approved/.test(again.stderr)) { fails++; console.error('FAIL: the message for a repeat approval must say "already approved":', again.stderr); }
  expect('seal without a video prints usage', run('seal', d2), false); }
if (fails) { console.error(`${fails} shortcut(s) were NOT refused`); process.exit(1); } console.log('SELFTEST PASSED: every shortcut is refused');
