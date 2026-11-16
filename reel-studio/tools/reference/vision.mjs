#!/usr/bin/env node
// The creative half of a reference analysis needs EYES. This tool never pretends: the agent either fills the block after LOOKING at the
// listed images (and lists which ones it opened), or marks the analysis "unavailable" and says which questions went unanswered.
//   node tools/reference/vision.mjs <P> <name> --template                 writes references/<name>/vision.json to fill in
//   node tools/reference/vision.mjs <P> <name> --validate                 checks it is complete and merges it into analysis.json (status done)
//   node tools/reference/vision.mjs <P> <name> --unavailable "this model cannot read images"   status unavailable (the report lists what is missing)
import fs from 'node:fs';
import path from 'node:path';
import { rd } from '../lib/pipeline.mjs';
const a = process.argv.slice(2), P = path.resolve(a[0] || ''), name = a[1], dir = path.join(P, 'references', name || ''), A = path.join(dir, 'analysis.json');
if (!name || !fs.existsSync(A)) { console.error('usage: vision.mjs <P> <refName> --template|--validate|--unavailable "why"'); process.exit(2); }
const an = rd(A), SIZES = ['extreme-wide', 'wide', 'medium-wide', 'medium', 'medium-close-up', 'close-up', 'extreme-close-up', 'insert', 'over-the-shoulder', 'pov', 'top-down'], ANG = ['eye-level', 'low-angle', 'high-angle', 'dutch', 'three-quarter', 'profile', 'front-facing', 'overhead'];
const need = ['character_design', 'environment', 'lighting', 'composition', 'typography', 'ui_overlays', 'transitions', 'animation', 'music_and_sfx', 'storytelling'];
if (a.includes('--template')) {
  const t = { inspected: [], model_can_see_images: true, shots: (an.shots || [{ n: 1 }]).slice(0, 40).map((s) => ({ n: s.n, size: '', angle: '', camera_movement_confirmed: s.camera_motion || '', notes: '' })), character_design: '', environment: '', lighting: '', composition: '', typography: { typeface_guess: '', weight: '', case: '', position: '', size_vs_frame: '', animation: '' }, ui_overlays: '', transitions: '', animation: '', music_and_sfx: { note: 'From the measurements in analysis.json (tempo, onsets, loudness). Say "not heard" if you did not listen.', style: '' }, storytelling: { hook: '', structure: '', payoff: '', cta: '' }, allowed_sizes: SIZES, allowed_angles: ANG };
  fs.writeFileSync(path.join(dir, 'vision.json'), JSON.stringify(t, null, 1)); console.log(`wrote ${path.relative(P, dir)}/vision.json. LOOK at: ${(an.vision?.look_at || []).slice(0, 6).join(', ')} ... then fill it and list every file you opened in "inspected".`); process.exit(0);
}
if (a.includes('--unavailable')) { an.vision = { ...an.vision, status: 'unavailable', reason: a[a.indexOf('--unavailable') + 1] || 'no image input', unanswered: an.vision?.to_fill || need, at: new Date().toISOString() }; fs.writeFileSync(A, JSON.stringify(an, null, 1)); console.log('marked unavailable: the report will list the unanswered questions. Ask the user to describe the look, or use a model with image input.'); process.exit(0); }
if (a.includes('--validate')) {
  const v = rd(path.join(dir, 'vision.json')), errs = [];
  if (!v.inspected?.length) errs.push('inspected[] is empty: list the image files you actually opened');
  for (const f of v.inspected || []) if (!fs.existsSync(path.join(dir, f))) errs.push(`inspected file does not exist: ${f}`);
  if (!(v.inspected || []).some((f) => /contact_sheet|image\.jpg/.test(f))) errs.push('open contact_sheet.jpg (or the image) first');
  for (const k of need) { const x = v[k]; if (x == null || x === '' || (typeof x === 'object' && !Object.values(x).filter((y) => typeof y === 'string' && y.trim()).length)) errs.push(`"${k}" is empty`); }
  for (const s of v.shots || []) { if (!SIZES.includes(s.size)) errs.push(`shot ${s.n}: size "${s.size}" is not one of ${SIZES.join(', ')}`); if (!ANG.includes(s.angle)) errs.push(`shot ${s.n}: angle "${s.angle}" is not one of ${ANG.join(', ')}`); }
  if (errs.length) { console.error('vision block incomplete:\n- ' + errs.slice(0, 25).join('\n- ')); process.exit(1); }
  an.vision = { status: 'done', at: new Date().toISOString(), inspected: v.inspected, ...Object.fromEntries(['shots', ...need].map((k) => [k, v[k]])) }; fs.writeFileSync(A, JSON.stringify(an, null, 1)); console.log('vision block merged: status done'); process.exit(0);
}
console.error('choose --template, --validate or --unavailable'); process.exit(2);
