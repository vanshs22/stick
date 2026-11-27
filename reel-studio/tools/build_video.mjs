#!/usr/bin/env node
// One command from an approved storyboard + audio plan to a finished MP4: voice, word timing, timeline, sound cues, mix, per-shot render (cached), assemble, loudness QA.
//   node tools/build_video.mjs <project> [--scale 0.5] [--estimate] [--shots S02,S05] [--name <file>]
//   --scale 0.5   half-size preview (4x faster). Default 1 (1080x1920).
//   --estimate    no voice: estimated timing and no narration (fast test of the picture)
//   --upscale     also write <name>.4k.mp4: Lanczos upscale to 2160x3840 (instant, no AI; the 1080x1920 master is still the one QA checks)
//   --quality fast|draft   inkbeat only: cheaper passes (fast about 2x, draft more); master is the default
//   --fps-div 2   inkbeat only: render every 2nd frame and repeat it (2x faster)
//   --tier preview|proof|final   one flag for size, frame rate and quality: preview 0.25 / half rate / draft, proof 0.5 / half rate / fast, final 1 / full / master (explicit flags still win)
//   --no-assemble stop after rendering the shots (used with --shard)
//   --shard 1/2   render only this balanced share of the missing shots (split across GPUs or machines, then assemble)
//   --shots       re-render only these shots (everything else comes from the cache), then assemble
// Safe to re-run: the voice is only regenerated when the script or the voice choice changed (delete data/narration.wav to force).
import fs from 'node:fs';
import { TIERS } from './lib/shard.mjs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { TK, PY, run, rd, defaultGL } from './lib/pipeline.mjs';

