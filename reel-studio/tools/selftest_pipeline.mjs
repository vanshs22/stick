#!/usr/bin/env node
// End-to-end behaviour of the production pipeline on a tiny synthetic project (real ffmpeg, real files, no mocks):
// the whole approval chain, approval invalidation, per-frame decisions, final-approval fingerprints and the sealed receipt, delivery profiles (no fixed 15-60 s / 50 MB),
// audio-required failures, intentional silence, the visual-intent critic, the asset review and the readiness gate.
// Each block is a regression fixture for a bug found in this toolkit.   node tools/selftest_pipeline.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import './lib/pipeline.mjs';   // ffmpeg fallback on PATH

const T = path.dirname(fileURLToPath(import.meta.url)), tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'reel-e2e-')), P = path.join(tmp, 'proj');
const node = (script, ...args) => spawnSync('node', ['--no-warnings', path.join(T, script), ...args], { encoding: 'utf8', env: { ...process.env, REEL_TEST_MODE: '' } });
const st = (...a) => node('state.mjs', ...a), abs = (f) => path.join(P, f);
const w = (f, v) => { fs.mkdirSync(path.dirname(abs(f)), { recursive: true }); fs.writeFileSync(abs(f), typeof v === 'string' ? v : JSON.stringify(v, null, 1)); };
const ff = (...a) => { const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...a], { encoding: 'utf8' }); if (r.status) throw new Error('ffmpeg: ' + r.stderr.slice(-200)); };
const rdj = (f) => JSON.parse(fs.readFileSync(abs(f), 'utf8'));
let fails = 0, n = 0; const ok = (name, cond, detail = '') => { n++; if (!cond) { fails++; console.error(`FAIL: ${name} ${detail}`); } else console.log(`ok   ${name}`); };
const good = (name, r) => ok(name, r.status === 0, (r.stdout + r.stderr).trim().slice(-300)), refused = (name, r) => ok(name, r.status !== 0, 'was NOT refused: ' + (r.stdout + r.stderr).trim().slice(-200));
const gate = (g, quote = 'looks good, approved') => { const a = st('request', P, g); if (a.status) return a; return st('approve', P, g, '--quote', quote); };

// ---------- a synthetic project with every artifact a gate needs ----------
st('init', P);
const lines = [{ id: 'L01', beat: 'hook', text: 'Why does one script bring your whole server down?', claims: [] }, { id: 'L02', beat: 'proof', text: 'The docs say limits protect the service.', claims: ['C1'] }];
w('brief.json', { title: 'T', topic: 'rate limits', platform: 'tiktok', duration_sec: 4, language: 'en', style_pack: 'editorial-sticker' });
w('style-selection.json', { style_pack: 'editorial-sticker' }); w('topic/topic.json', { chosen: 'rate limits' }); w('research/research.json', { claims: [], sources: [] });
w('script/script.json', { lines }); w('review/critics/script.json', { verdict: 'pass', findings: [] }); w('review/critics/research.json', { verdict: 'pass', findings: [] });
w('storyboard/visual-concept.json', { status: 'ready', lines: lines.map((l) => ({ line_id: l.id, approach: 'motion-graphics', adds_information: 'a request counter that climbs past the limit, which the words only describe' })) });
const shots = [{ id: 'S01', line_ids: ['L01'], component: 'BigStat', approach: 'data-viz', why_renderer: 'A big number shows the scale of the problem faster than words do.', props: { value: '1000', label: 'requests / min' } }, { id: 'S02', line_ids: ['L02'], component: 'ProofCard', approach: 'evidence-card', why_renderer: 'The claim is about what the docs say, so show the real page.', props: { image: 'assets/x/page.png' } }];
w('storyboard/storyboard.json', { style_pack: 'editorial-sticker', shots });
fs.mkdirSync(abs('review/storyboard'), { recursive: true }); fs.mkdirSync(abs('review/storyboard-sheets'), { recursive: true });
for (const id of ['S01', 'S02']) ff('-f', 'lavfi', '-i', 'testsrc2=s=108x192:d=0.1', '-frames:v', '1', abs(`review/storyboard/${id}.png`));
ff('-f', 'lavfi', '-i', 'testsrc2=s=216x192:d=0.1', '-frames:v', '1', abs('review/storyboard-sheets/storyboard-1.jpg'));
fs.mkdirSync(abs('assets/x'), { recursive: true }); ff('-f', 'lavfi', '-i', 'testsrc2=s=200x300:d=0.1', '-frames:v', '1', abs('assets/x/page.png'));
w('assets/manifest.json', { assets: [{ id: 'SRC1-1', type: 'screenshot', kind: 'real', path: 'x/page.png', source_url: 'https://example.org/docs', captured_at: '2026-01-01T00:00:00Z', license: 'third-party page', original: false }] });
w('audio/audio-plan.json', { mode: 'narrated_music', voice: { engine: 'kokoro', voice: 'am_michael', speed: 1 }, music: { direction: 'x', bed: 'bed' }, mix: {} }); w('audio/voice-choice.json', { voice: 'am_michael' });
w('typography/typography.json', { headline: { font: 'Inter' } }); w('typography/captions.json', { preset: 'word-pop' });

