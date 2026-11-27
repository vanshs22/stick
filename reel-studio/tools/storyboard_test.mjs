#!/usr/bin/env node
// Storyboard test of a style with the v3 crew tools: example project -> director's draft (purpose, camera, acting) -> caption choice -> stills of every shot + contact sheet -> director critic.
//   node tools/storyboard_test.mjs <key|all> [--out storyboard-tests]
// Writes storyboard-tests/<key>/{storyboard.jpg, shots/*.png, director.json, captions-choice.json, report.json}. Stills are drawn by the real engine (tools/preview_shots.mjs); nothing is mocked.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { TK, run } from './lib/pipeline.mjs';

const a = process.argv.slice(2), table = JSON.parse(fs.readFileSync(path.join(TK, 'docs/styles/storyboard-tests.json'), 'utf8')); delete table._doc;
const keys = a[0] === 'all' ? Object.keys(table) : [a[0]], OUT = path.resolve(a.includes('--out') ? a[a.indexOf('--out') + 1] : path.join(TK, 'storyboard-tests')), env = { ...process.env, REEL_TEST_MODE: '1' };
if (!a[0] || keys.some((k) => !table[k])) { console.error(`usage: storyboard_test.mjs <${Object.keys(table).join('|')}|all> [--out dir]`); process.exit(2); }
const sh = (args, o = {}) => run('node', ['--no-warnings', ...args], { env, ...o }), summary = [];
for (const key of keys) {
  const t = table[key], tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sbt-')), out = path.join(OUT, key), t0 = Date.now(); fs.mkdirSync(out, { recursive: true });
  console.log(`\n== ${key}: ${t.name} (example ${t.example})`);
  const step = (label, args, o) => { const r = sh(args, o); if (r.status && label !== 'critic') { console.error(`${label} failed: ${(r.stderr || r.stdout).slice(-400)}`); return null; } return r; };
  if (!step('run_example', [path.join(TK, 'tools/run_example.mjs'), t.example, key, '--dir', tmp])) { summary.push({ key, ok: false, why: 'run_example' }); continue; }
  const P = path.join(tmp, key);
  if (!step('direct_shots', [path.join(TK, 'tools/direct_shots.mjs'), P, '--write'])) { summary.push({ key, ok: false, why: 'direct_shots' }); continue; }
  step('caption_choose', [path.join(TK, 'tools/caption_choose.mjs'), P, '--write']);
  if (!step('preview_shots', [path.join(TK, 'tools/preview_shots.mjs'), P], { timeout: 3000000 })) { summary.push({ key, ok: false, why: 'preview_shots' }); continue; }
  step('critic', [path.join(TK, 'tools/critique.mjs'), P, 'director']);
  const cp = (f, to) => { try { fs.cpSync(path.join(P, f), path.join(out, to), { recursive: true }); } catch { /* optional */ } };
  cp('review/storyboard.jpg', 'storyboard.jpg'); cp('review/storyboard', 'shots'); cp('review/critics/director.json', 'director.json'); cp('captions/captions-choice.json', 'captions-choice.json'); cp('storyboard/storyboard.json', 'storyboard.json');
  const dj = (() => { try { return JSON.parse(fs.readFileSync(path.join(out, 'director.json'), 'utf8')); } catch { return {}; } })(), cc = (() => { try { return JSON.parse(fs.readFileSync(path.join(out, 'captions-choice.json'), 'utf8')); } catch { return {}; } })();
  const rep = { key, name: t.name, ok: true, secs: Math.round((Date.now() - t0) / 1000), director: { verdict: dj.verdict, score: dj.score, findings: (dj.findings || []).map((f) => `${f.severity}: ${f.problem}`) }, captions: { preset: cc.preset, accent: cc.accent } };
  fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(rep, null, 1)); summary.push(rep); console.log(`   ${rep.secs}s  director ${dj.verdict} ${dj.score}  captions ${cc.preset}/${cc.accent}`);
}
console.log('\n' + summary.map((s) => `${s.ok ? 'ok  ' : 'FAIL'} ${s.key.padEnd(18)} ${s.ok ? `${s.secs}s director ${s.director.verdict} ${s.director.score}` : s.why}`).join('\n')); process.exit(summary.every((s) => s.ok) ? 0 : 1);
