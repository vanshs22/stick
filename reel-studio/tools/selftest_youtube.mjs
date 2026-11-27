#!/usr/bin/env node
// Self-test of the YouTube package and its critic on a synthetic 200 s 16:9 film (no render needed): good package passes, planted defects are caught.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { TK, run } from './lib/pipeline.mjs';
const P = fs.mkdtempSync(path.join(os.tmpdir(), 'yt-')), w = (f, o) => { fs.mkdirSync(path.dirname(path.join(P, f)), { recursive: true }); fs.writeFileSync(path.join(P, f), typeof o === 'string' ? o : JSON.stringify(o)); };
const beats = ['hook', 'setup', 'step', 'step', 'proof', 'cta'], N = 40, lines = [], words = [], sl = [];
for (let i = 0; i < N; i++) { const b = beats[Math.min(5, Math.floor(i / 7))], text = `Sentence number ${i} explains one idea clearly.`; sl.push({ id: 'L' + i, beat: b, text }); lines.push({ i, text, start: 0.3 + i * 5, end: 4.8 + i * 5 }); text.split(' ').forEach((t, j) => words.push({ w: t, line: i, s: 0.3 + i * 5 + j * 0.6, e: 0.3 + i * 5 + j * 0.6 + 0.5 })); }
w('script/script.json', { title: 'Self test film', lines: sl }); w('brief.json', { platform: 'youtube', aspect: '16:9', title: 'Self test film about clear ideas', topic: 'clear ideas', goal: 'teach clearly' }); w('data/lines.json', { duration: 200, lines }); w('data/words.json', words); w('data/timeline.json', { width: 1920, height: 1080, fps: 30 }); fs.mkdirSync(path.join(P, 'renders'), { recursive: true });
let r = run('ffmpeg', ['-y', '-v', 'error', '-f', 'lavfi', '-i', 'testsrc=size=1920x1080:rate=5', '-t', '200', '-c:v', 'libx264', '-preset', 'ultrafast', '-pix_fmt', 'yuv420p', path.join(P, 'renders/film.mp4')]); if (r.status) { console.error('ffmpeg missing or failed:', r.stderr); process.exit(1); }
const node = (...a) => spawnSync('node', ['--no-warnings', ...a], { encoding: 'utf8' }), bad = [];
r = node(path.join(TK, 'tools/package_youtube.mjs'), P); if (r.status) bad.push('package failed: ' + (r.stderr || r.stdout).slice(-300));
const J = JSON.parse(fs.readFileSync(path.join(P, 'renders/youtube/youtube.json'), 'utf8')); if (J.chapters.length < 3 || J.chapters[0].t0 !== 0) bad.push(`chapters: ${JSON.stringify(J.chapters)}`);
const crit = () => { node(path.join(TK, 'tools/critique.mjs'), P, 'youtube'); return JSON.parse(fs.readFileSync(path.join(P, 'review/critics/youtube.json'), 'utf8')); };
let c = crit(); if (c.verdict !== 'pass') bad.push('a good package did not pass: ' + JSON.stringify(c.findings.map((f) => f.problem)));
const D = path.join(P, 'renders/youtube');
fs.writeFileSync(path.join(D, 'captions.en.srt'), '1\n00:00:05,000 --> 00:00:03,000\nbackwards cue\n\n'); c = crit(); if (!c.findings.some((f) => /SRT/.test(f.problem))) bad.push('did not catch a broken SRT');
J.chapters = [{ t0: 0, title: 'a' }, { t0: 4, title: 'b' }]; fs.writeFileSync(path.join(D, 'youtube.json'), JSON.stringify(J)); c = crit(); if (!c.findings.some((f) => /chapters/.test(f.problem))) bad.push('did not catch bad chapters');
fs.rmSync(path.join(D, 'thumbnail.jpg')); c = crit(); if (!c.findings.some((f) => /thumbnail/.test(f.problem))) bad.push('did not catch a missing thumbnail');
fs.rmSync(P, { recursive: true, force: true });
if (bad.length) { console.log('FAIL  youtube package + critic\n  ' + bad.join('\n  ')); process.exit(1); } console.log('PASS  youtube package + critic: chapters, SRT, thumbnail made; a good package passes, a broken SRT, bad chapters and a missing thumbnail are caught');