// ---------- 1. the whole approval chain, in order, each with the user's words ----------
refused('a later gate cannot be requested before its files exist (visual concept missing here is fine; asset sheet is not)', st('request', P, 'assets'));
for (const g of ['intake', 'style', 'topic', 'research', 'script', 'script_critic', 'visual_concept']) good(`gate ${g}: request + approve with a quote`, gate(g, `yes ${g}`));
refused('storyboard gate refuses a request without preview stills (the user approves IMAGES)', (() => { fs.renameSync(abs('review/storyboard'), abs('review/sb.off')); const r = st('request', P, 'storyboard'); fs.renameSync(abs('review/sb.off'), abs('review/storyboard')); return r; })());
good('storyboard request with stills and contact sheet', st('request', P, 'storyboard'));
refused('a frame cannot be approved without its still', (() => { fs.renameSync(abs('review/storyboard/S01.png'), abs('review/S01.off')); const r = st('frame', P, 'S01', 'approve'); fs.renameSync(abs('review/S01.off'), abs('review/storyboard/S01.png')); return r; })());
good('frame S01 approve', st('frame', P, 'S01', 'approve')); good('frame S02 approve', st('frame', P, 'S02', 'approve'));
{ const s = rdj('storyboard/storyboard.json'); s.shots[0].props.value = '2000'; w('storyboard/storyboard.json', s); }
refused('editing a shot AFTER its frame was approved blocks the storyboard approval', st('approve', P, 'storyboard', '--quote', 'fine'));
good('request again after the edit', st('request', P, 'storyboard')); good('re-approve frame S01', st('frame', P, 'S01', 'approve')); good('re-approve frame S02', st('frame', P, 'S02', 'approve'));
good('storyboard approve once every frame is current', st('approve', P, 'storyboard', '--quote', 'these frames are right'));
w('assets/asset-selection.json', { items: [] }); w('review/assets-sheet.jpg', 'x');
refused('assets cannot be put to the user with an EMPTY selection', st('request', P, 'assets'));
{ const r = node('assets_review.mjs', P); ok('assets_review lists the real capture with provenance', r.status === 0 && /1 real-capture/.test(r.stdout), r.stdout + r.stderr); }
good('assets gate: request + approve', gate('assets', 'yes use these assets'));
good('audio gate', gate('audio', 'voice and music are fine')); good('typography gate', gate('typography')); good('captions gate', gate('captions'));
refused('production cannot be requested without a readiness report', st('request', P, 'production'));
w('review/readiness.json', { pass: false, checks: [{ name: 'x', ok: false }] }); refused('production refuses a FAILED readiness report', st('request', P, 'production'));
w('review/readiness.json', { pass: true, checks: [] }); good('production gate with a passing readiness report', gate('production', 'go, render it'));
good('build is open after every gate', st('check', P, 'build'));
w('script/script.json', { lines: [...lines, { id: 'L03', beat: 'cta', text: 'Save this.' }] }); refused('editing the approved script blocks the build (approval invalidated)', st('check', P, 'build'));
w('script/script.json', { lines });   // restore the exact bytes the user approved
{ const r = st('check', P, 'build'); ok('restoring the approved content reopens the gate', r.status === 0, r.stderr); }

