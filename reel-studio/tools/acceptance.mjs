#!/usr/bin/env node
// Acceptance run: one example -> a REAL project (TEST mode: no user approved it, every receipt says so) -> real voice -> full-resolution render ->
// critics -> contact sheet -> post package -> a deliverable folder with the video, sheets, storyboard, critic reports, render metadata and limitations.
//   node tools/acceptance.mjs <example> [--id name] [--work <dir>] [--out <dir>] [--scale 1] [--stage prepare|build|review|collect|all] [--shots S01,S02]
// Resumable: the render is cached per shot, so if a call is cut off (long software-GL renders), run it again with --stage build.
// Output: <out>/<id>/{<id>.mp4, contact-sheet.jpg, frames/, storyboard.json, script.json, critics/, render-metadata.json, LIMITATIONS.md (you write it after LOOKING), approval-receipt}
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { TK, PY, run } from './lib/pipeline.mjs';

const a = process.argv.slice(2), ex = a[0], opt = (k, d) => (a.includes('--' + k) ? a[a.indexOf('--' + k) + 1] : d);
if (!ex || ex.startsWith('--')) { console.error('usage: acceptance.mjs <example> [--id name] [--work dir] [--out dir] [--scale 1] [--stage prepare|build|review|collect|all]'); process.exit(2); }
const id = opt('id', ex), work = path.resolve(opt('work', path.join(os.tmpdir(), 'reel-acceptance'))), out = path.resolve(opt('out', path.join(TK, '..', 'output', 'acceptance'))), scale = opt('scale', '1'), stage = opt('stage', 'all');
const P = path.join(work, id), O = path.join(out, id), env = { ...process.env, REEL_TEST_MODE: '1', TTS_SCRIPT: 'data/tts.json' };
const node = (args, o = {}) => spawnSync('node', ['--no-warnings', ...args], { encoding: 'utf8', env, maxBuffer: 1 << 26, ...o }), rd = (f) => JSON.parse(fs.readFileSync(path.join(P, f), 'utf8')), has = (f) => fs.existsSync(path.join(P, f));
const say = (m) => console.log(`\n== ${m}`), show = (r, n = 6) => (r.stdout + r.stderr).trim().split('\n').slice(-n).join('\n');

