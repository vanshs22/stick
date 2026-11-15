// Music selector + SFX selector. The renderer emits one cue per visual event; this agent chooses the music bed and the effect level for the
// mood and family, and the sound critic checks the finished cue list (a sound at every cut, never a pile-up, only sounds the mixer knows).
import fs from 'node:fs';
import path from 'node:path';
import { STUDIO, proj, readJSON, writeJSON, issue, scoreOf } from './core.mjs';

export function chooseSound(job) {
  const P = proj(job), sc = readJSON(path.join(P, 'script.json')), plan = readJSON(path.join(P, 'plan.json')), st = readJSON(path.join(P, 'style.json')), fam = st.family || 'stick';
  const dark = plan.scenes.filter((s) => ['fear', 'tension'].includes(s.emotion)).length / plan.scenes.length;
  const music = job.brief.music || (dark >= 0.4 ? 'tension' : ['editorial', 'facecam', 'voxel'].includes(fam) ? 'upbeat' : 'bed');
  sc.music = music; writeJSON(path.join(P, 'script.json'), sc);
  if (job.brief.music === 'none') { st.audio.sfx = Math.min(st.audio.sfx ?? 1, 0.8); writeJSON(path.join(P, 'style.json'), st); }
  return { music, sfx: st.audio.sfx ?? 1, why: dark >= 0.4 ? 'tense story' : `${fam} family` };
}

export function soundCritic(job) {
  const P = proj(job), cues = readJSON(path.join(P, 'data/cues.json'))?.cues || [], lines = readJSON(path.join(P, 'data/lines.json'))?.lines || [], plan = readJSON(path.join(P, 'plan.json'));
  const known = new Set([...fs.readFileSync(path.join(STUDIO, 'engine/tools/mix.py'), 'utf8').match(/^FX = dict\(([\s\S]*?)\)\nLEVEL/m)[1].matchAll(/(\w+?)_?=/g)].map((m) => m[1].replace('zip', 'zip')));
  const I = [], cuts = lines.slice(1).map((l, i) => l.start - 0.08).filter((_, i) => plan.scenes[i + 1]?.transition !== 'fade'), near = (t, r) => cues.some((c) => Math.abs(c.t - t) <= r);
  const cover = cuts.length ? cuts.filter((t) => near(t, 0.25)).length / cuts.length : 1;
  if (cover < 0.8) I.push(issue('cut-sound', `only ${(cover * 100).toFixed(0)}% of cuts have a sound`, 'add a swish or whoosh at each cut', 20));
  let worst = 0; cues.forEach((c) => { worst = Math.max(worst, cues.filter((d) => d.t >= c.t && d.t < c.t + 1).length); });
  if (worst > 4) I.push(issue('pile-up', `${worst} sounds inside one second`, 'thin out the cues', 15));
  const bad = [...new Set(cues.map((c) => c.type))].filter((t) => !known.has(t) && !(t === 'type' || t === 'zip'));
  if (bad.length) I.push(issue('unknown-sfx', `the mixer has no sound called ${bad.join(', ')}`, 'use a known cue', 25));
  if (cues.length < Math.max(3, lines.length * 0.6)) I.push(issue('few-sounds', `${cues.length} sounds for ${lines.length} lines`, 'add pops and tick sounds', 10));
  return { score: scoreOf(I), issues: I, stats: { cues: cues.length, cutCoverage: +cover.toFixed(2), maxPerSecond: worst } };
}