// ---------- 2. delivery profile: no hard-coded 15-60 s or 50 MB; audio presence is judged by the declared mode ----------
const clip = (id, c) => { fs.mkdirSync(abs('renders/segments'), { recursive: true }); ff('-f', 'lavfi', '-i', `testsrc2=s=1080x1920:r=30:d=2,format=yuv420p`, '-c:v', 'libx264', '-preset', 'ultrafast', '-g', '15', abs(`renders/segments/${id}.mp4`)); };
clip('S01'); clip('S02'); w('renders/segments/index.json', { scale: 1, fps: 30, shots: [{ id: 'S01', from: 0, to: 59, file: 'S01.mp4', ready: true }, { id: 'S02', from: 60, to: 119, file: 'S02.mp4', ready: true }] });
w('data/timeline.json', { fps: 30, width: 1080, height: 1920, duration: 4, shots: [{ id: 'S01', start: 0, end: 2 }, { id: 'S02', start: 2, end: 4 }], captions: { preset: 'word-pop', chunks: [{ t0: 0.2, t1: 1.8, words: [] }, { t0: 2.2, t1: 3.8, words: [] }] } });
ff('-f', 'lavfi', '-i', 'sine=f=220:d=4', '-af', 'volume=0.2', abs('data/mix.wav')); fs.copyFileSync(abs('data/mix.wav'), abs('data/narration.wav'));
const asm = (name) => node('assemble.mjs', P, name), qa = (name) => rdj(`renders/${name}.qa.json`);
{ const r = asm('a'); ok('a 4 s film is NOT rejected by a fixed 15-60 s rule (tiktok preset: 3 s minimum)', r.status === 0 && qa('a').pass, r.stdout + r.stderr); ok('QA reports measured values and the profile it used', qa('a').measured.duration > 3.9 && /tiktok|preset/.test(qa('a').profile.source), JSON.stringify(qa('a').profile)); ok('no max_mb in the preset means no size check', !qa('a').checks.some((c) => /file size/.test(c.name))); ok('a delivery render (scale 1) is delivery_ready', qa('a').delivery_ready === true); }
{ const b = rdj('brief.json'); b.delivery = { max_sec: 3, max_mb: 0.001 }; w('brief.json', b); const r = asm('b'); ok('brief.delivery limits are enforced: too long AND too big fail the build', r.status !== 0 && qa('b').checks.filter((c) => !c.ok && /duration|size/.test(c.name)).length >= 2, r.stdout); delete b.delivery; w('brief.json', b); }
{ fs.renameSync(abs('data/mix.wav'), abs('data/mix.off')); const r = asm('c'); ok('a MISSING MIX fails the build (no silent export)', r.status !== 0 && /mix\.wav does not exist/.test(r.stderr) && !fs.existsSync(abs('renders/c.mp4')), r.stderr); fs.renameSync(abs('data/mix.off'), abs('data/mix.wav')); }
{ fs.renameSync(abs('data/narration.wav'), abs('data/narr.off')); const r = asm('d'); ok('a MISSING NARRATION fails the build when the mode needs it', r.status !== 0 && /narration\.wav/.test(r.stderr), r.stderr); w('data/.estimate', 'x'); const e = asm('e'); ok('--estimate (no narration) is allowed but is marked a PREVIEW, never delivery_ready', e.status === 0 && qa('e').preview && !qa('e').delivery_ready, e.stderr); fs.rmSync(abs('data/.estimate')); fs.renameSync(abs('data/narr.off'), abs('data/narration.wav')); }
{ const ap = rdj('audio/audio-plan.json'); ap.mode = 'silent'; w('audio/audio-plan.json', ap); fs.renameSync(abs('data/mix.wav'), abs('data/mix.off')); const r = asm('s'); ok('an INTENTIONALLY SILENT project builds without a mix and passes QA', r.status === 0 && qa('s').pass && qa('s').measured.has_audio === false, r.stdout + r.stderr); fs.renameSync(abs('data/mix.off'), abs('data/mix.wav')); ap.mode = 'narrated_music'; w('audio/audio-plan.json', ap); }