if (['prepare', 'all'].includes(stage)) {
  say(`prepare ${id} from example ${ex}`);
  if (!has('state.json')) { fs.mkdirSync(work, { recursive: true }); const r = node([path.join(TK, 'tools/run_example.mjs'), ex, id, '--dir', work]); if (r.status) { console.error(show(r)); process.exit(1); } console.log(show(r, 2)); }
  const caps = path.join(TK, 'examples', ex, 'captures.json');
  if (fs.existsSync(caps)) for (const c of JSON.parse(fs.readFileSync(caps, 'utf8'))) {   // REAL captures with provenance, never drawings
    if (c.hyperframes) { if (has(`assets/hyperframes/${c.hyperframes}.html`)) { console.log(`hyperframes ${c.hyperframes}: already there`); continue; } const r = node([path.join(TK, 'tools/hyperframes.mjs'), 'add', c.hyperframes, '--project', P], { timeout: 240000 }); console.log(`hyperframes ${c.hyperframes}: ${r.status === 0 ? 'ok' : 'FAILED'}\n${show(r, 2)}`); if (r.status) process.exit(1); continue; }
    if (has(`assets/${c.id}/page.png`)) { console.log(`capture ${c.id}: already there`); continue; }
    const args = [path.join(TK, 'tools/capture/capture_web.mjs'), c.url, '--out', path.join(P, 'assets', c.id), '--manifest', path.join(P, 'assets/manifest.json'), '--id', c.src || c.id, ...(c.viewport ? ['--viewport', c.viewport] : []), ...(c.actions ? ['--actions', (() => { const f = path.join(P, `assets/_actions-${c.id.replace(/[^\w]/g, '_')}.json`); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, JSON.stringify(c.actions)); return f; })()] : []), ...(c.expect || []).flatMap((e) => ['--expect', e])];
    const r = node(args, { timeout: 240000 }); console.log(`capture ${c.id} (${c.url}): ${r.status === 0 ? 'ok' : 'FAILED'}\n${show(r, 2)}`); if (r.status) process.exit(1);
  }
  let r = node([path.join(TK, 'tools/check_storyboard.mjs'), P]); console.log(show(r, 4)); if (r.status) process.exit(1);
  r = node([path.join(TK, 'tools/assets_review.mjs'), P]); console.log(show(r, 4));
  for (const c of ['script', 'storyboard']) { r = node([path.join(TK, 'tools/critique.mjs'), P, c]); console.log(`critique ${c}: ${show(r, 3)}`); }
}
if (['build', 'all'].includes(stage)) {
  say(`build ${id} at scale ${scale} (voice, timing, cues, mix, per-shot render, assemble)`);
  const t0 = Date.now(), r = node([path.join(TK, 'tools/build_video.mjs'), P, '--scale', scale, '--name', id, ...(opt('shots') ? ['--shots', opt('shots')] : [])], { timeout: 1700000 });
  console.log(show(r, 14)); console.log(`(${Math.round((Date.now() - t0) / 1000)} s)`); if (r.status) { console.error('build did not finish: run again with --stage build (finished shots are cached)'); process.exit(1); }
}
if (['review', 'all'].includes(stage)) {
  say('review: contact sheet, critics, post package');
  fs.mkdirSync(path.join(P, 'review'), { recursive: true });
  const mp4 = path.join(P, 'renders', `${id}.mp4`); if (!fs.existsSync(mp4)) { console.error('no video yet: run --stage build'); process.exit(1); }
  let r = node([path.join(TK, 'tools/qa/contact_sheet.mjs'), mp4, path.join(P, 'review/final.jpg'), '--every', opt('every', '1')]); console.log(show(r, 2));
  r = node([path.join(TK, 'tools/critique.mjs'), P, 'all']); console.log(show(r, 12));
  r = node([path.join(TK, 'tools/package_post.mjs'), P]); console.log(show(r, 4));
  r = node([path.join(TK, 'tools/state.mjs'), 'seal', P, mp4]); console.log(show(r, 2));
}
if (['collect', 'all'].includes(stage)) {
  say(`collect into ${O}`);
  fs.mkdirSync(O, { recursive: true }); const cp = (f, to) => { const s = path.join(P, f); if (fs.existsSync(s)) fs.cpSync(s, path.join(O, to || path.basename(f)), { recursive: true }); };
  cp(`renders/${id}.mp4`); cp('review/final.jpg', 'contact-sheet.jpg'); cp('storyboard/storyboard.json'); cp('script/script.json'); cp('storyboard/visual-concept.json'); cp('review/critics', 'critics'); cp('review/storyboard-sheets', 'storyboard-sheets'); cp('review/assets-sheet.jpg'); cp('renders/cover.jpg'); cp('renders/post.md'); cp('renders/report.md');
  cp(`renders/${id}.qa.json`); for (const f of fs.existsSync(path.join(P, 'renders')) ? fs.readdirSync(path.join(P, 'renders')) : []) if (/approval\.json$/.test(f)) cp(`renders/${f}`);
  // one frame per shot at full size, for looking at details
  const tl = has('data/timeline.json') ? rd('data/timeline.json') : null; fs.mkdirSync(path.join(O, 'frames'), { recursive: true });
  if (tl && fs.existsSync(path.join(O, `${id}.mp4`))) for (const s of tl.shots) run('ffmpeg', ['-y', '-v', 'error', '-ss', String(s.start + (s.end - s.start) * 0.7), '-i', path.join(O, `${id}.mp4`), '-frames:v', '1', '-q:v', '2', path.join(O, 'frames', `${s.id}.jpg`)]);
  const qa = has(`renders/${id}.qa.json`) ? rd(`renders/${id}.qa.json`) : null, crit = has('review/critics') ? fs.readdirSync(path.join(P, 'review/critics')).filter((f) => f.endsWith('.json')).map((f) => { const j = rd(`review/critics/${f}`); return { critic: j.critic, verdict: j.verdict, score: j.score, blocker: j.findings.filter((x) => x.severity === 'blocker').length, major: j.findings.filter((x) => x.severity === 'major').length, minor: j.findings.filter((x) => x.severity === 'minor').length, assessment: j.assessment }; }) : [];
  const git = spawnSync('git', ['-C', TK, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).stdout.trim() || null;
  const meta = { id, example: ex, style_pack: rd('brief.json').style_pack, rendered_at: new Date().toISOString(), toolkit_commit: git, scale: +scale, test_project: true, note: 'TEST project: no user approved this film; the receipt says TEST. Voice: Kokoro (local). Render: Remotion, software GL (no GPU).', qa: qa && { pass: qa.pass, preview: qa.preview, delivery_ready: qa.delivery_ready, measured: qa.measured, failed_checks: qa.checks.filter((c) => !c.ok).map((c) => c.name) }, shots: tl && tl.shots.map((s) => ({ id: s.id, start: +s.start.toFixed(2), end: +s.end.toFixed(2), component: s.component })), critics: crit, capture_provenance: has('assets/manifest.json') ? rd('assets/manifest.json').assets.map((x) => ({ id: x.id, url: x.source_url, captured_at: x.captured_at, sha256: x.sha256, kind: x.kind })) : [] };
  fs.writeFileSync(path.join(O, 'render-metadata.json'), JSON.stringify(meta, null, 1));
  console.log(`collected: ${fs.readdirSync(O).join(', ')}\nQA: ${qa ? (qa.pass ? 'pass' : 'FAIL') + (qa.preview ? ' (preview)' : '') : 'none'}; critics: ${crit.map((c) => `${c.critic}:${c.verdict}`).join(' ')}`);
}
