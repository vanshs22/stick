#!/usr/bin/env node
// Checks a storyboard against the component manifest BEFORE building: unknown components, missing required props, unknown transitions and
// sounds, missing evidence assets. Prints every problem with the shot id. Exit 1 on any error.
//   node tools/check_storyboard.mjs <projectDir>
import fs from 'node:fs';
import path from 'node:path';

const P = process.argv[2]; if (!P) { console.error('usage: check_storyboard.mjs <projectDir>'); process.exit(2); }
const man = JSON.parse(fs.readFileSync(path.join(P, 'remotion/src/components/manifest.json'), 'utf8')), sb = JSON.parse(fs.readFileSync(path.join(P, 'storyboard/storyboard.json'), 'utf8'));
const reg = fs.readFileSync(path.join(P, 'remotion/src/components/registry.ts'), 'utf8'), errs = [], warns = [];
let prev = '', run = 0;
for (const s of sb.shots) {
  const m = man.components[s.component]; if (!m) { errs.push(`${s.id}: component "${s.component}" is not in manifest.json. Known: ${Object.keys(man.components).join(', ')}`); continue; }
  if (!new RegExp(`\\b${s.component}\\b`).test(reg)) errs.push(`${s.id}: "${s.component}" is in the manifest but not registered in registry.ts`);
  for (const r of m.required || []) if (s.props?.[r] == null) errs.push(`${s.id}: ${s.component} needs prop "${r}"`);
  for (const k of Object.keys(s.props || {})) if (!(k in m.props)) warns.push(`${s.id}: ${s.component} has no prop "${k}" (known: ${Object.keys(m.props).join(', ')})`);
  if (s.transition_out?.type && !man.transitions.includes(s.transition_out.type)) errs.push(`${s.id}: unknown transition "${s.transition_out.type}" (${man.transitions.join(', ')})`);
  for (const f of s.sfx || []) if (!man.sfx.includes(f.type)) errs.push(`${s.id}: unknown sound "${f.type}"`);
  if (s.transition_out?.sound && s.transition_out.sound !== 'none' && !man.sfx.includes(s.transition_out.sound)) errs.push(`${s.id}: unknown transition sound "${s.transition_out.sound}"`);
  for (const k of ['image']) { const f = s.props?.[k]; if (f && !fs.existsSync(path.join(P, 'remotion/public', f))) errs.push(`${s.id}: ${k} "${f}" not found in remotion/public (copy the capture there)`); }
  if (m.evidence && m.required?.includes('image') && !s.evidence?.required) warns.push(`${s.id}: ${s.component} shows real proof: set evidence.required and source_id`);
  if (s.shot_type === prev) run++; else run = 1; prev = s.shot_type; if (run >= 3) warns.push(`${s.id}: ${run} shots in a row of type ${s.shot_type}: vary the visuals`);
}
const kinds = new Set(sb.shots.map((s) => s.shot_type)); if (kinds.size < 3) warns.push(`only ${kinds.size} different shot_type values: use at least 3`);
warns.forEach((w) => console.log('warn  ' + w)); errs.forEach((e) => console.error('ERROR ' + e));
console.log(errs.length ? `\n${errs.length} error(s)` : `storyboard OK (${sb.shots.length} shots, ${warns.length} warning(s))`); process.exit(errs.length ? 1 : 0);
