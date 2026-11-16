#!/usr/bin/env node
// Does this install work?  node tools/selftest.mjs [--full]
// Fast (about 20 s): approval workflow, cinematography solver, example storyboards, critics on a good and a bad fixture, audio measurement.
// --full adds (need Chrome and the Kokoro files): a voice sample, Playwright capture on a local page, the HTML/GSAP/HyperFrames/remocn adapters, one rendered 3D still.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { TK, PY, run, syncProject, timing, stills } from './lib/pipeline.mjs';
const full = process.argv.includes('--full'), res = [];
const t = async (name, fn) => { try { const m = await fn(); res.push([true, name, m || '']); } catch (e) { res.push([false, name, String(e.message || e).split('\n').slice(0, 4).join(' | ')]); } };
const sh = (cmd, args, o) => { const r = run(cmd, args, o); if (r.status) throw new Error((r.stderr || r.stdout || `exit ${r.status}`).trim().slice(-400)); return r.stdout; };
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'reel-selftest-'));

await t('approval workflow (gates, stale approvals, receipts)', () => sh('node', [path.join(TK, 'tools/selftest_state.mjs')]).trim().split('\n').pop());
await t('pipeline end-to-end: approval chain, final fingerprints, delivery profile, audio gates, visual critic, assets, readiness', () => sh('node', [path.join(TK, 'tools/selftest_pipeline.mjs')]).trim().split('\n').pop());
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
await t('remocn: the registry index parses and search ranks by use-for text (offline sample)', async () => {
  const { parseIndex, score } = await import('./remocn.mjs'); const sample = '## Typography\n\n| Component | Use for | Avoid for | Length | Vibe | Tier | Deps | Docs |\n|---|---|---|---|---|---|---|---|\n | `soft-blur-in` | A hero headline needs the soft reveal. | You want a hard exit. | 60f | premium | remocn | — | [docs](https://remocn.dev/docs/typography/soft-blur-in.md) | \n | `claude-code` | Depicting a coding-agent terminal. | Generic terminal. | 160f | tech | remocn | `@remocn/caret` | [docs](https://remocn.dev/docs/ai/claude-code.md) | \n';
  const e = parseIndex(sample); if (e.length !== 2 || e[0].name !== 'soft-blur-in' || e[1].deps[0] !== '@remocn/caret' || e[0].length !== '60f') throw new Error('index not parsed: ' + JSON.stringify(e));
  if (score(e[0], 'headline reveal') <= score(e[1], 'headline reveal')) throw new Error('search ranking wrong');
});
await t('next + scaffold: a fresh project asks for intake; a script becomes a valid draft storyboard', async () => {
  const P = path.join(tmp, 'nx'); sh('node', [path.join(TK, 'tools/new_project.mjs'), 'nx', '--dir', tmp]); const n1 = sh('node', [path.join(TK, 'tools/next.mjs'), P]); if (!/NEXT: intake/.test(n1)) throw new Error('next.mjs did not ask for intake: ' + n1.slice(0, 120));
  fs.writeFileSync(path.join(P, 'brief.json'), JSON.stringify({ title: 'T', topic: 't', platform: 'instagram-reels', duration_sec: 20, language: 'en', style_pack: 'stickman-3d', cta: { keyword: 'GO' } }));
  fs.mkdirSync(path.join(P, 'script'), { recursive: true }); fs.writeFileSync(path.join(P, 'script/script.json'), JSON.stringify({ title: 'T', language: 'en', lines: [{ id: 'L01', text: 'Why is this so hard?', beat: 'hook' }, { id: 'L02', text: 'Run npx remotion render now.', beat: 'step' }, { id: 'L03', text: 'Comment GO for the link.', beat: 'cta' }] }));
  sh('node', [path.join(TK, 'tools/scaffold_storyboard.mjs'), P]); const sb = JSON.parse(fs.readFileSync(path.join(P, 'storyboard/storyboard.json'), 'utf8')), man = JSON.parse(fs.readFileSync(path.join(TK, 'remotion-template/src/components/manifest.json'), 'utf8')).components;
  if (sb.shots.length !== 3 || sb.shots.some((x) => !man[x.component])) throw new Error('bad draft: ' + sb.shots.map((x) => x.component)); if (sb.shots[1].component !== 'Terminal' || sb.shots[2].component !== 'EndCard') throw new Error('expected Terminal then EndCard, got ' + sb.shots.map((x) => x.component));
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
  await t('Playwright capture (local page): actions, scroll, wait, recording, provenance, honest failures', () => sh('node', [path.join(TK, 'tools/selftest_capture.mjs')]).trim().split('\n').pop());
  await t('reference ingestion: MP4, MOV, image, website, repo, video URL (known material)', () => sh('node', [path.join(TK, 'tools/selftest_reference.mjs')], { timeout: 900000 }).trim().split('\n').filter(Boolean).pop());
  await t('HTML/GSAP + HyperFrames + remocn adapters: deterministic frames through the real renderer', () => sh('node', [path.join(TK, 'tools/selftest_hyperframes.mjs')], { timeout: 1500000 }).trim().split('\n').filter(Boolean).pop());
  await t('one rendered 3D still (stickman-3d example)', () => {
    sh('node', [path.join(TK, 'tools/run_example.mjs'), 'experiment-stick', 'st', '--dir', tmp], { env: { ...process.env, REEL_TEST_MODE: '1' } });
    const P = path.join(tmp, 'st'); syncProject(P); timing(P); stills(P, ['S01']);
    const f = path.join(P, 'review/storyboard/S01.png'); if (!fs.existsSync(f) || fs.statSync(f).size < 20000) throw new Error('still missing or empty'); return `${fs.statSync(f).size} bytes`;
  });
}
fs.rmSync(tmp, { recursive: true, force: true });
for (const [ok, n, m] of res) console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${m ? '  ' + m : ''}`);
const bad = res.filter((r) => !r[0]).length; console.log(bad ? `\n${bad} check(s) failed. See TROUBLESHOOTING.md or run: node tools/doctor.mjs` : `\nAll ${res.length} checks passed.`); process.exit(bad ? 1 : 0);
