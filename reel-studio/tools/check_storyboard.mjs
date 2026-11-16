#!/usr/bin/env node
// Checks a storyboard against the component manifest BEFORE building: unknown components, missing required props, unknown transitions and
// sounds, missing evidence assets. Prints every problem with the shot id. Exit 1 on any error.
//   node tools/check_storyboard.mjs <projectDir>
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { syncProject } from './lib/pipeline.mjs';

const P = process.argv[2]; if (!P) { console.error('usage: check_storyboard.mjs <projectDir>'); process.exit(2); }
if (fs.existsSync(path.join(P, 'brief.json'))) { try { syncProject(path.resolve(P)); } catch (e) { console.error(`(could not refresh the project template: ${e.message.split('\n')[0]})`); } }   // the project copy of manifest/registry must be current
const J = (f) => { try { return JSON.parse(fs.readFileSync(path.join(P, f), 'utf8')); } catch (e) { console.error(`ERROR cannot read ${f}: ${e.message}`); process.exit(1); } };
const man = J('remotion/src/components/manifest.json'), sb = J('storyboard/storyboard.json');
const reg = fs.readFileSync(path.join(P, 'remotion/src/components/registry.ts'), 'utf8'), errs = [], warns = [];
let prev = '', run = 0;
// text components that draw bare ink (dark) text: on a dark/red/green section background they vanish
const BARE_INK = new Set(['TitleCard', 'BigStat', 'KineticList', 'Typewriter', 'Highlight', 'Checklist', 'Timeline', 'BarChart', 'LineChart']);
let sty = {}; try { sty = JSON.parse(fs.readFileSync(path.join(P, 'remotion/src/data/style.json'), 'utf8')); } catch {}
const hexOf = (b) => { const h = (sty.tokens?.bgs || sty.bgs || {})[b] || (sty.tokens?.colors?.bg && b === 'paper' ? sty.tokens.colors.bg : b); return /^#[0-9a-f]{6}/i.test(h || '') ? h : null; };
const dark = (h) => { const n = parseInt(h.slice(1, 7), 16); return (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255 < 0.5; };
for (const s of sb.shots) {
  const m = man.components[s.component]; if (!m) { errs.push(`${s.id}: component "${s.component}" is not in manifest.json. Known: ${Object.keys(man.components).join(', ')}`); continue; }
  if (s.component === 'RemocnBlock') { const nm = s.props?.name, inst = path.join(P, 'remotion/src/remocn', `${nm}.tsx`); if (nm && !fs.existsSync(inst)) errs.push(`${s.id}: remocn component "${nm}" is not installed: node tools/remocn.mjs add ${nm} --project ${P}`); }
  if (!new RegExp(`\\b${s.component}\\b`).test(reg)) errs.push(`${s.id}: "${s.component}" is in the manifest but not registered in registry.ts`);
  for (const r of m.required || []) if (s.props?.[r] == null) errs.push(`${s.id}: ${s.component} needs prop "${r}"`);
  for (const k of Object.keys(s.props || {})) if (!(k in m.props)) warns.push(`${s.id}: ${s.component} has no prop "${k}" (known: ${Object.keys(m.props).join(', ')})`);
  for (const o of s.overlays || []) { if (!(o.type in man.overlays)) errs.push(`${s.id}: unknown overlay "${o.type}" (${Object.keys(man.overlays).join(', ')})`); else if (o.anchor && !(s.anchors || []).some((x) => x.name === o.anchor)) errs.push(`${s.id}: overlay ${o.type} uses anchor "${o.anchor}" that the shot does not define`); }
  { const h = s.bg && hexOf(s.bg); if (h && dark(h) && BARE_INK.has(s.component)) warns.push(`${s.id}: bg "${s.bg}" is dark and ${s.component} draws dark ink text on it (unreadable). Use bg paper/slate for this shot or a card component (ProofCard, Versus, Ledger...).`); }
  if (s.transition_out?.type && !man.transitions.includes(s.transition_out.type)) errs.push(`${s.id}: unknown transition "${s.transition_out.type}" (${man.transitions.join(', ')})`);
  for (const f of s.sfx || []) if (!man.sfx.includes(f.type)) errs.push(`${s.id}: unknown sound "${f.type}"`);
  if (s.transition_out?.sound && s.transition_out.sound !== 'none' && !man.sfx.includes(s.transition_out.sound)) errs.push(`${s.id}: unknown transition sound "${s.transition_out.sound}"`);
  for (const k of ['image']) { const f = s.props?.[k]; if (f && !fs.existsSync(path.join(P, 'remotion/public', f)) && !(/^assets[\\/]/.test(f) && fs.existsSync(path.join(P, f)))) errs.push(`${s.id}: ${k} "${f}" not found (captures live in $P/assets/<id>/ and are published to remotion/public/assets by storyboard_review.mjs)`); }
  if (m.evidence && m.required?.includes('image') && !s.evidence?.required) warns.push(`${s.id}: ${s.component} shows real proof: set evidence.required and source_id`);
  if (s.shot_type === prev) run++; else run = 1; prev = s.shot_type; if (run >= 3) warns.push(`${s.id}: ${run} shots in a row of type ${s.shot_type}: vary the visuals`);
}
const kinds = new Set(sb.shots.map((s) => s.shot_type)); if (kinds.size < 3) warns.push(`only ${kinds.size} different shot_type values: use at least 3`);
// 3D shots: run the cinematography critic (the same maths as the renderer)
if (sb.shots.some((x) => x.component === 'Stage3D')) { const r = spawnSync('node', ['--no-warnings', path.join(path.dirname(fileURLToPath(import.meta.url)), 'check_cinematography.mjs'), P], { encoding: 'utf8' }); if (r.status) { errs.push('cinematography critic found problems:\n' + (r.stdout + r.stderr).split('\n').filter(Boolean).slice(0, 24).join('\n')); } else console.log((r.stdout.trim().split('\n').pop() || '')); }
warns.forEach((w) => console.log('warn  ' + w)); errs.forEach((e) => console.error('ERROR ' + e));
console.log(errs.length ? `\n${errs.length} error(s)` : `storyboard OK (${sb.shots.length} shots, ${warns.length} warning(s))`); process.exit(errs.length ? 1 : 0);
