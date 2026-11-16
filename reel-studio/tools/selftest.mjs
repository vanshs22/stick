#!/usr/bin/env node
// Does this install work?  node tools/selftest.mjs [--full]
// Fast (about 20 s): approval workflow, cinematography solver, example storyboards, critics on a good and a bad fixture, audio measurement.
// --full adds: a voice sample (needs the Kokoro files) and one rendered 3D still (needs Chrome).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { TK, PY, run, syncProject, timing, stills } from './lib/pipeline.mjs';
const full = process.argv.includes('--full'), res = [];
const t = async (name, fn) => { try { const m = await fn(); res.push([true, name, m || '']); } catch (e) { res.push([false, name, String(e.message || e).split('\n').slice(0, 4).join(' | ')]); } };
const sh = (cmd, args, o) => { const r = run(cmd, args, o); if (r.status) throw new Error((r.stderr || r.stdout || `exit ${r.status}`).trim().slice(-400)); return r.stdout; };
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'reel-selftest-'));

await t('approval workflow (gates, stale approvals, receipts)', () => sh('node', [path.join(TK, 'tools/selftest_state.mjs')]).trim().split('\n').pop());
await t('cinematography solver and critic', () => sh('node', [path.join(TK, 'tools/selftest_cinematography.mjs')]).trim().split('\n').pop());
await t('example projects are present', () => {
  const ex = fs.readdirSync(path.join(TK, 'examples')).filter((d) => fs.existsSync(path.join(TK, 'examples', d, 'storyboard.json')) || fs.existsSync(path.join(TK, 'examples', d, 'storyboard/storyboard.json')));
  if (!ex.length) throw new Error('no examples'); return `${ex.length} examples found`;
});
await t('script critic: catches a bad script, passes a good one', async () => {
  const mk = (name, lines) => { const P = path.join(tmp, name); fs.mkdirSync(path.join(P, 'script'), { recursive: true }); fs.writeFileSync(path.join(P, 'brief.json'), JSON.stringify({ duration_sec: 20 })); fs.writeFileSync(path.join(P, 'script/script.json'), JSON.stringify({ title: 't', lines: lines.map((x, i) => ({ id: `L0${i + 1}`, text: x, beat: 'x' })) })); return P; };
  const { run: scriptCritic } = await import('./critics/script.mjs'); const log = console.log; console.log = () => {};
  try {
    const bad = await scriptCritic(mk('bad', ['Hello everyone and welcome back to my channel today.', 'It works fine.', 'It works fine.']));
    const good = await scriptCritic(mk('good', ['Why did my box show up with no sender?', 'I opened it slowly.', 'Inside was a golden key.']));
    if (bad.verdict === 'pass') throw new Error('bad script passed'); if (good.verdict !== 'pass') throw new Error('good script failed: ' + JSON.stringify(good.findings.map((f) => f.problem)));
  } finally { console.log = log; }
  return 'bad=revise good=pass';
});
await t('research critic: flags a claim with a missing source', async () => {
  const P = path.join(tmp, 'res'); fs.mkdirSync(path.join(P, 'research'), { recursive: true }); fs.writeFileSync(path.join(P, 'research/research.json'), JSON.stringify({ sources: [{ id: 's1', url: 'https://a.example/x' }], claims: [{ id: 'C1', text: 'x', source_ids: ['nope'] }] }));
  const { run: r } = await import('./critics/research.mjs'); const log = console.log; console.log = () => {}; let out; try { out = await r(P, { online: false }); } finally { console.log = log; }
  if (!out.findings.some((f) => /does not exist/.test(f.problem))) throw new Error('missing-source claim not flagged');
});
await t('vision critic refuses to claim it looked when it did not', () => {
  const P = path.join(tmp, 'vis'), sb = path.join(P, 'review/storyboard'); fs.mkdirSync(sb, { recursive: true });
  for (const n of ['S01', 'S02', 'S03']) sh('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=gray:s=32x32:d=0.1', '-frames:v', '1', path.join(sb, `${n}.png`)]);
  sh('node', [path.join(TK, 'tools/critique.mjs'), P, 'vision', '--packet', 'camera']); fs.writeFileSync(path.join(P, 'f.json'), JSON.stringify({ inspected: [], findings: [] }));
  const r = run('node', [path.join(TK, 'tools/critique.mjs'), P, 'vision', '--submit', 'camera', '--file', path.join(P, 'f.json')]); if (r.status === 0 || !/inspected/.test(r.stderr)) throw new Error('empty submission accepted or rejected for the wrong reason: ' + r.stderr.slice(0, 200));
});
await t('python side: numpy, scipy, opencv, pillow import', () => { sh(PY, ['-c', 'import numpy, scipy, cv2, PIL; print("ok")']); });
await t('ffmpeg works (and a 1 s test clip can be made)', () => { sh('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=red:s=64x64:d=1', path.join(tmp, 't.mp4')]); if (!fs.existsSync(path.join(tmp, 't.mp4'))) throw new Error('no output'); });
if (full) {
  await t('voice sample (Kokoro)', () => { const P = path.join(tmp, 'v'); fs.mkdirSync(path.join(P, 'data'), { recursive: true }); fs.writeFileSync(path.join(P, 'data/tts.json'), JSON.stringify({ lines: [{ id: 'L01', text: 'This is a test of the voice.' }] })); sh(PY, [path.join(TK, 'tools/audio/voice.py'), '.'], { cwd: P, env: { ...process.env, TTS_SCRIPT: 'data/tts.json' } }); if (!fs.existsSync(path.join(P, 'data/narration.wav'))) throw new Error('no narration.wav'); });
  await t('one rendered 3D still (stickman-3d example)', () => {
    sh('node', [path.join(TK, 'tools/run_example.mjs'), 'experiment-stick', 'st', '--dir', tmp], { env: { ...process.env, REEL_TEST_MODE: '1' } });
    const P = path.join(tmp, 'st'); syncProject(P); timing(P); stills(P, ['S01']);
    const f = path.join(P, 'review/storyboard/S01.png'); if (!fs.existsSync(f) || fs.statSync(f).size < 20000) throw new Error('still missing or empty'); return `${fs.statSync(f).size} bytes`;
  });
}
fs.rmSync(tmp, { recursive: true, force: true });
for (const [ok, n, m] of res) console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${m ? '  ' + m : ''}`);
const bad = res.filter((r) => !r[0]).length; console.log(bad ? `\n${bad} check(s) failed. See TROUBLESHOOTING.md or run: node tools/doctor.mjs` : `\nAll ${res.length} checks passed.`); process.exit(bad ? 1 : 0);
