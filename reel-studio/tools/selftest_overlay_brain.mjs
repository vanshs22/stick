#!/usr/bin/env node
// The overlay brain must find what deserves a picture, choose the right device, respect the budget, and the critic must notice a number with no picture and stop noticing it once the director has placed one.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { TK } from './lib/pipeline.mjs';
import { detect } from './lib/overlay_brain.mjs';
const bad = [], has = (text, device, beat = 'step') => detect(text, { beat, skin: { words: {} }, keyword: 'CLIP' }).some((d) => d.device === device), no = (text, device, beat = 'step') => !has(text, device, beat);
const T = [
  ['Earn thousands of dollars every month.', 'rain'], ['It costs $0 to start.', 'price-tag'], ['It is free forever.', 'price-tag'], ['There is no monthly fee.', 'crossed-calendar'], ['Then, on November 19th, paste the link.', 'calendar'],
  ['It cuts 335 lines down to 10.', 'counter'], ['It takes ten seconds.', 'counter'], ['Post it on TikTok, Reels, and Shorts.', 'platform'], ['Pick the jokes, the stories, and the fights.', 'list'],
  ['Number three is Napkin.', 'step'], ['First, open the app.', 'step'], ['Nobody shows you how.', 'verdict-bad', 'hook'], ['It is done.', 'verdict-good', 'cta'], ['Without it you wait, with it you ship.', 'compare'], ['Be careful with your keys.', 'warning'], ['Comment CLIP.', 'cta-keyword', 'cta']];
for (const [t, d, b] of T) if (!has(t, d, b || 'step')) bad.push(`"${t}" should give ${d}`);
for (const [t, d] of [['Clip GTA 6 videos.', 'counter'], ['Upgrade to Windows 11 today.', 'counter'], ['One thing matters.', 'counter'], ['It is a simple idea.', 'price-tag'], ['Nobody knows.', 'verdict-bad']]) if (!no(t, d, d === 'verdict-bad' ? 'step' : 'step')) bad.push(`"${t}" must NOT give ${d}`);   // names with digits are not quantities; failure banners are for the hook
const P = fs.mkdtempSync(path.join(os.tmpdir(), 'ob-')), w = (f, o) => { fs.mkdirSync(path.dirname(path.join(P, f)), { recursive: true }); fs.writeFileSync(path.join(P, f), JSON.stringify(o)); };
const L = [{ id: 'L01', beat: 'hook', text: 'Three weeks per video? You flop.', emphasis: [] }, { id: 'L02', beat: 'step', text: 'First, post it on TikTok, Reels, and Shorts for $0 in ten seconds.', emphasis: [] }, { id: 'L03', beat: 'step', text: 'Then relax.', emphasis: [] }, { id: 'L04', beat: 'cta', text: 'Comment CLIP.', emphasis: [] }];
w('script/script.json', { title: 't', language: 'en', lines: L }); w('brief.json', { style_pack: 'editorial-sticker', topic: 'posting video clips to TikTok Reels and Shorts', cta: { keyword: 'CLIP' } });
w('storyboard/storyboard.json', { style_pack: 'editorial-sticker', shots: L.map((l, i) => ({ id: `S0${i + 1}`, line_ids: [l.id], component: 'TitleCard', props: { text: 'x' }, anchors: [], overlays: [], shot_type: 'typography', approach: 'motion-graphics' })) });
const run = (...a) => spawnSync('node', ['--no-warnings', ...a], { encoding: 'utf8', env: { ...process.env, REEL_TEST_MODE: '1' } });
const crit = () => { run(path.join(TK, 'tools/critique.mjs'), P, 'storyboard'); return JSON.parse(fs.readFileSync(path.join(P, 'review/critics/storyboard.json'), 'utf8')).findings.filter((f) => /nothing is shown on that word/.test(f.problem || '')); };
const before = crit(); if (before.length < 3) bad.push(`the critic should flag the unshown number, price and platforms (found ${before.length})`);
const d = run(path.join(TK, 'tools/overlay_director.mjs'), P, '--apply'); if (d.status) bad.push('director failed: ' + (d.stderr || d.stdout).slice(-200)); if (!/skin: creator-studio/.test(d.stdout)) bad.push('a topic about TikTok and video clips should pick the creator-studio skin');
const plan = JSON.parse(fs.readFileSync(path.join(P, 'storyboard/overlay-plan.json'), 'utf8')); if (plan.lines.some((l) => l.devices.filter((x) => !/^(step|verdict)/.test(x.device)).length > 3)) bad.push('the budget of 3 per line was exceeded');
const sb = JSON.parse(fs.readFileSync(path.join(P, 'storyboard/storyboard.json'), 'utf8')); if (!sb.shots.some((s) => s.overlays.some((o) => o.type === 'verdict' && /FLOPPED/.test(o.text)))) bad.push('the hook failure should become a FLOPPED banner in this skin');
const after = crit(); if (after.length >= before.length) bad.push(`after --apply the critic should find fewer gaps (${before.length} -> ${after.length})`);
const g = (t) => spawnSync('node', [path.join(TK, 'tools/overlay_director.mjs'), '--text', t], { encoding: 'utf8' }).stdout.split('\n')[0]; if (!/game-hud/.test(g('Clip the best GTA stream moments as a gamer'))) bad.push('a gaming topic should pick the game-hud skin'); if (!/finance-ticker/.test(g('How to invest money in stocks and crypto for profit'))) bad.push('a money topic should pick the finance-ticker skin');
// unusual ideas: a word no rule knows still gets a prop; an abstract idea gets its metaphor; rules win over props; filler words get nothing
const pr = (t) => detect(t, { beat: 'step', skin: { words: {} } }).find((d) => d.device === 'prop');
if (pr('Every bottleneck in your pipeline costs you.')?.spec.emoji !== '\u{1F6A7}') bad.push('bottleneck should get the roadblock prop');
if (pr('Trust is a handshake you earn slowly.')?.spec.emoji !== '\u{1F91D}') bad.push('trust should get the handshake prop');
if (pr('Nobody wants to wait in a long queue.')?.spec.emoji !== '\u{1F6B6}') bad.push('queue should get a prop');
if (pr('Look at this and see what you think.')) bad.push('verbs like look, see, think must not trigger a prop');
if (detect('It costs $0 to start with a noodle stall.', { beat: 'step', skin: { words: {} } }).filter((d) => d.device === 'prop').length > 1) bad.push('at most one prop per line');
fs.rmSync(P, { recursive: true, force: true });
if (bad.length) { console.log('FAIL  overlay brain\n  ' + bad.join('\n  ')); process.exit(1); } console.log(`PASS  overlay brain: ${T.length} device rules, 5 non-triggers, skins, budget, and the critic (${before.length} gaps before the director, ${after.length} after)`);