const a = process.argv.slice(2), P = path.resolve(a[0] || ''), opt = (k, d) => (a.includes('--' + k) ? a[a.indexOf('--' + k) + 1] : d);
if (!a[0] || !fs.existsSync(path.join(P, 'storyboard/storyboard.json'))) { console.error('usage: build_video.mjs <project> [--scale 0.5] [--estimate] [--shots S02,S05] [--name file]'); process.exit(2); }
const name = opt('name', path.basename(P)), env = { ...process.env, TTS_SCRIPT: 'data/tts.json', REMOTION_GL: defaultGL() };
const step = (label, cmd, args, o = {}) => { process.stdout.write(`== ${label}\n`); const r = run(cmd, args, { cwd: P, env, ...o }); const out = ((r.stdout || '') + (r.stderr || '')).trim().split('\n').filter((x) => !/requires glibc/.test(x)).slice(-3).join('\n'); /* Remotion's glibc notice is harmless (it still renders) */ if (out) console.log(out); if (r.status) { console.error(`FAILED: ${label}`); process.exit(1); } return r; };
const gates = run('node', [path.join(TK, 'tools/state.mjs'), 'check', P, 'build']);
if (gates.status) { console.error((gates.stderr || gates.stdout).trim()); process.exit(1); }   // earlier gates must be validly approved (test projects pass)
// production readiness is AUTOMATIC (it used to be a question for the user): every earlier gate valid, critics clean, assets reviewed, audio chosen, runtimes present
{ const rr = run('node', [path.join(TK, 'tools/readiness.mjs'), P]); if (rr.status && !a.includes('--skip-readiness')) { console.error('READINESS FAILED: the toolkit refuses to render until this is fixed (no question for the user: these are facts):\n' + ((rr.stdout || '') + (rr.stderr || '')).split('\n').filter((l) => /FAIL|NOT READY/.test(l)).slice(0, 8).join('\n')); process.exit(1); } }
const s0 = rd(path.join(P, 'storyboard/storyboard.json')); if (!fs.existsSync(path.join(P, 'audio/audio-plan.json'))) { console.error('no audio/audio-plan.json: choose voice and music first (tools/choose.mjs <P> voice ...)'); process.exit(1); }
step('sync project (template, assets, style)', 'node', ['-e', `import('${pathToFileURL(path.join(TK, 'tools/lib/pipeline.mjs')).href}').then(m=>m.syncProject(${JSON.stringify(P)}))`]);
step('check storyboard', 'node', [path.join(TK, 'tools/check_storyboard.mjs'), P]);
step('narration input', 'node', [path.join(TK, 'tools/audio/build_tts_input.mjs'), P]);
step('footage frames', 'node', [path.join(TK, 'tools/footage_frames.mjs'), 'ensure', P]);
step('emoji pictures', 'node', [path.join(TK, 'tools/emoji.mjs'), 'ensure', P]);
const ttsHash = crypto.createHash('sha1').update(fs.readFileSync(path.join(P, 'data/tts.json'))).digest('hex'), hf = path.join(P, 'data/.voice.hash');
const needVoice = !a.includes('--estimate') && (!fs.existsSync(path.join(P, 'data/narration.wav')) || !fs.existsSync(hf) || fs.readFileSync(hf, 'utf8') !== ttsHash);   // same text + voice + pronunciations = same narration
if (a.includes('--estimate')) fs.writeFileSync(path.join(P, 'data/.estimate'), 'estimate build: no narration, NOT a delivery render\n'); else fs.rmSync(path.join(P, 'data/.estimate'), { force: true });
if (a.includes('--estimate')) step('estimated timing (no voice)', PY, [path.join(TK, 'tools/audio/estimate.py'), '.']);
else if (needVoice) { step('voice (Kokoro, local)', PY, [path.join(TK, 'tools/audio/voice.py'), '.']); const wr = step('word timing (Whisper, local)', PY, [path.join(TK, 'tools/audio/words.py'), '.']); if (/spreading words|spread inside/.test((wr.stdout || '') + (wr.stderr || ''))) console.error('\nWARNING: Whisper was not available, so caption and anchor times are SPREAD inside each line (about 0.1-0.2 s off). Fix: install it (bash install.sh) and delete data/narration.wav, then rebuild.\n'); fs.rmSync(path.join(P, 'data/narration.raw.wav'), { force: true }); step('voice polish (voice chain + emphasis; never changes timing)', PY, [path.join(TK, 'tools/audio/voice_polish.py'), P]); fs.writeFileSync(hf, ttsHash); }
else console.log('== voice: unchanged, reusing data/narration.wav');
step('timeline', 'node', [path.join(TK, 'tools/timing/build_timeline.mjs'), P]);
step('sound cues (each tied to an event)', 'node', [path.join(TK, 'tools/audio/build_cues.mjs'), P]);
step('mix (voice + music + sound)', PY, [path.join(TK, 'tools/audio/mix.py'), '.']);
step('timeline (final)', 'node', [path.join(TK, 'tools/timing/build_timeline.mjs'), P]);
const tier = TIERS[opt('tier', 'final')]; if (!tier) { console.error('--tier must be preview, proof or final'); process.exit(2); }
const pick = (k) => opt(k, tier[k]), scale = pick('scale') || '1', seg = ['--scale', scale, ...(opt('shots') ? ['--shots', opt('shots')] : []), ...(pick('fps-div') ? ['--fps-div', pick('fps-div')] : []), ...(pick('quality') ? ['--quality', pick('quality')] : []), ...(opt('shard') ? ['--shard', opt('shard')] : [])];
const engine = (() => { try { return rd(path.join(TK, 'style-packs', rd(path.join(P, 'brief.json')).style_pack, 'style.json')).engine || 'remotion'; } catch { return 'remotion'; } })();
if (engine === 'inkbeat' && !fs.existsSync(path.join(P, 'ink-plan.json'))) step('ink plan (scaffolded from the storyboard: improve it before the master render)', 'node', [path.join(TK, 'tools/ink/scaffold_plan.mjs'), P]);
if (engine === 'inkbeat') step('render shots (inkbeat 3D engine, cached per shot)', 'node', [path.join(TK, 'tools/ink/render_segments_ink.mjs'), P, ...seg], { timeout: 14400000 });   // same cache, same index.json: assemble, mix and QA below are unchanged
else step('render shots (cached per shot)', 'node', [path.join(TK, 'tools/render_segments.mjs'), P, ...seg], { timeout: 7200000 });
if (a.includes('--no-assemble')) { console.log('shards rendered; run tools/assemble.mjs once all shard segment folders are merged'); process.exit(0); }   // sharded runs on several GPUs or machines assemble once, at the end
step('assemble + loudness' + (a.includes('--upscale') ? ' + 4K (Lanczos)' : ''), 'node', [path.join(TK, 'tools/assemble.mjs'), P, name, ...(a.includes('--upscale') ? ['--upscale'] : [])]);
const out = path.join(P, `renders/${name}.mp4`); const qa = (() => { try { return rd(path.join(P, `renders/${name}.qa.json`)); } catch { return null; } })();
if (!a.includes('--estimate') && fs.existsSync(path.join(P, 'renders'))) for (const f of fs.readdirSync(path.join(P, 'renders'))) { const m = f.match(/^(.*)\.qa\.json$/); if (m && m[1] !== name) { try { if (JSON.parse(fs.readFileSync(path.join(P, 'renders', f), 'utf8')).preview) for (const x of fs.readdirSync(path.join(P, 'renders'))) if (x.startsWith(m[1] + '.')) fs.rmSync(path.join(P, 'renders', x), { force: true }); } catch { /* keep */ } } }   // an old --estimate preview must not be mistaken for the film
console.log(`\nDONE ${path.relative(process.cwd(), out)}${qa ? '  QA: ' + ((qa.checks || []).filter((c) => !c.ok).map((c) => `${c.level === 'warn' ? 'warn' : 'FAIL'} ${c.name}`).join(', ') || 'all checks ok') + (qa.preview ? '  (PREVIEW: not a delivery render)' : '') : ''}\nnext: node ${path.join(TK, 'tools/critique.mjs')} ${P} all   then   node ${path.join(TK, 'tools/qa/contact_sheet.mjs')} ${out} ${P}/review/final.jpg --every 1   and LOOK at it`);
