#!/usr/bin/env node
// Mood picker: story beats get the music a viewer would expect, and the mood critic accepts what the picker writes.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pickMusic } from './audio/mood_pick.mjs';
import { run as moodCritic } from './critics/mood.mjs';

const bad = [], ok = (c, m) => { if (!c) bad.push(m); };
const sc = { title: 't', lines: [
  { id: 'L01', beat: 'hook', text: 'x', emotion: 'fear' }, { id: 'L02', beat: 'hook', text: 'x', emotion: 'shock' },
  { id: 'L03', beat: 'low', text: 'x', emotion: 'sad' },
  { id: 'L04', beat: 'win', text: 'x', emotion: 'happy' }, { id: 'L05', beat: 'win', text: 'x', emotion: 'proud' },
  { id: 'L06', beat: 'quiet', text: 'x', emotion: 'calm' }] };
const plan = pickMusic(sc), by = Object.fromEntries(plan.map((b) => [b.beat_id, b]));
ok(plan.map((b) => b.beat_id).join() === 'hook,low,win,quiet', 'beats must keep script order');
ok(['tense', 'chaotic', 'eerie'].includes(by.hook.mood), `fear + shock should be tense/chaotic/eerie, got ${by.hook.mood}`);
ok(by.low.mood === 'sad', `a sad beat should get sad music, got ${by.low.mood}`);
ok(['triumphant', 'playful', 'warm', 'epic'].includes(by.win.mood), `happy + proud should be bright, got ${by.win.mood}`);
ok(by.quiet.mood === 'calm', `a calm beat should get calm music, got ${by.quiet.mood}`);
ok(by.hook.bpm > by.quiet.bpm, 'an intense beat must be faster than a calm one');
ok(plan.every((b) => b.bpm >= 70 && b.bpm <= 140 && b.query === `${b.genre}@${b.bpm}`), 'bpm out of range or query malformed');
ok(pickMusic({ lines: [{ id: 'L01', beat: 'a', text: 'x' }] }).length === 0, 'lines with no emotion give no plan');
const P = fs.mkdtempSync(path.join(os.tmpdir(), 'mood-')); fs.mkdirSync(path.join(P, 'script')); fs.mkdirSync(path.join(P, 'audio'));
fs.writeFileSync(path.join(P, 'script/script.json'), JSON.stringify(sc)); fs.writeFileSync(path.join(P, 'audio/audio-plan.json'), JSON.stringify({ voice: { engine: 'kokoro' }, music: { direction: 'x' }, mix: { target_lufs: -14, true_peak_db: -1 }, music_by_beat: plan }));
const log = console.log; console.log = () => {}; const r = await moodCritic(P); console.log = log;
ok(r.verdict === 'pass' && !r.findings.length, 'the mood critic must accept the picker output: ' + r.findings.map((f) => f.problem).join('; '));
if (bad.length) { console.error('MOOD PICK SELFTEST FAILED:\n- ' + bad.join('\n- ')); process.exit(1); }
console.log('MOOD PICK SELFTEST PASSED: beats get fitting moods and tempos in script order; the mood critic accepts the plan');