// ---------- 3. final approval fingerprints the real MP4 and the receipt is bound to it ----------
w('review/final.jpg', 'sheet'); w('renders/report.md', '# report'); for (const k of ['video', 'voice', 'final']) w(`review/critics/${k}.json`, { verdict: 'pass', findings: [] });
fs.copyFileSync(abs('renders/a.mp4'), abs('renders/film.mp4')); fs.copyFileSync(abs('renders/a.qa.json'), abs('renders/film.qa.json'));
for (const k of ['visual_critic', 'audio_critic', 'editorial_critic']) st('done', P, k); st('done', P, 'build');
good('final request lists the MP4, QA report, contact sheet, captions and report', st('request', P, 'final', '--video', 'renders/film.mp4'));
{ const f = rdj('state.json').stages.final.fingerprints, keys = Object.keys(f); ok('final fingerprints include the MP4, its QA report, the contact sheet, captions and the production report', ['renders/film.mp4', 'renders/film.qa.json', 'review/final.jpg', 'typography/captions.json', 'renders/report.md'].every((k) => keys.includes(k)), keys.join(',')); }
refused('seal before final approval is refused', st('seal', P, abs('renders/film.mp4')));
good('final approve', st('approve', P, 'final', '--quote', 'this is the video, ship it'));
good('seal after approval', st('seal', P, abs('renders/film.mp4')));
{ const rc = rdj('renders/film.approval.json'), sha = crypto.createHash('sha256').update(fs.readFileSync(abs('renders/film.mp4'))).digest('hex'); ok('the receipt carries the video sha256, the QA result and the approved files', rc.video_sha256 === sha && rc.qa?.pass === true && Object.keys(rc.approved_artifacts).includes('renders/film.mp4') && rc.approvals.final.quote.includes('ship it'), JSON.stringify(rc).slice(0, 200)); }
fs.appendFileSync(abs('renders/film.mp4'), Buffer.from([0]));
refused('changing the MP4 after final approval invalidates the seal', st('seal', P, abs('renders/film.mp4')));
refused('and blocks delivery', st('check', P, 'deliver'));

// ---------- 4. visual-intent critic (semantic director) ----------
const critic = async (sb, vc) => { const D = path.join(tmp, 'v' + Math.random().toString(36).slice(2, 6)); fs.mkdirSync(path.join(D, 'storyboard'), { recursive: true }); fs.mkdirSync(path.join(D, 'script'), { recursive: true }); fs.writeFileSync(path.join(D, 'script/script.json'), JSON.stringify({ lines })); fs.writeFileSync(path.join(D, 'storyboard/storyboard.json'), JSON.stringify(sb)); if (vc) fs.writeFileSync(path.join(D, 'storyboard/visual-concept.json'), JSON.stringify(vc)); const { run } = await import(path.join(T, 'critics/visual.mjs')), log = console.log; console.log = () => {}; try { return await run(D); } finally { console.log = log; } };
{ const r = await critic({ shots: [{ id: 'S01', line_ids: ['L01'], component: 'TitleCard', props: { text: 'Why does one script bring your whole server down?' } }, { id: 'S02', line_ids: ['L02'], component: 'Highlight', approach: 'motion-graphics', why_renderer: 'DRAFT: whatever', props: { text: 'The docs say limits protect the service.' } }] }, null);
  const t = r.findings.map((f) => f.problem).join(' | '); ok('critic: no approach, DRAFT reason, text repeating the narration and a missing concept are all found', r.verdict !== 'pass' && /no "approach"/.test(t) && /no real reason/.test(t) && /only repeats the narration/.test(t) && /no storyboard\/visual-concept/.test(t), t); }
{ const r = await critic({ shots }, rdj('storyboard/visual-concept.json')); ok('critic: a storyboard with approach, reason and information passes', r.verdict !== 'fail' && !r.findings.some((f) => f.severity === 'major'), r.findings.map((f) => f.problem).join(' | ')); }

