// Craft lint of the script critic: a flabby script is flagged, a tight one is clean. node tools/selftest_story.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { run } from './critics/script.mjs';
const mk = (lines) => { const P = fs.mkdtempSync(path.join(os.tmpdir(), 'story-')); fs.mkdirSync(path.join(P, 'script'), { recursive: true }); fs.writeFileSync(path.join(P, 'script/script.json'), JSON.stringify({ title: 't', language: 'en', est_seconds: 25, lines: lines.map((t, i) => ({ id: 'L' + String(i + 1).padStart(2, '0'), text: t, beat: i ? 'step' : 'hook' })) })); fs.writeFileSync(path.join(P, 'brief.json'), JSON.stringify({ duration_sec: 25 })); return P; };
const quiet = console.log; console.log = () => {};
const bad = await run(mk(['Caching is really important for performance.', 'Caching is basically a great solution for many things.', 'Caching is amazing and powerful stuff.', 'Caching helps with a lot of problems.', 'Caching can improve things in various ways.', 'Caching is something everybody should use.'])),
  good = await run(mk(['Your page loads in eleven seconds.', 'The server answered in forty milliseconds.', 'So where did ten seconds go?', 'Your browser asked for the same logo eleven times.', 'Eleven downloads, one image.', 'Cache that logo and the page drops to two seconds.', 'But cache it wrong and your users never see an update.', 'Check your headers. Eleven is too many.']));
console.log = quiet;
const probs = (r) => r.findings.map((f) => f.problem).join(' | ');
for (const k of ['filler', 'vague', 'start with', 'no turn', 'nobody is addressed']) assert.match(probs(bad), new RegExp(k), `bad script should trigger "${k}": ${probs(bad)}`);
assert.equal(good.findings.length, 0, 'the tight script should be clean: ' + probs(good));
console.log('story craft lint: ok (flabby script flagged on 5 craft checks, tight script clean)');
