#!/usr/bin/env node
// Viral rubric check: a weak script is flagged on the specific points, a strong one passes, an unfilled plan is refused, and `new` scaffolds a plan that fails until it is written.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
const T = path.dirname(fileURLToPath(import.meta.url)), tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'viral-')), { run } = await import(pathToFileURL(path.join(T, 'critics/viral.mjs')).href);
const mk = (name, lines, plan, brief = {}) => { const P = path.join(tmp, name); fs.mkdirSync(path.join(P, 'script'), { recursive: true }); fs.writeFileSync(path.join(P, 'brief.json'), JSON.stringify(brief)); fs.writeFileSync(path.join(P, 'script/script.json'), JSON.stringify({ title: 't', language: 'en', lines: lines.map((l, i) => ({ id: `L0${i + 1}`, beat: 'step', ...(typeof l === 'string' ? { text: l } : l) })) })); if (plan) fs.writeFileSync(path.join(P, 'script/viral-plan.json'), JSON.stringify(plan)); return P; };
const log = console.log; console.log = () => {}; const go = async (P) => { const r = await run(P); return r; };
const probs = (r) => r.findings.map((f) => f.problem).join(' | ');
const bad = await go(mk('bad', ['So, hey guys, today we are going to talk about something really amazing that you will totally love, which is very important for everyone who uses the internet every single day.', 'It is basically a thing that works.', 'It is really just very good and literally amazing.', 'Thanks for watching, comment SAFE and follow me.', 'Bye.']));
const goodPlan = { format: 'explainer', promise: 'You will check the address, not the padlock.', hook: { options: [{ pattern: 'q', line: 'Does the padlock mean this site is safe?' }, { pattern: 'c', line: 'The padlock lies.' }, { pattern: 'n', line: 'Only 11 percent understand the lock.' }], chosen: 0 }, beats: [{ beat: 'hook', job: 'ask', lines: ['L01'] }, { beat: 'proof', job: 'show', lines: ['L04'] }, { beat: 'cta', job: 'ask', lines: ['L06'] }], cta: { keyword: 'LOCK' }, loop: { echo: 'padlock' }, share: { reason: 'It corrects a belief most people hold.' } };
const good = await go(mk('good', ['Does the padlock mean this site is safe?', 'Nearly all phishing sites show that padlock too.', 'Only 11 percent of people understand it.', { text: 'Chrome replaced it.', beat: 'proof' }, 'Check the address, not the icon.', 'Save this before a padlock fools you. Comment LOCK.'], goodPlan, { cta: { keyword: 'LOCK' } }));
const todo = await go(mk('todo', ['Does the padlock mean this site is safe?', 'No, it does not.', 'Check the address first.', 'Save this and comment LOCK.'], { ...goodPlan, promise: 'TODO: write it' }));
const none = await go(mk('none', ['Does the padlock mean this site is safe?', 'No, it does not.', 'Check the address first.', 'Save this and comment LOCK.'], null));
console.log = log;
assert.match(probs(bad), /filler|more than 3 seconds/, 'a greeting-and-filler hook must be flagged'); assert.match(probs(bad), /no script\/viral-plan|viral-plan/, 'a missing plan is flagged'); assert.notEqual(bad.verdict, 'pass');
assert.match(probs(bad), /intensifiers/, 'weak words flagged'); assert.match(probs(bad), /CTA keyword|echo the first/, 'the loop or CTA placement is flagged');
assert.ok(!good.findings.some((f) => f.severity !== 'minor'), `a strong script has no major finding: ${probs(good)}`); assert.ok(good.score >= 90, `good score ${good.score}`);
assert.match(probs(todo), /TODO placeholders/, 'an unfilled plan is refused'); assert.ok(todo.findings.some((f) => f.severity === 'major'));
assert.match(probs(none), /no script\/viral-plan\.json/);
const sub = await go(mk('sub', ['Does Incognito protect you from your boss?', 'It only hides history.', 'Check the address.', 'Comment HIDE now.'], goodPlan, { cta: { keyword: 'HIDE' } })); assert.ok(!/CTA keyword appears before/.test(probs(sub)), 'the keyword HIDE must not match the word hides');
// scaffold: `new` writes a plan that fails until written
const P = mk('scaffold', ['Why is my box here?', 'It has a key.', 'The key opens it.', 'Box. Box. Box.'], null, { duration_sec: 14 });
const r = spawnSync('node', [path.join(T, 'script_studio.mjs'), 'new', P, '--format', 'story'], { encoding: 'utf8' }); assert.equal(r.status, 0, r.stderr); const plan = JSON.parse(fs.readFileSync(path.join(P, 'script/viral-plan.json'), 'utf8')); assert.equal(plan.format, 'story'); assert.ok(JSON.stringify(plan).includes('TODO'));
const s = spawnSync('node', [path.join(T, 'script_studio.mjs'), 'score', P], { encoding: 'utf8' }); assert.match(s.stdout, /TODO placeholders/);
console.log('VIRAL SELFTEST PASSED: weak script flagged on filler, long hook, weak words, missing plan; strong script passes; TODO plan refused; scaffold works');