// ---------- 5. asset review: unlabelled recreations and capture without provenance ----------
{ const D = path.join(tmp, 'ast'); fs.cpSync(P, D, { recursive: true });
  const m = JSON.parse(fs.readFileSync(path.join(D, 'assets/manifest.json'))); m.assets[0].kind = 'recreation'; fs.writeFileSync(path.join(D, 'assets/manifest.json'), JSON.stringify(m));
  let r = node('assets_review.mjs', D); ok('an UNLABELLED recreation is flagged (never passed off as a real screenshot)', r.status !== 0 && /RECREATION/.test(r.stdout), r.stdout);
  m.assets[0].kind = 'real'; delete m.assets[0].source_url; fs.writeFileSync(path.join(D, 'assets/manifest.json'), JSON.stringify(m)); r = node('assets_review.mjs', D); ok('a real capture without a source URL is flagged', r.status !== 0 && /provenance/.test(r.stdout), r.stdout); }

// ---------- 6. readiness gate measures instead of assuming ----------
{ const D = path.join(tmp, 'rdy'); fs.cpSync(P, D, { recursive: true }); const ap = JSON.parse(fs.readFileSync(path.join(D, 'audio/audio-plan.json'))); delete ap.mode; ap.status = 'DRAFT'; fs.writeFileSync(path.join(D, 'audio/audio-plan.json'), JSON.stringify(ap));
  const r = node('readiness.mjs', D); const j = JSON.parse(fs.readFileSync(path.join(D, 'review/readiness.json'))); ok('readiness fails on a DRAFT audio plan with no declared mode', r.status !== 0 && j.checks.some((c) => !c.ok && /audio mode/.test(c.name)) && j.checks.some((c) => !c.ok && /DRAFT/.test(c.name)), r.stdout); }

// ---------- 7. research without Agent-Reach, and analytics that never invent data ----------
{ const D = path.join(tmp, 'res'); fs.mkdirSync(D, { recursive: true }); fs.writeFileSync(path.join(D, 'brief.json'), '{}');
  let r = node('research/import_sources.mjs', D, '--text', 'Retry-After tells clients how long to wait.', '--title', 'User notes'); const src = JSON.parse(fs.readFileSync(path.join(D, 'research/sources.json'))).sources;
  ok('manual import records a user-supplied source with provenance (no Agent-Reach needed)', r.status === 0 && src[0].via === 'user-supplied' && src[0].channel === 'manual' && !!src[0].retrieved_at && fs.existsSync(path.join(D, src[0].page)), r.stdout + r.stderr);
  r = node('research/import_sources.mjs', D, '--url', 'http://127.0.0.1:1/x', '--fetch', '--title', 'Down'); const s2 = JSON.parse(fs.readFileSync(path.join(D, 'research/sources.json'))).sources;
  ok('a page that cannot be fetched is recorded as user-listed, never as fetched', s2.at(-1).via === 'user-listed', JSON.stringify(s2.at(-1)));
  r = node('research/search.mjs', D, 'rate limits', '--user-said', 'yes'); ok('search without Agent-Reach says what to do instead (install flag or manual import)', /import_sources|--with-agent-reach/.test(r.stdout + r.stderr), r.stdout + r.stderr);
  fs.writeFileSync(path.join(D, 'a.csv'), 'title,views,likes\nA,100,5\nB,200,9\nC,150,7\n'); r = node('analytics/analyze.mjs', '--csv', path.join(D, 'a.csv'), '--out', D);
  ok('analytics with fewer than 5 videos says the sample is too small instead of inventing a pattern', /too few to compare|too small/i.test(r.stdout + r.stderr), r.stdout + r.stderr); }

fs.rmSync(tmp, { recursive: true, force: true });
if (fails) { console.error(`\n${fails} of ${n} pipeline checks FAILED`); process.exit(1); } console.log(`\nPIPELINE SELFTEST PASSED: ${n} checks (approval chain, invalidation, final fingerprints, delivery profile, audio gates, visual critic, assets, readiness)`);
