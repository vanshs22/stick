#!/usr/bin/env node
// Creates a ready project from an example: node tools/run_example.mjs <example> <projectName> [--dir parent]
// Examples: see examples/. The project is a TEST project (nothing in it is approved by a user; every receipt says TEST) so the pipeline can be tested end to end.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { set } from './state.mjs';

const a = process.argv.slice(2), [ex, name] = a, TK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), dir = a.includes('--dir') ? a[a.indexOf('--dir') + 1] : 'reel-projects';
if (!ex || !name) { console.error(`usage: run_example.mjs <example> <projectName>\nexamples: ${fs.readdirSync(path.join(TK, 'examples')).join(', ')}`); process.exit(2); }
const src = path.join(TK, 'examples', ex), b = JSON.parse(fs.readFileSync(path.join(src, 'brief.json'), 'utf8'));
const r = spawnSync('node', [path.join(TK, 'tools/new_project.mjs'), name, '--dir', dir, '--style', b.style_pack, '--test'], { encoding: 'utf8', env: { ...process.env, REEL_TEST_MODE: '1' } }); if (r.status) { console.error(r.stderr); process.exit(1); }
const P = path.resolve(dir, name);
fs.copyFileSync(path.join(src, 'brief.json'), path.join(P, 'brief.json')); fs.copyFileSync(path.join(src, 'script.json'), path.join(P, 'script/script.json'));
fs.copyFileSync(path.join(src, 'storyboard.json'), path.join(P, 'storyboard/storyboard.json')); fs.copyFileSync(path.join(src, 'audio-plan.json'), path.join(P, 'audio/audio-plan.json'));
for (const [from, to] of [['visual-concept.json', 'storyboard/visual-concept.json'], ['research.json', 'research/research.json'], ['topic.json', 'topic/topic.json']]) if (fs.existsSync(path.join(src, from))) { fs.mkdirSync(path.dirname(path.join(P, to)), { recursive: true }); fs.copyFileSync(path.join(src, from), path.join(P, to)); }   // optional files an example may ship
for (const f of ['script/script.json:script', 'storyboard/storyboard.json:storyboard', 'audio/audio-plan.json:audio-plan', 'brief.json:production-brief']) { const [file, schema] = f.split(':'); const v = spawnSync('node', [path.join(TK, 'tools/validate.mjs'), schema, path.join(P, file)], { encoding: 'utf8' }); if (v.status) { console.error(v.stderr); process.exit(1); } }
for (const s of ['intake', 'style', 'topic', 'research', 'script', 'script_critic', 'storyboard', 'storyboard_critic', 'audio', 'typography', 'captions']) set(P, s, 'done');
console.log(`project ready: ${P}\nrun the pipeline: bash ${TK}/scripts/e2e.sh ${P}`);
