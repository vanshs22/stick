#!/usr/bin/env node
// Production readiness: the evidence behind the "production" approval gate. Nothing is assumed; each line is measured from the project.
//   node tools/readiness.mjs <project>      -> review/readiness.json + a printed table. Exit 1 if anything required fails.
// Checks: earlier gates valid, storyboard passes its checker, critics have no open blocker/major, asset selection is clean and newer than the storyboard,
// audio plan chosen (not DRAFT) with a declared mode, narration engine available when narration is required, delivery profile resolved,
// expected length fits the profile, render runtime present.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { TK, PY, run } from './lib/pipeline.mjs';
import { deliveryProfile, AUDIO_MODES } from './lib/delivery.mjs';

const P = path.resolve(process.argv[2] || '.'), rd = (f) => { try { return JSON.parse(fs.readFileSync(path.join(P, f), 'utf8')); } catch { return null; } }, has = (f) => fs.existsSync(path.join(P, f)), mt = (f) => (has(f) ? fs.statSync(path.join(P, f)).mtimeMs : 0);
const checks = [], add = (name, ok, note, level = 'fail') => checks.push({ name, ok: !!ok, note, level: ok ? 'ok' : level });
const prof = deliveryProfile(P), sb = rd('storyboard/storyboard.json'), plan = rd('audio/audio-plan.json'), script = rd('script/script.json');

const g = run('node', [path.join(TK, 'tools/state.mjs'), 'check', P, 'production']); add('every earlier approval is valid and current', g.status === 0, g.status ? (g.stderr || g.stdout).trim().slice(0, 200) : (g.stdout || '').trim());
if (sb) { const c = run('node', [path.join(TK, 'tools/check_storyboard.mjs'), P]); add('storyboard checker passes', c.status === 0, (c.stdout + c.stderr).trim().split('\n').slice(-2).join(' | ').slice(0, 220)); } else add('storyboard exists', false, 'storyboard/storyboard.json is missing');
for (const k of ['script', 'research', 'storyboard']) { const r = rd(`review/critics/${k}.json`); if (!r) { add(`${k} critic was run`, false, `review/critics/${k}.json missing: node tools/critique.mjs ${P} ${k === 'research' ? 'script' : k}`); continue; } const open = (r.findings || []).filter((f) => ['blocker', 'major'].includes(f.severity) && f.status !== 'fixed'); add(`${k} critic: no open blocker/major`, !open.length, open.length ? open.slice(0, 2).map((f) => f.problem).join(' | ').slice(0, 200) : `verdict ${r.verdict}`); }
const sel = rd('assets/asset-selection.json'); add('asset selection exists and is clean', !!sel && !(sel.problems || []).length, sel ? `${sel.items.length} assets, ${(sel.problems || []).length} problems` : 'run tools/assets_review.mjs');
add('asset selection is newer than the storyboard', !sel || mt('assets/asset-selection.json') >= mt('storyboard/storyboard.json'), 'storyboard changed after the assets were reviewed: rerun tools/assets_review.mjs');
add('audio plan exists and is chosen (not a DRAFT)', !!plan && !/DRAFT/.test(plan.status || '') && has('audio/voice-choice.json'), plan ? (plan.status || 'chosen') : 'missing: tools/choose.mjs <P> voice ...');
add('audio mode declared', AUDIO_MODES.includes(plan?.mode), plan?.mode ? `mode: ${plan.mode}` : 'audio-plan.json needs "mode" (narrated, narrated_music, music_only, silent or custom). choose.mjs voice sets it.');
if (prof.narration_required) {
  const engine = plan?.voice?.engine || 'kokoro', HOME = process.env.REEL_HOME || process.env.REEL_STUDIO_HOME || path.join(os.homedir(), '.reel-studio');
  if (engine === 'kokoro') { add('Kokoro voice engine available', run(PY, ['-c', 'import kokoro_onnx']).status === 0 && fs.existsSync(path.join(HOME, 'kokoro/kokoro-v1.0.onnx')), 'bash install.sh (installs kokoro-onnx and the model)'); }
  else if (engine === 'own-recording') add('own recording file exists', !!plan?.voice?.own_recording && fs.existsSync(path.resolve(P, plan.voice.own_recording)), plan?.voice?.own_recording || 'voice.own_recording is not set');
  add('word timing available (faster-whisper)', run(PY, ['-c', 'import faster_whisper']).status === 0, 'without it caption/anchor times are spread inside each line (0.1-0.2 s off): bash install.sh', 'warn');
}
const words = (script?.lines || []).reduce((n, l) => n + (l.text || '').trim().split(/\s+/).filter(Boolean).length, 0), est = words / 2.5 + (script?.lines || []).reduce((n, l) => n + (l.pause_after || 0), 0);
if (script && prof.max_sec != null) add(`expected length ${est.toFixed(0)} s fits the limit (${prof.max_sec} s)`, est <= prof.max_sec, `${words} words`);
if (script && prof.target_sec) add(`expected length is near the brief's ${prof.target_sec} s`, Math.abs(est - prof.target_sec) <= prof.target_sec * 0.35, `${est.toFixed(0)} s from ${words} words`, 'warn');
add('delivery profile resolved', !!prof.width, `${prof.width}x${prof.height} @ ${prof.fps} fps, ${prof.min_sec ?? '-'}..${prof.max_sec ?? 'no max'} s, max_mb ${prof.max_mb ?? 'none'} (${prof.source})`);
add('Remotion runtime installed', fs.existsSync(path.join(TK, 'remotion-template/node_modules/remotion')) || !!process.env.REEL_NODE_MODULES, 'bash install.sh');
const shots = sb?.shots?.length || 0, three = (sb?.shots || []).filter((s) => s.component === 'Stage3D').length;
const out = { generated_at: new Date().toISOString(), pass: checks.every((c) => c.ok || c.level === 'warn'), checks, profile: prof, shots, shots_3d: three, estimate: { words, seconds: +est.toFixed(1), full_render_minutes_software_gl: +(shots * (three ? 1.2 : 0.4) * (est / Math.max(1, shots) / 3)).toFixed(0) } };
fs.mkdirSync(path.join(P, 'review'), { recursive: true }); fs.writeFileSync(path.join(P, 'review/readiness.json'), JSON.stringify(out, null, 1));
console.log(`${out.pass ? 'READY' : 'NOT READY'}  ${shots} shots (${three} 3D), about ${out.estimate.seconds} s, audio ${prof.audio_mode}`);
checks.forEach((c) => console.log(`  ${c.ok ? 'ok  ' : c.level === 'warn' ? 'warn' : 'FAIL'} ${c.name}${c.ok ? '' : ': ' + c.note}`)); process.exit(out.pass ? 0 : 1);
