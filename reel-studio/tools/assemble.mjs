#!/usr/bin/env node
// Join the cached shot clips, lay the mix under them, normalise loudness.  node tools/assemble.mjs <project> [name]
// Needs renders/segments/index.json with every clip ready (tools/render_segments.mjs) and data/mix.wav.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import './lib/pipeline.mjs';
import { deliveryProfile } from './lib/delivery.mjs';   // puts the installer's ffmpeg fallback on PATH
const P = path.resolve(process.argv[2] || '.'), name = process.argv[3] || path.basename(P), seg = path.join(P, 'renders/segments');
const idx = JSON.parse(fs.readFileSync(path.join(seg, 'index.json'), 'utf8')), miss = idx.shots.filter((s) => !s.ready);
if (miss.length) { console.error(`clips missing for ${miss.map((s) => s.id).join(', ')}: run tools/render_segments.mjs first`); process.exit(1); }
const mix = path.join(P, 'data/mix.wav'), hasMix = fs.existsSync(mix), frames = idx.shots.at(-1).to + 1, prof = deliveryProfile(P), estimate = fs.existsSync(path.join(P, 'data/.estimate'));
// audio is part of the deliverable: a missing mix or narration must fail the build, never become a silent export. Only a project that DECLARES audio mode "silent" may have none.
if (prof.audio_required && !hasMix) { console.error(`FAILED: audio mode is "${prof.audio_mode}" but data/mix.wav does not exist. Run the build (voice, cues, mix) or declare an intentionally silent project: audio-plan.json "mode": "silent".`); process.exit(1); }
if (prof.narration_required && !estimate && !fs.existsSync(path.join(P, 'data/narration.wav'))) { console.error(`FAILED: audio mode is "${prof.audio_mode}" but data/narration.wav does not exist (the voice step did not run or failed). An --estimate build is the only narration-less preview.`); process.exit(1); }
if (!prof.audio_required && hasMix) console.log('note: audio mode is silent, so data/mix.wav is ignored');
fs.writeFileSync(path.join(seg, 'list.txt'), idx.shots.map((s) => `file '${path.join(seg, s.file).replace(/'/g, "'\\''")}'`).join('\n'));
const raw = path.join(P, `renders/${name}.raw.mp4`), out = path.join(P, `renders/${name}.mp4`);
const ff = (args) => { const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { encoding: 'utf8' }); if (r.status) { console.error(r.stderr); process.exit(1); } };
ff(['-f', 'concat', '-safe', '0', '-i', path.join(seg, 'list.txt'), ...(hasMix && prof.audio_required ? ['-i', mix] : []), '-map', '0:v', ...(hasMix && prof.audio_required ? ['-map', '1:a', '-c:a', 'aac', '-b:a', '192k'] : []), '-c:v', 'copy', '-t', String(frames / idx.fps), raw]);
const qa = spawnSync('node', [path.join(path.dirname(fileURLToPath(import.meta.url)), 'qa/final_qa.mjs'), raw, out, '--project', P], { stdio: 'inherit' });
let qj = null; try { qj = JSON.parse(fs.readFileSync(out.replace(/\.mp4$/, '.qa.json'), 'utf8')); } catch { /* QA could not run */ }
console.log(`assembled ${idx.shots.length} clips (${frames} frames) -> ${path.relative(P, out)}`); process.exit(qa.status || (qj && !qj.pass && !qj.preview ? 1 : 0));   // a delivery render that fails QA fails the build; a preview only reports
